import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("MATOMO_URL");
const token = envRequired("MATOMO_TOKEN");

const client = new HttpClient(baseUrl, {
  type: "query",
  params: { token_auth: token },
});

const server = new McpServer({
  name: "matomo",
  version: "1.0.0",
});

server.tool(
  "matomo_get_visits",
  "Get visit summary statistics for a site",
  {
    idSite: z.string().describe("Matomo site ID"),
    period: z.enum(["day", "week", "month", "year"]).describe("Reporting period"),
    date: z.string().describe("Date or date range (e.g. 'today', 'yesterday', '2024-01-01,2024-01-31')"),
  },
  async ({ idSite, period, date }) => {
    const result = await client.get("/index.php", {
      module: "API",
      method: "VisitsSummary.get",
      idSite,
      period,
      date,
      format: "JSON",
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "matomo_get_actions",
  "Get action metrics (page views, downloads, outlinks) for a site",
  {
    idSite: z.string().describe("Matomo site ID"),
    period: z.enum(["day", "week", "month", "year"]).describe("Reporting period"),
    date: z.string().describe("Date or date range"),
  },
  async ({ idSite, period, date }) => {
    const result = await client.get("/index.php", {
      module: "API",
      method: "Actions.get",
      idSite,
      period,
      date,
      format: "JSON",
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "matomo_get_referrers",
  "Get referrer type breakdown for a site",
  {
    idSite: z.string().describe("Matomo site ID"),
    period: z.enum(["day", "week", "month", "year"]).describe("Reporting period"),
    date: z.string().describe("Date or date range"),
  },
  async ({ idSite, period, date }) => {
    const result = await client.get("/index.php", {
      module: "API",
      method: "Referrers.getReferrerType",
      idSite,
      period,
      date,
      format: "JSON",
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "matomo_get_live_visitors",
  "Get last N live visitor details for a site",
  {
    idSite: z.string().describe("Matomo site ID"),
    count: z.string().optional().default("10").describe("Number of visitors to return"),
  },
  async ({ idSite, count }) => {
    const result = await client.get("/index.php", {
      module: "API",
      method: "Live.getLastVisitsDetails",
      idSite,
      period: "day",
      date: "today",
      filter_limit: count,
      format: "JSON",
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "matomo_get_sites",
  "List all sites tracked in Matomo",
  {},
  async () => {
    const result = await client.get("/index.php", {
      module: "API",
      method: "SitesManager.getAllSites",
      format: "JSON",
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
