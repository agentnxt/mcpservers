#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TxtaiClient } from "./client.js";
import { registerSearchTools } from "./tools/search.js";

const baseUrl = process.env.TXTAI_URL;
if (!baseUrl) throw new Error("Missing required env var: TXTAI_URL");

const client = new TxtaiClient(baseUrl);
const server = new McpServer({ name: "txtai", version: "1.0.0" });

registerSearchTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
