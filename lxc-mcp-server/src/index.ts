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
const InstanceInfoInputSchema = z.object({
  name: z.string(),
});

type InstanceInfoInput = z.infer<typeof InstanceInfoInputSchema>;

const server = new Server(
  { name: "lxc-mcp-server", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

function getLxcBin(): string {
  return process.env.LXC_BIN ?? "lxc";
}

async function runCommand(
  command: string,
  args: string[],
  options: {
    timeout?: number;
    maxBuffer?: number;
  } = {}
): Promise<CommandResult> {
  const { timeout = 30_000, maxBuffer = 1024 * 1024 } = options;
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout,
      maxBuffer,
      env: process.env,
    });
    return {
      tool: "lxc",
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
      tool: "lxc",
      action: command,
      status: "error",
      summary: `Command '${command} ${args.join(" ")}' failed.`,
      stdout: (error.stdout ?? "").toString().trim(),
      stderr: (error.stderr ?? error.message ?? "").toString().trim(),
      exit_code: typeof error.code === "number" ? error.code : 1,
      requires_approval: false,
      rollback_hint: "Check LXC CLI installation and permissions",
    };
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "health",
      description: "Return server health and configured LXC command bindings.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "list_instances",
      description: "List all LXC instances in JSON format.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "instance_info",
      description: "Get detailed information about a specific LXC instance.",
      inputSchema: zodToJsonSchema(InstanceInfoInputSchema),
    },
    {
      name: "list_images",
      description: "List all available LXC images in JSON format.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "health": {
      const lxcBin = getLxcBin();
      const payload = {
        server: "lxc-mcp-server",
        status: "ready",
        protocol: "stdio",
        command_bindings: {
          list_instances: `${lxcBin} list --format json`,
          instance_info: `${lxcBin} info <name>`,
          list_images: `${lxcBin} image list --format json`,
        },
      };
      return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
    }
    case "list_instances": {
      const lxcBin = getLxcBin();
      const result = await runCommand(lxcBin, ["list", "--format", "json"]);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "instance_info": {
      const lxcBin = getLxcBin();
      const input = InstanceInfoInputSchema.parse(request.params.arguments ?? {});
      if (!input.name || input.name.trim() === "") {
        const errorResult: CommandResult = {
          tool: "lxc",
          action: "instance_info",
          status: "error",
          summary: "Instance name is required.",
          stdout: "",
          stderr: "Instance name parameter is required.",
          exit_code: 1,
          requires_approval: false,
          rollback_hint: "Provide a valid instance name",
        };
        return { content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }] };
      }
      const result = await runCommand(lxcBin, ["info", input.name]);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "list_images": {
      const lxcBin = getLxcBin();
      const result = await runCommand(lxcBin, ["image", "list", "--format", "json"]);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
