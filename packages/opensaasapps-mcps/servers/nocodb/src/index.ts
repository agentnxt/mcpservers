import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("NOCODB_URL");
const token = envRequired("NOCODB_TOKEN");

const client = new HttpClient(baseUrl, {
  type: "header",
  name: "xc-token",
  value: token,
});

const server = new McpServer({ name: "opensaasapps-nocodb", version: "1.0.0" });

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

// --- Tools ---

server.tool(
  "nocodb_list_bases",
  "List all NocoDB bases (projects)",
  {},
  async () => {
    try {
      const result = await client.get("/api/v2/meta/bases/");
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "nocodb_list_tables",
  "List all tables in a NocoDB base",
  { baseId: z.string().describe("The base (project) ID") },
  async ({ baseId }) => {
    try {
      const result = await client.get(`/api/v2/meta/bases/${baseId}/tables`);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "nocodb_list_records",
  "List records from a NocoDB table",
  {
    tableId: z.string().describe("The table ID"),
    limit: z.number().optional().describe("Max number of records to return"),
    offset: z.number().optional().describe("Number of records to skip"),
    where: z.string().optional().describe("Filter condition string"),
    sort: z.string().optional().describe("Sort string (e.g. field1,-field2)"),
    fields: z.string().optional().describe("Comma-separated list of field names to include"),
  },
  async ({ tableId, limit, offset, where, sort, fields }) => {
    try {
      const params: Record<string, string> = {};
      if (limit !== undefined) params.limit = String(limit);
      if (offset !== undefined) params.offset = String(offset);
      if (where) params.where = where;
      if (sort) params.sort = sort;
      if (fields) params.fields = fields;
      const result = await client.get(`/api/v2/public/shared-view/${tableId}/rows`, params);
      return jsonResult(result);
    } catch {
      // Fallback to data API
      try {
        const params2: Record<string, string> = {};
        if (limit !== undefined) params2.limit = String(limit);
        if (offset !== undefined) params2.offset = String(offset);
        if (where) params2.where = where;
        if (sort) params2.sort = sort;
        if (fields) params2.fields = fields;
        const result = await client.get(`/api/v2/public/shared-view/${tableId}/rows`, params2);
        return jsonResult(result);
      } catch (e: any) {
        return jsonResult({ error: e.message });
      }
    }
  }
);

server.tool(
  "nocodb_create_record",
  "Create a new record in a NocoDB table",
  {
    tableId: z.string().describe("The table ID"),
    data: z.record(z.any()).describe("Record data as key-value pairs"),
  },
  async ({ tableId, data }) => {
    try {
      const result = await client.post(`/api/v2/public/shared-view/${tableId}/rows`, data);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "nocodb_update_record",
  "Update an existing record in a NocoDB table",
  {
    tableId: z.string().describe("The table ID"),
    rowId: z.string().describe("The row ID to update"),
    data: z.record(z.any()).describe("Fields to update as key-value pairs"),
  },
  async ({ tableId, rowId, data }) => {
    try {
      // NocoDB v2 uses PATCH but HttpClient only has put; use put as a workaround
      // For proper PATCH we do a raw fetch
      const url = `${baseUrl}/api/v2/public/shared-view/${tableId}/rows/${rowId}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "xc-token": token,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`PATCH failed: ${res.status} ${await res.text()}`);
      const text = await res.text();
      const result = text ? JSON.parse(text) : {};
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "nocodb_delete_record",
  "Delete a record from a NocoDB table",
  {
    tableId: z.string().describe("The table ID"),
    rowId: z.string().describe("The row ID to delete"),
  },
  async ({ tableId, rowId }) => {
    try {
      const result = await client.delete(`/api/v2/public/shared-view/${tableId}/rows/${rowId}`);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

// --- Start ---
const transport = new StdioServerTransport();
await server.connect(transport);
