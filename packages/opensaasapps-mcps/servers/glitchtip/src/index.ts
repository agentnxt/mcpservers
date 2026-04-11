import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("GLITCHTIP_URL");
const token = envRequired("GLITCHTIP_TOKEN");

const client = new HttpClient(baseUrl, {
  type: "bearer",
  token,
});

const server = new McpServer({
  name: "glitchtip",
  version: "1.0.0",
});

server.tool(
  "glitchtip_list_organizations",
  "List all organizations in GlitchTip",
  {},
  async () => {
    const result = await client.get("/api/0/organizations/");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "glitchtip_list_projects",
  "List projects for an organization",
  {
    org: z.string().describe("Organization slug"),
  },
  async ({ org }) => {
    const result = await client.get(`/api/0/organizations/${encodeURIComponent(org)}/projects/`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "glitchtip_list_issues",
  "List issues for a project",
  {
    org: z.string().describe("Organization slug"),
    project: z.string().describe("Project slug"),
  },
  async ({ org, project }) => {
    const result = await client.get(
      `/api/0/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/issues/`
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "glitchtip_get_issue",
  "Get details for a specific issue",
  {
    id: z.string().describe("Issue ID"),
  },
  async ({ id }) => {
    const result = await client.get(`/api/0/issues/${encodeURIComponent(id)}/`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "glitchtip_resolve_issue",
  "Resolve an issue by setting its status to resolved",
  {
    id: z.string().describe("Issue ID"),
  },
  async ({ id }) => {
    const result = await client.put(`/api/0/issues/${encodeURIComponent(id)}/`, {
      status: "resolved",
    });
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
