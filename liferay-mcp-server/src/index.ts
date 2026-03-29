#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { LiferayClient } from "./liferay-client.js";
import { allTools } from "./tools/index.js";

// ── Environment ──────────────────────────────────────────────────────────────
const LIFERAY_URL = process.env.LIFERAY_URL;
const LIFERAY_USERNAME = process.env.LIFERAY_USERNAME;
const LIFERAY_PASSWORD = process.env.LIFERAY_PASSWORD;

if (!LIFERAY_URL) {
  console.error("Error: LIFERAY_URL environment variable is required");
  process.exit(1);
}
if (!LIFERAY_USERNAME || !LIFERAY_PASSWORD) {
  console.error(
    "Error: LIFERAY_USERNAME and LIFERAY_PASSWORD environment variables are required"
  );
  process.exit(1);
}

// ── Client ───────────────────────────────────────────────────────────────────
const client = new LiferayClient(LIFERAY_URL, LIFERAY_USERNAME, LIFERAY_PASSWORD);

console.error(`Liferay MCP Server starting...`);
console.error(`  URL: ${LIFERAY_URL}`);
console.error(`  User: ${LIFERAY_USERNAME}`);
console.error(`  Default Site ID: ${process.env.LIFERAY_SITE_ID ?? "(not set)"}`);
console.error(`  Tools available: ${allTools.length}`);

// ── MCP Server ───────────────────────────────────────────────────────────────
const server = new Server(
  { name: "liferay-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  const tool = allTools.find((t) => t.name === name);
  if (!tool) {
    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const result = await tool.handler(client, args as Record<string, unknown>);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ── Transport ────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Liferay MCP Server ready ✓");
