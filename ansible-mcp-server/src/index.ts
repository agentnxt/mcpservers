#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const execFileAsync = promisify(execFile);

type CommandResult = {
  tool: string;
  action: string;
  status: "ok" | "error";
  summary: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  requires_approval: boolean;
  rollback_hint: string;
};

// Input schemas
const EmptySchema = z.object({});
const CheckInventoryInputSchema = z.object({
  inventory: z.string().optional(),
});
const DryRunPlaybookInputSchema = z.object({
  playbook: z.string(),
  inventory: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
const GatherFactsInputSchema = z.object({
  inventory: z.string().optional(),
  limit: z.string().optional(),
});

type CheckInventoryInput = z.infer<typeof CheckInventoryInputSchema>;
type DryRunPlaybookInput = z.infer<typeof DryRunPlaybookInputSchema>;
type GatherFactsInput = z.infer<typeof GatherFactsInputSchema>;

const server = new Server(
  { name: "ansible-mcp-server", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

function getAnsibleBin(): string {
  return process.env.ANSIBLE_BIN ?? "ansible";
}

function getPlaybookBin(): string {
  return process.env.ANSIBLE_PLAYBOOK_BIN ?? "ansible-playbook";
}

function getInventory(inputInventory?: string): string {
  return inputInventory ?? process.env.ANSIBLE_INVENTORY ?? "";
}

async function runCommand(
  command: string,
  args: string[],
  options: {
    timeout?: number;
    maxBuffer?: number;
  } = {}
): Promise<CommandResult> {
  const { timeout = 60_000, maxBuffer = 5 * 1024 * 1024 } = options;
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout,
      maxBuffer,
      env: process.env,
    });
    return {
      tool: "ansible",
      action: command,
      status: "ok",
      summary: `Executed '${command} ${args.join(" ")}' successfully.`,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exit_code: 0,
      requires_approval: false,
      rollback_hint: "Not applicable for read-only operation",
    };
  } catch (error: any) {
    return {
      tool: "ansible",
      action: command,
      status: "error",
      summary: `Command '${command} ${args.join(" ")}' failed.`,
      stdout: (error.stdout ?? "").toString().trim(),
      stderr: (error.stderr ?? error.message ?? "").toString().trim(),
      exit_code: typeof error.code === "number" ? error.code : 1,
      requires_approval: false,
      rollback_hint: "Check Ansible installation and configuration",
    };
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "health",
      description: "Return server health and configured Ansible command bindings.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "check_inventory",
      description: "Check and list Ansible inventory in JSON format.",
      inputSchema: zodToJsonSchema(CheckInventoryInputSchema),
    },
    {
      name: "dry_run_playbook",
      description: "Run a playbook in check mode (dry run) for read-only validation.",
      inputSchema: zodToJsonSchema(DryRunPlaybookInputSchema),
    },
    {
      name: "gather_facts",
      description: "Gather facts from inventory using the setup module.",
      inputSchema: zodToJsonSchema(GatherFactsInputSchema),
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "health": {
      const ansibleBin = getAnsibleBin();
      const playbookBin = getPlaybookBin();
      const payload = {
        server: "ansible-mcp-server",
        status: "ready",
        protocol: "stdio",
        command_bindings: {
          check_inventory: `${ansibleBin}-inventory --list`,
          dry_run_playbook: `${playbookBin} <playbook> --check`,
          gather_facts: `ansible all -m setup`,
        },
      };
      return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
    }
    case "check_inventory": {
      const ansibleBin = getAnsibleBin();
      const input = CheckInventoryInputSchema.parse(request.params.arguments ?? {});
      const inventory = getInventory(input.inventory);
      if (!inventory) {
        const errorResult: CommandResult = {
          tool: "ansible",
          action: "check_inventory",
          status: "error",
          summary: "Inventory is required. Set ANSIBLE_INVENTORY env var or provide inventory parameter.",
          stdout: "",
          stderr: "Inventory not specified. Use inventory parameter or set ANSIBLE_INVENTORY environment variable.",
          exit_code: 1,
          requires_approval: false,
          rollback_hint: "Provide a valid inventory path or use ANSIBLE_INVENTORY env var",
        };
        return { content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }] };
      }
      const result = await runCommand(ansibleBin, ["-inventory", inventory, "--list"]);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "dry_run_playbook": {
      const playbookBin = getPlaybookBin();
      const input = DryRunPlaybookInputSchema.parse(request.params.arguments ?? {});
      if (!input.playbook || input.playbook.trim() === "") {
        const errorResult: CommandResult = {
          tool: "ansible",
          action: "dry_run_playbook",
          status: "error",
          summary: "Playbook path is required.",
          stdout: "",
          stderr: "Playbook parameter is required.",
          exit_code: 1,
          requires_approval: false,
          rollback_hint: "Provide a valid playbook path",
        };
        return { content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }] };
      }
      const inventory = getInventory(input.inventory);
      const args = [input.playbook, "--check"];
      if (inventory) args.push("--inventory", inventory);
      if (input.tags && input.tags.length > 0) {
        args.push("--tags", input.tags.join(","));
      }
      const result = await runCommand(playbookBin, args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "gather_facts": {
      const ansibleBin = getAnsibleBin();
      const input = GatherFactsInputSchema.parse(request.params.arguments ?? {});
      const inventory = getInventory(input.inventory);
      if (!inventory) {
        const errorResult: CommandResult = {
          tool: "ansible",
          action: "gather_facts",
          status: "error",
          summary: "Inventory is required. Set ANSIBLE_INVENTORY env var or provide inventory parameter.",
          stdout: "",
          stderr: "Inventory not specified. Use inventory parameter or set ANSIBLE_INVENTORY environment variable.",
          exit_code: 1,
          requires_approval: false,
          rollback_hint: "Provide a valid inventory path or use ANSIBLE_INVENTORY env var",
        };
        return { content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }] };
      }
      const args = ["all", "-m", "setup"];
      if (input.limit) args.push("--limit", input.limit);
      const result = await runCommand(ansibleBin, args, { timeout: 120_000 });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
