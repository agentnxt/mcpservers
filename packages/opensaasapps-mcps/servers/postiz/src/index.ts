import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("POSTIZ_URL");
const apiKey = envRequired("POSTIZ_API_KEY");

const client = new HttpClient(baseUrl, {
  type: "bearer",
  token: apiKey,
});

const server = new McpServer({
  name: "postiz",
  version: "1.0.0",
});

server.tool(
  "postiz_list_posts",
  "List all scheduled and published posts",
  {},
  async () => {
    const result = await client.get("/api/posts");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "postiz_create_post",
  "Create a new social media post",
  {
    content: z.string().describe("The post content/text"),
    channels: z.array(z.string()).describe("Array of channel IDs to post to"),
    scheduledDate: z
      .string()
      .optional()
      .describe("ISO 8601 datetime to schedule the post (omit to publish immediately)"),
  },
  async ({ content: postContent, channels, scheduledDate }) => {
    const body: Record<string, unknown> = {
      content: postContent,
      channels,
    };
    if (scheduledDate) body.scheduledDate = scheduledDate;
    const result = await client.post("/api/posts", body);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "postiz_schedule_post",
  "Schedule a post for future publication",
  {
    content: z.string().describe("The post content/text"),
    channels: z.array(z.string()).describe("Array of channel IDs to post to"),
    scheduledDate: z.string().describe("ISO 8601 datetime to schedule the post"),
  },
  async ({ content: postContent, channels, scheduledDate }) => {
    const result = await client.post("/api/posts", {
      content: postContent,
      channels,
      scheduledDate,
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "postiz_list_channels",
  "List all connected social media channels",
  {},
  async () => {
    const result = await client.get("/api/channels");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "postiz_delete_post",
  "Delete a post by ID",
  {
    id: z.string().describe("The post ID to delete"),
  },
  async ({ id }) => {
    const result = await client.delete(`/api/posts/${id}`);
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
