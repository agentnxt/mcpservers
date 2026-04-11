import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";
import { z } from "zod";

const server = new McpServer({ name: "evolution", version: "1.0.0" });

const client = new HttpClient(envRequired("EVOLUTION_URL"), {
  type: "header",
  name: "apikey",
  value: envRequired("EVOLUTION_API_KEY"),
});

server.tool(
  "evolution_list_instances",
  "List all Evolution API WhatsApp instances",
  {},
  async () => {
    const result = await client.get("/instance/fetchInstances");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "evolution_create_instance",
  "Create a new WhatsApp instance",
  {
    instanceName: z.string().describe("Name for the new instance"),
    token: z.string().optional().describe("Optional API token for this instance"),
  },
  async ({ instanceName, token }) => {
    const body: Record<string, any> = { instanceName, qrcode: true };
    if (token) body.token = token;
    const result = await client.post("/instance/create", body);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "evolution_get_instance",
  "Get connection state of a WhatsApp instance",
  {
    instanceName: z.string().describe("Instance name"),
  },
  async ({ instanceName }) => {
    const result = await client.get(`/instance/connectionState/${encodeURIComponent(instanceName)}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "evolution_send_text",
  "Send a text message via WhatsApp",
  {
    instanceName: z.string().describe("Instance name"),
    number: z.string().describe("Phone number with country code (e.g. 5511999999999)"),
    text: z.string().describe("Message text"),
  },
  async ({ instanceName, number, text }) => {
    const result = await client.post(
      `/message/sendText/${encodeURIComponent(instanceName)}`,
      { number, text }
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "evolution_send_media",
  "Send a media message (image, video, document) via WhatsApp",
  {
    instanceName: z.string().describe("Instance name"),
    number: z.string().describe("Phone number with country code"),
    mediatype: z.enum(["image", "video", "document"]).describe("Type of media"),
    media: z.string().describe("URL of the media file"),
    caption: z.string().optional().describe("Optional caption for the media"),
  },
  async ({ instanceName, number, mediatype, media, caption }) => {
    const body: Record<string, any> = { number, mediatype, media };
    if (caption) body.caption = caption;
    const result = await client.post(
      `/message/sendMedia/${encodeURIComponent(instanceName)}`,
      body
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "evolution_list_contacts",
  "List contacts for a WhatsApp instance",
  {
    instanceName: z.string().describe("Instance name"),
  },
  async ({ instanceName }) => {
    const result = await client.post(
      `/chat/findContacts/${encodeURIComponent(instanceName)}`,
      { where: {} }
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
