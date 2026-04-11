import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { envRequired } from "../../../shared/src/env.js";

// RustFS console API (port 9001 by default, or user provides it)
const consoleUrl = envRequired("RUSTFS_URL").replace(/\/$/, "");
const accessKey = envRequired("RUSTFS_ACCESS_KEY");
const secretKey = envRequired("RUSTFS_SECRET_KEY");

let sessionToken: string | null = null;

// Login to the RustFS/MinIO console API and get a session token
async function login(): Promise<string> {
  if (sessionToken) return sessionToken;
  const res = await fetch(`${consoleUrl}/api/v1/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessKey, secretKey }),
  });
  if (!res.ok) {
    throw new Error(`RustFS login failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  // The console API typically returns a sessionId or token in the response
  // and also sets a cookie. We'll use the token from the response body.
  sessionToken = data.sessionId || data.token || null;
  // Also check for Set-Cookie header as fallback
  if (!sessionToken) {
    const cookie = res.headers.get("set-cookie");
    if (cookie) {
      sessionToken = cookie;
    }
  }
  if (!sessionToken) {
    throw new Error("RustFS login: no session token received");
  }
  return sessionToken;
}

// Authenticated fetch helper for console API
async function consoleFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await login();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  // Try both Cookie and Authorization header patterns
  if (token.includes("=")) {
    headers["Cookie"] = token;
  } else {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${consoleUrl}${path}`, {
    ...options,
    headers,
  });
  if (res.status === 401) {
    // Session expired, re-login
    sessionToken = null;
    const newToken = await login();
    if (newToken.includes("=")) {
      headers["Cookie"] = newToken;
    } else {
      headers["Authorization"] = `Bearer ${newToken}`;
    }
    const retry = await fetch(`${consoleUrl}${path}`, { ...options, headers });
    if (!retry.ok) {
      throw new Error(`${options.method || "GET"} ${path} failed: ${retry.status} ${await retry.text()}`);
    }
    const text = await retry.text();
    return text ? JSON.parse(text) : {};
  }
  if (!res.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${res.status} ${await res.text()}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

const server = new McpServer({
  name: "rustfs",
  version: "1.0.0",
});

server.tool(
  "rustfs_list_buckets",
  "List all storage buckets",
  {},
  async () => {
    const result = await consoleFetch("/api/v1/buckets", { method: "GET" });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
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
    const result = await consoleFetch(path, { method: "GET" });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
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
    const result = await consoleFetch("/api/v1/buckets", {
      method: "POST",
      body: JSON.stringify({
        name,
        locking,
        versioning: versioning ? { enabled: true } : undefined,
      }),
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
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
    const result = await consoleFetch(path, { method: "DELETE" });
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
