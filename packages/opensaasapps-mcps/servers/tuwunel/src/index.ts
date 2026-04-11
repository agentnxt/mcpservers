import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";
import { z } from "zod";

const server = new McpServer({ name: "tuwunel", version: "1.0.0" });

const client = new HttpClient(envRequired("MATRIX_URL"), {
  type: "bearer",
  token: envRequired("MATRIX_ACCESS_TOKEN"),
});

function txnId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

server.tool(
  "matrix_list_rooms",
  "List all joined Matrix rooms",
  {},
  async () => {
    const result = await client.get("/_matrix/client/v3/joined_rooms");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "matrix_send_message",
  "Send a text message to a Matrix room",
  {
    roomId: z.string().describe("Room ID (e.g. !abc123:example.com)"),
    message: z.string().describe("Message text to send"),
  },
  async ({ roomId, message }) => {
    const result = await client.put(
      `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txnId()}`,
      { msgtype: "m.text", body: message }
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "matrix_get_messages",
  "Get recent messages from a Matrix room",
  {
    roomId: z.string().describe("Room ID"),
    limit: z.number().optional().default(50).describe("Number of messages to fetch (default 50)"),
  },
  async ({ roomId, limit }) => {
    const result = await client.get(
      `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/messages`,
      { dir: "b", limit: String(limit) }
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "matrix_create_room",
  "Create a new Matrix room",
  {
    name: z.string().describe("Room display name"),
    room_alias_name: z.string().optional().describe("Local alias (without # and :server)"),
    visibility: z.enum(["public", "private"]).optional().default("private").describe("Room visibility"),
  },
  async ({ name, room_alias_name, visibility }) => {
    const body: Record<string, any> = { name, visibility };
    if (room_alias_name) body.room_alias_name = room_alias_name;
    const result = await client.post("/_matrix/client/v3/createRoom", body);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "matrix_invite_user",
  "Invite a user to a Matrix room",
  {
    roomId: z.string().describe("Room ID"),
    user_id: z.string().describe("User ID to invite (e.g. @user:example.com)"),
  },
  async ({ roomId, user_id }) => {
    const result = await client.post(
      `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/invite`,
      { user_id }
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "matrix_join_room",
  "Join a Matrix room by ID or alias",
  {
    roomIdOrAlias: z.string().describe("Room ID or alias (e.g. #room:example.com)"),
  },
  async ({ roomIdOrAlias }) => {
    const result = await client.post(
      `/_matrix/client/v3/join/${encodeURIComponent(roomIdOrAlias)}`,
      {}
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
