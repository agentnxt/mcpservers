import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("N8N_URL");
const apiKey = envRequired("N8N_API_KEY");

const client = new HttpClient(baseUrl, {
  type: "header",
  name: "X-N8N-API-KEY",
  value: apiKey,
});

const server = new McpServer({ name: "opensaasapps-n8n", version: "1.0.0" });

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

async function patchJson(path: string, body: unknown): Promise<unknown> {
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-N8N-API-KEY": apiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// --- Tools ---

server.tool(
  "n8n_list_workflows",
  "List all n8n workflows",
  {
    limit: z.number().optional().describe("Max number of workflows to return"),
    cursor: z.string().optional().describe("Pagination cursor"),
    active: z.boolean().optional().describe("Filter by active status"),
  },
  async ({ limit, cursor, active }) => {
    try {
      const params: Record<string, string> = {};
      if (limit !== undefined) params.limit = String(limit);
      if (cursor) params.cursor = cursor;
      if (active !== undefined) params.active = String(active);
      const result = await client.get("/api/v1/workflows", params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "n8n_get_workflow",
  "Get a specific n8n workflow by ID",
  { id: z.string().describe("Workflow ID") },
  async ({ id }) => {
    try {
      const result = await client.get(`/api/v1/workflows/${id}`);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "n8n_activate_workflow",
  "Activate an n8n workflow",
  { id: z.string().describe("Workflow ID to activate") },
  async ({ id }) => {
    try {
      const result = await patchJson(`/api/v1/workflows/${id}`, { active: true });
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "n8n_deactivate_workflow",
  "Deactivate an n8n workflow",
  { id: z.string().describe("Workflow ID to deactivate") },
  async ({ id }) => {
    try {
      const result = await patchJson(`/api/v1/workflows/${id}`, { active: false });
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "n8n_list_executions",
  "List n8n workflow executions",
  {
    limit: z.number().optional().describe("Max number of executions to return"),
    cursor: z.string().optional().describe("Pagination cursor"),
    workflowId: z.string().optional().describe("Filter by workflow ID"),
    status: z.string().optional().describe("Filter by status (success, error, waiting)"),
  },
  async ({ limit, cursor, workflowId, status }) => {
    try {
      const params: Record<string, string> = {};
      if (limit !== undefined) params.limit = String(limit);
      if (cursor) params.cursor = cursor;
      if (workflowId) params.workflowId = workflowId;
      if (status) params.status = status;
      const result = await client.get("/api/v1/executions", params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "n8n_get_execution",
  "Get a specific n8n execution by ID",
  { id: z.string().describe("Execution ID") },
  async ({ id }) => {
    try {
      const result = await client.get(`/api/v1/executions/${id}`);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

// --- Start ---
const transport = new StdioServerTransport();
await server.connect(transport);
