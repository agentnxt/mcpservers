#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RustFSClient } from "./client.js";
import { registerBucketTools } from "./tools/buckets.js";

const consoleUrl = process.env.RUSTFS_URL;
const accessKey = process.env.RUSTFS_ACCESS_KEY;
const secretKey = process.env.RUSTFS_SECRET_KEY;

if (!consoleUrl) throw new Error("Missing required env var: RUSTFS_URL");
if (!accessKey) throw new Error("Missing required env var: RUSTFS_ACCESS_KEY");
if (!secretKey) throw new Error("Missing required env var: RUSTFS_SECRET_KEY");

const client = new RustFSClient(consoleUrl, accessKey, secretKey);
const server = new McpServer({ name: "rustfs", version: "1.0.0" });

registerBucketTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
