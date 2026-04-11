import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

// Uptime Kuma REST API requires an API key (v1.23+).
// The API key is passed via Authorization header.
const baseUrl = envRequired("UPTIME_KUMA_URL");
const apiKey = envRequired("UPTIME_KUMA_API_KEY");

const client = new HttpClient(baseUrl, {
  type: "header",
  name: "Authorization",
  value: apiKey,
});

const server = new McpServer({
  name: "uptime-kuma",
  version: "1.0.0",
});

server.tool(
  "uptime_list_monitors",
  "List all monitors in Uptime Kuma",
  {},
  async () => {
    const result = await client.get("/api/getMonitorList");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "uptime_get_monitor",
  "Get details for a specific monitor",
  {
    id: z.string().describe("Monitor ID"),
  },
  async ({ id }) => {
    const result = await client.get(`/api/getMonitor/${encodeURIComponent(id)}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "uptime_add_monitor",
  "Add a new monitor",
  {
    name: z.string().describe("Monitor display name"),
    url: z.string().describe("URL or hostname to monitor"),
    type: z
      .enum(["http", "port", "ping", "keyword", "dns", "push", "steam", "mqtt"])
      .default("http")
      .describe("Monitor type"),
    interval: z.number().optional().default(60).describe("Check interval in seconds"),
  },
  async ({ name, url, type, interval }) => {
    const result = await client.post("/api/addMonitor", {
      name,
      url,
      type,
      interval,
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "uptime_get_status",
  "Get heartbeat list (status history) for a monitor",
  {
    id: z.string().describe("Monitor ID"),
  },
  async ({ id }) => {
    const result = await client.get(`/api/getHeartbeatList/${encodeURIComponent(id)}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "uptime_get_monitor_groups",
  "Get monitor group list with uptime summary",
  {},
  async () => {
    const result = await client.get("/api/getMonitorGroupList");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
