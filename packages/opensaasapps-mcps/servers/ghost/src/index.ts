import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { envRequired } from "../../../shared/src/env.js";
import crypto from "node:crypto";

const baseUrl = envRequired("GHOST_URL").replace(/\/$/, "");
const adminKey = envRequired("GHOST_ADMIN_KEY");

const [keyId, keySecret] = adminKey.split(":");
if (!keyId || !keySecret) {
  throw new Error("GHOST_ADMIN_KEY must be in format {id}:{secret}");
}

const server = new McpServer({ name: "opensaasapps-ghost", version: "1.0.0" });

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

// --- JWT generation for Ghost Admin API ---

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createGhostJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", kid: keyId, typ: "JWT" };
  const payload = { iat: now, exp: now + 300, aud: "/admin/" };

  const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const secretBuf = Buffer.from(keySecret, "hex");
  const signature = crypto.createHmac("sha256", secretBuf).update(signingInput).digest();

  return `${signingInput}.${base64url(signature)}`;
}

function ghostHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Ghost ${createGhostJwt()}`,
  };
}

async function ghostGet(path: string, params?: Record<string, string>): Promise<unknown> {
  let url = `${baseUrl}${path}`;
  if (params) {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    url = u.toString();
  }
  const res = await fetch(url, { headers: ghostHeaders() });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function ghostPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: ghostHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function ghostPut(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "PUT",
    headers: ghostHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

async function ghostDelete(path: string): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "DELETE",
    headers: ghostHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// --- Tools ---

server.tool(
  "ghost_list_posts",
  "List posts from Ghost CMS",
  {
    limit: z.number().optional().describe("Max number of posts to return (default 15)"),
    page: z.number().optional().describe("Page number for pagination"),
    filter: z.string().optional().describe("NQL filter string (e.g. tag:news+status:published)"),
    fields: z.string().optional().describe("Comma-separated fields to include"),
    formats: z.string().optional().describe("Content formats: html, mobiledoc, plaintext"),
    include: z.string().optional().describe("Comma-separated relations: tags, authors"),
    order: z.string().optional().describe("Order clause (e.g. published_at desc)"),
    status: z.string().optional().describe("Filter by status: published, draft, scheduled"),
  },
  async ({ limit, page, filter, fields, formats, include, order, status }) => {
    try {
      const params: Record<string, string> = {};
      if (limit !== undefined) params.limit = String(limit);
      if (page !== undefined) params.page = String(page);
      if (filter) params.filter = filter;
      if (fields) params.fields = fields;
      if (formats) params.formats = formats;
      if (include) params.include = include;
      if (order) params.order = order;
      if (status) params.status = status;
      const result = await ghostGet("/ghost/api/admin/posts/", params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "ghost_get_post",
  "Get a specific Ghost post by ID",
  {
    id: z.string().describe("Post ID"),
    formats: z.string().optional().describe("Content formats: html, mobiledoc, plaintext"),
    include: z.string().optional().describe("Comma-separated relations: tags, authors"),
  },
  async ({ id, formats, include }) => {
    try {
      const params: Record<string, string> = {};
      if (formats) params.formats = formats;
      if (include) params.include = include;
      const result = await ghostGet(`/ghost/api/admin/posts/${id}/`, params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "ghost_create_post",
  "Create a new Ghost post",
  {
    title: z.string().describe("Post title"),
    html: z.string().optional().describe("Post body as HTML"),
    mobiledoc: z.string().optional().describe("Post body as mobiledoc JSON string"),
    status: z.string().optional().describe("Post status: draft, published, scheduled"),
    tags: z.array(z.object({ name: z.string() })).optional().describe("Tags to assign"),
    featured: z.boolean().optional().describe("Whether the post is featured"),
    excerpt: z.string().optional().describe("Custom excerpt"),
    published_at: z.string().optional().describe("ISO 8601 publish date"),
  },
  async ({ title, html, mobiledoc, status, tags, featured, excerpt, published_at }) => {
    try {
      const post: Record<string, unknown> = { title };
      if (html !== undefined) post.html = html;
      if (mobiledoc !== undefined) post.mobiledoc = mobiledoc;
      if (status) post.status = status;
      if (tags) post.tags = tags;
      if (featured !== undefined) post.featured = featured;
      if (excerpt) post.excerpt = excerpt;
      if (published_at) post.published_at = published_at;
      const result = await ghostPost("/ghost/api/admin/posts/", { posts: [post] });
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "ghost_update_post",
  "Update an existing Ghost post",
  {
    id: z.string().describe("Post ID to update"),
    updated_at: z.string().describe("Current updated_at value of the post (required for collision detection)"),
    title: z.string().optional().describe("New title"),
    html: z.string().optional().describe("New body as HTML"),
    status: z.string().optional().describe("New status: draft, published, scheduled"),
    tags: z.array(z.object({ name: z.string() })).optional().describe("New tags"),
    featured: z.boolean().optional().describe("Whether the post is featured"),
    excerpt: z.string().optional().describe("Custom excerpt"),
  },
  async ({ id, updated_at, title, html, status, tags, featured, excerpt }) => {
    try {
      const post: Record<string, unknown> = { updated_at };
      if (title !== undefined) post.title = title;
      if (html !== undefined) post.html = html;
      if (status) post.status = status;
      if (tags) post.tags = tags;
      if (featured !== undefined) post.featured = featured;
      if (excerpt) post.excerpt = excerpt;
      const result = await ghostPut(`/ghost/api/admin/posts/${id}/`, { posts: [post] });
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "ghost_delete_post",
  "Delete a Ghost post",
  { id: z.string().describe("Post ID to delete") },
  async ({ id }) => {
    try {
      await ghostDelete(`/ghost/api/admin/posts/${id}/`);
      return jsonResult({ success: true, deleted: id });
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "ghost_list_tags",
  "List all tags in Ghost",
  {
    limit: z.number().optional().describe("Max number of tags to return"),
    include: z.string().optional().describe("Include count.posts to get post counts"),
  },
  async ({ limit, include }) => {
    try {
      const params: Record<string, string> = {};
      if (limit !== undefined) params.limit = String(limit);
      if (include) params.include = include;
      const result = await ghostGet("/ghost/api/admin/tags/", params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

// --- Start ---
const transport = new StdioServerTransport();
await server.connect(transport);
