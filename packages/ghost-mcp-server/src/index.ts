#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GhostClient } from "./client.js";
import { registerPostTools } from "./tools/posts.js";

const baseUrl = process.env.GHOST_URL;
const adminKey = process.env.GHOST_ADMIN_KEY;

if (!baseUrl) throw new Error("Missing required env var: GHOST_URL");
if (!adminKey) throw new Error("Missing required env var: GHOST_ADMIN_KEY");

const client = new GhostClient(baseUrl, adminKey);
const server = new McpServer({ name: "ghost", version: "1.0.0" });

registerPostTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
