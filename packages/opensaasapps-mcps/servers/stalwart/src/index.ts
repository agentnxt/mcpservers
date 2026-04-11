import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";
import { z } from "zod";

const server = new McpServer({ name: "stalwart", version: "1.0.0" });

const client = new HttpClient(envRequired("STALWART_URL"), {
  type: "basic",
  username: envRequired("STALWART_USER"),
  password: envRequired("STALWART_PASS"),
});

server.tool(
  "stalwart_list_accounts",
  "List all individual email accounts",
  {},
  async () => {
    const result = await client.get("/api/principal", { type: "individual" });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "stalwart_get_account",
  "Get details of a specific email account",
  { name: z.string().describe("Account name / username") },
  async ({ name }) => {
    const result = await client.get(`/api/principal/${encodeURIComponent(name)}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "stalwart_create_account",
  "Create a new individual email account",
  {
    name: z.string().describe("Username for the account"),
    password: z.string().describe("Password for the account"),
    email: z.string().describe("Primary email address"),
  },
  async ({ name, password, email }) => {
    const result = await client.post("/api/principal", {
      type: "individual",
      name,
      secrets: [password],
      emails: [email],
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "stalwart_list_domains",
  "List all configured email domains",
  {},
  async () => {
    const result = await client.get("/api/domain");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
