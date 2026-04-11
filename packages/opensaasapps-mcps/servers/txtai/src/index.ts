import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("TXTAI_URL");

const client = new HttpClient(baseUrl, { type: "none" });

const server = new McpServer({
  name: "txtai",
  version: "1.0.0",
});

server.tool(
  "txtai_search",
  "Search the txtai embeddings index",
  {
    query: z.string().describe("Search query text"),
    limit: z.number().optional().default(10).describe("Maximum number of results"),
  },
  async ({ query, limit }) => {
    const result = await client.get("/search", {
      query,
      limit: String(limit),
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "txtai_add",
  "Add documents to the txtai index (call txtai_index after to persist)",
  {
    documents: z
      .array(
        z.object({
          id: z.string().describe("Document ID"),
          text: z.string().describe("Document text content"),
        })
      )
      .describe("Array of {id, text} documents to add"),
  },
  async ({ documents }) => {
    const result = await client.post("/add", documents);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "txtai_index",
  "Trigger a reindex of all added documents",
  {},
  async () => {
    const result = await client.get("/index");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "txtai_similarity",
  "Compute similarity scores between a query and a list of texts",
  {
    query: z.string().describe("Query text to compare against"),
    texts: z.array(z.string()).describe("Array of texts to compute similarity for"),
  },
  async ({ query, texts }) => {
    const result = await client.post("/similarity", { query, texts });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "txtai_transform",
  "Run a text transformation pipeline",
  {
    text: z.string().describe("Input text to transform"),
  },
  async ({ text }) => {
    const result = await client.post("/transform", { text });
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
