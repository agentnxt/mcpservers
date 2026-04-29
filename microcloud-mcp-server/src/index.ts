#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const execFileAsync = promisify(execFile);
const EmptySchema = z.object({});

type CommandResult = {
  tool: string;
  action: string;
  status: "ok" | "error";
  summary: string;
  stdout: string;
  stderr: string;
  exit_code: number;
};

const server = new Server(
  { name: "microcloud-mcp-server", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

function getCommandFor(action: string): string {
  const envMap: Record<string, string | undefined> = {
    cluster_status: process.env.MICROCLOUD_CLUSTER_STATUS_CMD,
    node_status: process.env.MICROCLOUD_NODE_STATUS_CMD,
    storage_status: process.env.MICROCLOUD_STORAGE_STATUS_CMD,
    network_status: process.env.MICROCLOUD_NETWORK_STATUS_CMD,
  };
  return envMap[action] ?? "microcloud status";
}

async function runShellAction(action: string): Promise<CommandResult> {
  const command = getCommandFor(action);
  try {
    const { stdout, stderr } = await execFileAsync("/bin/sh", ["-lc", command], {
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
      env: process.env,
    });
    return {
      tool: "microcloud",
      action,
      status: "ok",
      summary: `Executed '${command}' successfully.`,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exit_code: 0,
    };
  } catch (error: any) {
    return {
      tool: "microcloud",
      action,
      status: "error",
      summary: `Command failed for action '${action}'.`,
      stdout: (error.stdout ?? "").toString().trim(),
      stderr: (error.stderr ?? error.message ?? "").toString().trim(),
      exit_code: typeof error.code === "number" ? error.code : 1,
    };
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "health",
      description: "Return server health and configured MicroCloud command bindings.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "cluster_status",
      description: "Run the configured read-only MicroCloud cluster status command.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "node_status",
      description: "Run the configured read-only MicroCloud node status command.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "storage_status",
      description: "Run the configured read-only MicroCloud storage status command.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "network_status",
      description: "Run the configured read-only MicroCloud network status command.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "health": {
      const payload = {
        server: "microcloud-mcp-server",
        status: "ready",
        protocol: "stdio",
        command_bindings: {
          cluster_status: getCommandFor("cluster_status"),
          node_status: getCommandFor("node_status"),
          storage_status: getCommandFor("storage_status"),
          network_status: getCommandFor("network_status"),
        },
      };
      return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
    }
    case "cluster_status":
    case "node_status":
    case "storage_status":
    case "network_status": {
      const result = await runShellAction(request.params.name);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
