import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";
import { z } from "zod";

const server = new McpServer({ name: "wuzapi", version: "1.0.0" });

const client = new HttpClient(envRequired("WUZAPI_URL"), {
  type: "header",
  name: "Token",
  value: envRequired("WUZAPI_TOKEN"),
});

server.tool(
  "wuzapi_check_status",
  "Check WhatsApp session connection status",
  {},
  async () => {
    const result = await client.get("/session/status");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "wuzapi_send_message",
  "Send a text message via WhatsApp",
  {
    phone: z.string().describe("Phone number with country code (e.g. 5511999999999)"),
    body: z.string().describe("Message text"),
  },
  async ({ phone, body }) => {
    const result = await client.post("/chat/send/text", { phone, body });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "wuzapi_get_contacts",
  "Get all WhatsApp contacts",
  {},
  async () => {
    const result = await client.get("/user/contacts");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "wuzapi_get_chats",
  "List all WhatsApp chats",
  {},
  async () => {
    const result = await client.get("/chat/list");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "wuzapi_get_messages",
  "Get messages from a specific chat",
  {
    phone: z.string().describe("Phone number with country code"),
    count: z.number().optional().default(20).describe("Number of messages to retrieve (default 20)"),
  },
  async ({ phone, count }) => {
    const result = await client.post("/chat/messages", { phone, count });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
