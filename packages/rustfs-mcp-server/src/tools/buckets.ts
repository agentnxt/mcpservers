import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RustFSClient } from "../client.js";

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerBucketTools(server: McpServer, client: RustFSClient) {
  server.tool(
    "rustfs_list_buckets",
    "List all storage buckets",
    {},
    async () => {
      const result = await client.fetch("/api/v1/buckets", { method: "GET" });
      return jsonResult(result);
    }
  );

  server.tool(
    "rustfs_list_objects",
    "List objects in a bucket with optional prefix filter",
    {
      bucket: z.string().describe("Bucket name"),
      prefix: z.string().optional().default("").describe("Object key prefix to filter by"),
    },
    async ({ bucket, prefix }) => {
      const params = new URLSearchParams();
      if (prefix) params.set("prefix", prefix);
      const qs = params.toString();
      const path = `/api/v1/buckets/${encodeURIComponent(bucket)}/objects${qs ? `?${qs}` : ""}`;
      const result = await client.fetch(path, { method: "GET" });
      return jsonResult(result);
    }
  );

  server.tool(
    "rustfs_create_bucket",
    "Create a new storage bucket",
    {
      name: z.string().describe("Bucket name to create"),
      locking: z.boolean().optional().default(false).describe("Enable object locking"),
      versioning: z.boolean().optional().default(false).describe("Enable versioning"),
    },
    async ({ name, locking, versioning }) => {
      const result = await client.fetch("/api/v1/buckets", {
        method: "POST",
        body: JSON.stringify({
          name,
          locking,
          versioning: versioning ? { enabled: true } : undefined,
        }),
      });
      return jsonResult(result);
    }
  );

  server.tool(
    "rustfs_delete_object",
    "Delete an object from a bucket",
    {
      bucket: z.string().describe("Bucket name"),
      prefix: z.string().describe("Object key/path to delete"),
    },
    async ({ bucket, prefix }) => {
      const path = `/api/v1/buckets/${encodeURIComponent(bucket)}/objects?prefix=${encodeURIComponent(prefix)}`;
      const result = await client.fetch(path, { method: "DELETE" });
      return jsonResult(result);
    }
  );
}
