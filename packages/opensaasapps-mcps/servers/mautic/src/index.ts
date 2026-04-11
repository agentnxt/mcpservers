import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";
import { z } from "zod";

const server = new McpServer({ name: "mautic", version: "1.0.0" });

const client = new HttpClient(envRequired("MAUTIC_URL"), {
  type: "basic",
  username: envRequired("MAUTIC_USER"),
  password: envRequired("MAUTIC_PASS"),
});

server.tool(
  "mautic_list_contacts",
  "List all Mautic contacts",
  {},
  async () => {
    const result = await client.get("/api/contacts");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "mautic_get_contact",
  "Get a specific Mautic contact by ID",
  {
    id: z.number().describe("Contact ID"),
  },
  async ({ id }) => {
    const result = await client.get(`/api/contacts/${id}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "mautic_create_contact",
  "Create a new contact in Mautic",
  {
    firstname: z.string().describe("First name"),
    lastname: z.string().describe("Last name"),
    email: z.string().describe("Email address"),
  },
  async ({ firstname, lastname, email }) => {
    const result = await client.post("/api/contacts/new", {
      firstname,
      lastname,
      email,
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "mautic_list_emails",
  "List all Mautic email templates",
  {},
  async () => {
    const result = await client.get("/api/emails");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "mautic_send_email",
  "Send an email to a specific contact",
  {
    emailId: z.number().describe("Email template ID"),
    contactId: z.number().describe("Contact ID to send to"),
  },
  async ({ emailId, contactId }) => {
    const result = await client.post(`/api/emails/${emailId}/contact/${contactId}/send`, {});
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "mautic_list_campaigns",
  "List all Mautic campaigns",
  {},
  async () => {
    const result = await client.get("/api/campaigns");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "mautic_list_segments",
  "List all Mautic contact segments",
  {},
  async () => {
    const result = await client.get("/api/segments");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
