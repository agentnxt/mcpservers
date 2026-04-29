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
const PlanInputSchema = z.object({
  workdir: z.string().optional(),
  out_plan: z.string().optional(),
});
const ShowStateSummaryInputSchema = z.object({
  plan_file: z.string().optional(),
});

type PlanInput = z.infer<typeof PlanInputSchema>;
type ShowStateSummaryInput = z.infer<typeof ShowStateSummaryInputSchema>;

const server = new Server(
  { name: "terraform-mcp-server", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

function getTerraformBin(): string {
  return process.env.TERRAFORM_BIN ?? "terraform";
}

function getWorkdir(inputWorkdir?: string): string {
  return inputWorkdir ?? process.env.TERRAFORM_WORKDIR ?? process.cwd();
}

function getPlanOut(inputPlanOut?: string): string {
  return inputPlanOut ?? process.env.TERRAFORM_PLAN_OUT ?? "tfplan";
}

async function runCommand(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    timeout?: number;
    maxBuffer?: number;
  } = {}
): Promise<CommandResult> {
  const { cwd = process.cwd(), timeout = 60_000, maxBuffer = 5 * 1024 * 1024 } = options;
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      timeout,
      maxBuffer,
      env: process.env,
    });
    return {
      tool: "terraform",
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
      tool: "terraform",
      action: command,
      status: "error",
      summary: `Command '${command} ${args.join(" ")}' failed.`,
      stdout: (error.stdout ?? "").toString().trim(),
      stderr: (error.stderr ?? error.message ?? "").toString().trim(),
      exit_code: typeof error.code === "number" ? error.code : 1,
      requires_approval: false,
      rollback_hint: "Check Terraform CLI installation and working directory",
    };
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "health",
      description: "Return server health and configured Terraform CLI bindings.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "fmt_check",
      description: "Run 'terraform fmt -check' to validate Terraform file formatting.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "validate",
      description: "Run 'terraform validate' to validate Terraform configuration.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "plan",
      description: "Run 'terraform plan' to create a Terraform execution plan.",
      inputSchema: zodToJsonSchema(PlanInputSchema),
    },
    {
      name: "show_state_summary",
      description: "Show the state from a Terraform plan file in JSON format.",
      inputSchema: zodToJsonSchema(ShowStateSummaryInputSchema),
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "health": {
      const terraformBin = getTerraformBin();
      const payload = {
        server: "terraform-mcp-server",
        status: "ready",
        protocol: "stdio",
        command_bindings: {
          fmt_check: `${terraformBin} fmt -check`,
          validate: `${terraformBin} validate`,
          plan: `${terraformBin} plan -out=tfplan`,
          show_state_summary: `${terraformBin} show -json tfplan`,
        },
      };
      return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
    }
    case "fmt_check": {
      const terraformBin = getTerraformBin();
      const result = await runCommand(terraformBin, ["fmt", "-check"], { cwd: getWorkdir() });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "validate": {
      const terraformBin = getTerraformBin();
      const result = await runCommand(terraformBin, ["validate"], { cwd: getWorkdir() });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "plan": {
      const terraformBin = getTerraformBin();
      const input = PlanInputSchema.parse(request.params.arguments ?? {});
      const workdir = getWorkdir(input.workdir);
      const planOut = input.out_plan ?? getPlanOut();
      const result = await runCommand(terraformBin, ["plan", "-out", planOut], { cwd: workdir });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "show_state_summary": {
      const terraformBin = getTerraformBin();
      const input = ShowStateSummaryInputSchema.parse(request.params.arguments ?? {});
      const planFile = input.plan_file ?? getPlanOut();
      const workdir = getWorkdir();
      // Check if plan file exists before attempting to show
      const fs = await import("node:fs");
      const planPath = `${workdir}/${planFile}`;
      if (!fs.existsSync(planPath)) {
        const errorResult: CommandResult = {
          tool: "terraform",
          action: "show_state_summary",
          status: "error",
          summary: `Plan file '${planFile}' not found in '${workdir}'.`,
          stdout: "",
          stderr: `Plan file '${planFile}' not found at path: ${planPath}`,
          exit_code: 1,
          requires_approval: false,
          rollback_hint: "Run 'terraform plan' first to create a plan file",
        };
        return { content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }] };
      }
      const result = await runCommand(terraformBin, ["show", "-json", planFile], { cwd: workdir });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
