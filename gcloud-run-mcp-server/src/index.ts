#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "gcloud-run-mcp-server", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "health",
      description: "Return scaffold server status and implementation intent.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "health":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              server: "gcloud-run-mcp-server",
              status: "scaffold",
              next_step: "Implement live tool adapters and approval gates"
            }, null, 2)
          }
        ]
      };
    default:
      throw new Error();
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
