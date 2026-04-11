import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// --- Config ---
const LIFERAY_BASE_URL = process.env.LIFERAY_BASE_URL || "http://51.75.251.56:8080";
const LIFERAY_USER = process.env.LIFERAY_USER || "test@liferay.com";
const LIFERAY_PASSWORD = process.env.LIFERAY_PASSWORD || "123456";

const AUTH_HEADER = "Basic " + Buffer.from(`${LIFERAY_USER}:${LIFERAY_PASSWORD}`).toString("base64");

// --- Helper: call Liferay API ---
async function liferayFetch(path, options = {}) {
  const url = `${LIFERAY_BASE_URL}${path}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      "Authorization": AUTH_HEADER,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    },
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Liferay API error ${resp.status}: ${body}`);
  }

  return resp.json();
}

// --- MCP Server ---
const server = new McpServer({
  name: "liferay-community-portal",
  version: "1.0.0",
});

// ==========================================
// TOOL 1: List Sites (test API)
// ==========================================
server.tool(
  "list-sites",
  "List all Liferay sites accessible to the current user",
  {},
  async () => {
    const data = await liferayFetch("/o/headless-admin-user/v1.0/my-user-account/sites");
    const sites = (data.items || []).map((s) => ({
      id: s.id,
      name: s.descriptiveName || s.name,
      friendlyUrlPath: s.friendlyUrlPath,
      membershipType: s.membershipType,
      key: s.key,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(sites, null, 2),
        },
      ],
    };
  }
);

// ==========================================
// TOOL 2: Get Site by ID
// ==========================================
server.tool(
  "get-site",
  "Get details of a specific Liferay site by its ID",
  {
    siteId: z.number().describe("The site/group ID"),
  },
  async ({ siteId }) => {
    const data = await liferayFetch(`/o/headless-admin-user/v1.0/sites/${siteId}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// --- Start ---
const transport = new StdioServerTransport();
await server.connect(transport);
