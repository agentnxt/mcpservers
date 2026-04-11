import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TxtaiClient } from "../client.js";

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerSearchTools(server: McpServer, client: TxtaiClient) {
  server.tool(
    "txtai_search",
    "Search the txtai embeddings index",
    {
      query: z.string().describe("Search query text"),
      limit: z.number().optional().default(10).describe("Maximum number of results"),
    },
    async ({ query, limit }) => {
      const result = await client.get("/search", { query, limit: String(limit) });
      return jsonResult(result);
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
      return jsonResult(result);
    }
  );

  server.tool(
    "txtai_index",
    "Trigger a reindex of all added documents",
    {},
    async () => {
      const result = await client.get("/index");
      return jsonResult(result);
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
      return jsonResult(result);
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
      return jsonResult(result);
    }
  );
}
