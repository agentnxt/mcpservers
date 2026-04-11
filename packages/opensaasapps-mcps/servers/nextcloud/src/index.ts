import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("NEXTCLOUD_URL");
const username = envRequired("NEXTCLOUD_USER");
const password = envRequired("NEXTCLOUD_PASS");

const client = new HttpClient(baseUrl, {
  type: "basic",
  username,
  password,
});

const server = new McpServer({
  name: "nextcloud",
  version: "1.0.0",
});

// Helper to build OCS headers for all OCS API calls
function ocsHeaders(): Record<string, string> {
  return {
    "OCS-APIRequest": "true",
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
  };
}

// Helper for raw fetch calls (PROPFIND, binary PUT, etc.)
async function rawFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    ...((options.headers as Record<string, string>) || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res;
}

// --- Tools ---

server.tool(
  "nextcloud_list_files",
  "List files and folders at a given path using WebDAV PROPFIND",
  {
    path: z
      .string()
      .optional()
      .default("/")
      .describe("Directory path relative to user root (e.g. / or /Documents)"),
  },
  async ({ path }) => {
    const davPath = `/remote.php/dav/files/${encodeURIComponent(username)}${path.startsWith("/") ? path : "/" + path}`;
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
  <d:prop>
    <d:displayname/>
    <d:getcontenttype/>
    <d:getcontentlength/>
    <d:getlastmodified/>
    <d:resourcetype/>
    <oc:size/>
  </d:prop>
</d:propfind>`;
    const res = await rawFetch(davPath, {
      method: "PROPFIND",
      headers: {
        "Content-Type": "application/xml",
        Depth: "1",
      },
      body,
    });
    const xml = await res.text();
    return { content: [{ type: "text", text: xml }] };
  }
);

server.tool(
  "nextcloud_upload_file",
  "Upload a file to Nextcloud via WebDAV PUT",
  {
    path: z.string().describe("Destination path including filename (e.g. /Documents/report.txt)"),
    content: z.string().describe("File content as text"),
  },
  async ({ path: filePath, content: fileContent }) => {
    const davPath = `/remote.php/dav/files/${encodeURIComponent(username)}${filePath.startsWith("/") ? filePath : "/" + filePath}`;
    await rawFetch(davPath, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: fileContent,
    });
    return {
      content: [{ type: "text", text: JSON.stringify({ status: "uploaded", path: filePath }, null, 2) }],
    };
  }
);

server.tool(
  "nextcloud_list_users",
  "List all users via OCS Provisioning API",
  {},
  async () => {
    const res = await rawFetch("/ocs/v1.php/cloud/users?format=json", {
      method: "GET",
      headers: {
        ...ocsHeaders(),
      },
    });
    const result = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "nextcloud_list_shares",
  "List file shares via OCS Sharing API",
  {
    path: z.string().optional().describe("Limit shares to a specific file/folder path"),
    shared_with_me: z.boolean().optional().default(false).describe("Show shares shared with the current user"),
  },
  async ({ path, shared_with_me }) => {
    const params: Record<string, string> = { format: "json" };
    if (path) params.path = path;
    if (shared_with_me) params.shared_with_me = "true";
    const qs = new URLSearchParams(params).toString();
    const res = await rawFetch(`/ocs/v2.php/apps/files_sharing/api/v1/shares?${qs}`, {
      method: "GET",
      headers: {
        ...ocsHeaders(),
      },
    });
    const result = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "nextcloud_create_share",
  "Create a new file share via OCS Sharing API",
  {
    path: z.string().describe("Path of the file/folder to share"),
    shareType: z
      .number()
      .describe("Share type: 0=user, 1=group, 3=public link, 4=email, 6=federated cloud"),
    shareWith: z.string().optional().describe("User/group ID or email to share with (not needed for public link)"),
    permissions: z
      .number()
      .optional()
      .default(1)
      .describe("Permission bits: 1=read, 2=update, 4=create, 8=delete, 16=share, 31=all"),
    password: z.string().optional().describe("Password for public link share"),
    expireDate: z.string().optional().describe("Expiration date in YYYY-MM-DD format"),
  },
  async ({ path, shareType, shareWith, permissions, password: sharePw, expireDate }) => {
    const body: Record<string, unknown> = {
      path,
      shareType,
      permissions,
    };
    if (shareWith) body.shareWith = shareWith;
    if (sharePw) body.password = sharePw;
    if (expireDate) body.expireDate = expireDate;
    const res = await rawFetch("/ocs/v2.php/apps/files_sharing/api/v1/shares?format=json", {
      method: "POST",
      headers: {
        ...ocsHeaders(),
      },
      body: JSON.stringify(body),
    });
    const result = await res.json();
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
