import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("ERPNEXT_URL");
const apiKey = envRequired("ERPNEXT_API_KEY");
const apiSecret = envRequired("ERPNEXT_API_SECRET");

const client = new HttpClient(baseUrl, {
  type: "header",
  name: "Authorization",
  value: `token ${apiKey}:${apiSecret}`,
});

const server = new McpServer({ name: "opensaasapps-erpnext", version: "1.0.0" });

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

// --- Tools ---

server.tool(
  "erpnext_list_docs",
  "List documents of a given DocType in ERPNext",
  {
    doctype: z.string().describe("The DocType to list (e.g. Customer, Sales Order, Item)"),
    filters: z.string().optional().describe("JSON-encoded filters array (e.g. [[\"status\",\"=\",\"Open\"]])"),
    fields: z.string().optional().describe("Comma-separated list of fields to return"),
    limit_page_length: z.number().optional().describe("Max number of records to return (default 20)"),
    limit_start: z.number().optional().describe("Offset for pagination"),
    order_by: z.string().optional().describe("Order by clause (e.g. modified desc)"),
  },
  async ({ doctype, filters, fields, limit_page_length, limit_start, order_by }) => {
    try {
      const params: Record<string, string> = {};
      if (filters) params.filters = filters;
      if (fields) params.fields = `["${fields.split(",").map(f => f.trim()).join('","')}"]`;
      if (limit_page_length !== undefined) params.limit_page_length = String(limit_page_length);
      if (limit_start !== undefined) params.limit_start = String(limit_start);
      if (order_by) params.order_by = order_by;
      const result = await client.get(`/api/resource/${encodeURIComponent(doctype)}`, params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "erpnext_get_doc",
  "Get a specific document from ERPNext",
  {
    doctype: z.string().describe("The DocType (e.g. Customer, Sales Order)"),
    name: z.string().describe("The document name/ID"),
  },
  async ({ doctype, name }) => {
    try {
      const result = await client.get(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "erpnext_create_doc",
  "Create a new document in ERPNext",
  {
    doctype: z.string().describe("The DocType to create (e.g. Customer, Item)"),
    data: z.record(z.any()).describe("Document fields as key-value pairs"),
  },
  async ({ doctype, data }) => {
    try {
      const result = await client.post(`/api/resource/${encodeURIComponent(doctype)}`, data);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "erpnext_update_doc",
  "Update an existing document in ERPNext",
  {
    doctype: z.string().describe("The DocType (e.g. Customer, Sales Order)"),
    name: z.string().describe("The document name/ID"),
    data: z.record(z.any()).describe("Fields to update as key-value pairs"),
  },
  async ({ doctype, name, data }) => {
    try {
      const result = await client.put(
        `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
        data
      );
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "erpnext_search",
  "Search across ERPNext using frappe.client.get_list",
  {
    doctype: z.string().describe("The DocType to search"),
    filters: z.string().optional().describe("JSON-encoded filters array"),
    fields: z.string().optional().describe("Comma-separated list of fields"),
    limit_page_length: z.number().optional().describe("Max records to return"),
    order_by: z.string().optional().describe("Order by clause"),
    or_filters: z.string().optional().describe("JSON-encoded OR filters array"),
  },
  async ({ doctype, filters, fields, limit_page_length, order_by, or_filters }) => {
    try {
      const params: Record<string, string> = { doctype };
      if (filters) params.filters = filters;
      if (fields) params.fields = `["${fields.split(",").map(f => f.trim()).join('","')}"]`;
      if (limit_page_length !== undefined) params.limit_page_length = String(limit_page_length);
      if (order_by) params.order_by = order_by;
      if (or_filters) params.or_filters = or_filters;
      const result = await client.get("/api/method/frappe.client.get_list", params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

// --- Start ---
const transport = new StdioServerTransport();
await server.connect(transport);
