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
const ListServicesInputSchema = z.object({
  project: z.string().optional(),
  region: z.string().optional(),
});
const DescribeServiceInputSchema = z.object({
  service: z.string(),
  project: z.string().optional(),
  region: z.string().optional(),
});
const ListRevisionsInputSchema = z.object({
  service: z.string().optional(),
  project: z.string().optional(),
  region: z.string().optional(),
});
const ReadLogsInputSchema = z.object({
  service: z.string(),
  project: z.string().optional(),
  region: z.string().optional(),
  limit: z.number().optional(),
});

type ListServicesInput = z.infer<typeof ListServicesInputSchema>;
type DescribeServiceInput = z.infer<typeof DescribeServiceInputSchema>;
type ListRevisionsInput = z.infer<typeof ListRevisionsInputSchema>;
type ReadLogsInput = z.infer<typeof ReadLogsInputSchema>;

const server = new Server(
  { name: "gcloud-run-mcp-server", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

function getGcloudBin(): string {
  return process.env.GCLOUD_BIN ?? "gcloud";
}

function getProject(inputProject?: string): string {
  return inputProject ?? process.env.GCLOUD_PROJECT ?? "";
}

function getRegion(inputRegion?: string): string {
  return inputRegion ?? process.env.GCLOUD_REGION ?? "us-central1";
}

async function runCommand(
  command: string,
  args: string[],
  options: {
    timeout?: number;
    maxBuffer?: number;
  } = {}
): Promise<CommandResult> {
  const { timeout = 60_000, maxBuffer = 2 * 1024 * 1024 } = options;
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout,
      maxBuffer,
      env: process.env,
    });
    return {
      tool: "gcloud",
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
      tool: "gcloud",
      action: command,
      status: "error",
      summary: `Command '${command} ${args.join(" ")}' failed.`,
      stdout: (error.stdout ?? "").toString().trim(),
      stderr: (error.stderr ?? error.message ?? "").toString().trim(),
      exit_code: typeof error.code === "number" ? error.code : 1,
      requires_approval: false,
      rollback_hint: "Check gcloud CLI installation and authentication",
    };
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "health",
      description: "Return server health and configured gcloud command bindings.",
      inputSchema: zodToJsonSchema(EmptySchema),
    },
    {
      name: "list_services",
      description: "List all Cloud Run services in JSON format.",
      inputSchema: zodToJsonSchema(ListServicesInputSchema),
    },
    {
      name: "describe_service",
      description: "Describe a specific Cloud Run service in JSON format.",
      inputSchema: zodToJsonSchema(DescribeServiceInputSchema),
    },
    {
      name: "list_revisions",
      description: "List all revisions for a Cloud Run service in JSON format.",
      inputSchema: zodToJsonSchema(ListRevisionsInputSchema),
    },
    {
      name: "read_logs",
      description: "Read logs from a Cloud Run service with bounded limit.",
      inputSchema: zodToJsonSchema(ReadLogsInputSchema),
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "health": {
      const gcloudBin = getGcloudBin();
      const payload = {
        server: "gcloud-run-mcp-server",
        status: "ready",
        protocol: "stdio",
        command_bindings: {
          list_services: `${gcloudBin} run services list --format=json`,
          describe_service: `${gcloudBin} run services describe <service> --format=json`,
          list_revisions: `${gcloudBin} run revisions list --format=json`,
          read_logs: `${gcloudBin} logs read --limit=50`,
        },
      };
      return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
    }
    case "list_services": {
      const gcloudBin = getGcloudBin();
      const input = ListServicesInputSchema.parse(request.params.arguments ?? {});
      const project = getProject(input.project);
      const region = getRegion(input.region);
      const args = ["run", "services", "list", "--format=json"];
      if (project) args.push("--project", project);
      if (region) args.push("--region", region);
      const result = await runCommand(gcloudBin, args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "describe_service": {
      const gcloudBin = getGcloudBin();
      const input = DescribeServiceInputSchema.parse(request.params.arguments ?? {});
      if (!input.service || input.service.trim() === "") {
        const errorResult: CommandResult = {
          tool: "gcloud",
          action: "describe_service",
          status: "error",
          summary: "Service name is required.",
          stdout: "",
          stderr: "Service name parameter is required.",
          exit_code: 1,
          requires_approval: false,
          rollback_hint: "Provide a valid service name",
        };
        return { content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }] };
      }
      const project = getProject(input.project);
      const region = getRegion(input.region);
      const args = ["run", "services", "describe", input.service, "--format=json"];
      if (project) args.push("--project", project);
      if (region) args.push("--region", region);
      const result = await runCommand(gcloudBin, args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "list_revisions": {
      const gcloudBin = getGcloudBin();
      const input = ListRevisionsInputSchema.parse(request.params.arguments ?? {});
      const project = getProject(input.project);
      const region = getRegion(input.region);
      const args = ["run", "revisions", "list", "--format=json"];
      if (input.service) args.push("--service", input.service);
      if (project) args.push("--project", project);
      if (region) args.push("--region", region);
      const result = await runCommand(gcloudBin, args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    case "read_logs": {
      const gcloudBin = getGcloudBin();
      const input = ReadLogsInputSchema.parse(request.params.arguments ?? {});
      if (!input.service || input.service.trim() === "") {
        const errorResult: CommandResult = {
          tool: "gcloud",
          action: "read_logs",
          status: "error",
          summary: "Service name is required.",
          stdout: "",
          stderr: "Service name parameter is required.",
          exit_code: 1,
          requires_approval: false,
          rollback_hint: "Provide a valid service name",
        };
        return { content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }] };
      }
      const project = getProject(input.project);
      const region = getRegion(input.region);
      const limit = input.limit ?? 50;
      const args = [
        "run",
        "services",
        "logs",
        "read",
        "--service",
        input.service,
        "--limit",
        String(limit),
      ];
      if (project) args.push("--project", project);
      if (region) args.push("--region", region);
      const result = await runCommand(gcloudBin, args);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
