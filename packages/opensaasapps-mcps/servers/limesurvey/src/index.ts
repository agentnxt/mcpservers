import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("LIMESURVEY_URL").replace(/\/$/, "");
const lsUser = envRequired("LIMESURVEY_USER");
const lsPass = envRequired("LIMESURVEY_PASS");

const rpcUrl = `${baseUrl}/index.php/admin/remotecontrol`;

let rpcId = 1;

// JSON-RPC helper
async function rpcCall(method: string, params: unknown[]): Promise<any> {
  const id = rpcId++;
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params, id }),
  });
  if (!res.ok) {
    throw new Error(`RPC ${method} failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`RPC ${method} error: ${JSON.stringify(json.error)}`);
  }
  return json.result;
}

// Session-wrapped RPC: get session key, call method, release session key
async function withSession<T>(
  fn: (sessionKey: string) => Promise<T>
): Promise<T> {
  const sessionKey = await rpcCall("get_session_key", [lsUser, lsPass]);
  if (typeof sessionKey === "object" && sessionKey.status) {
    throw new Error(`Authentication failed: ${JSON.stringify(sessionKey)}`);
  }
  try {
    return await fn(sessionKey);
  } finally {
    try {
      await rpcCall("release_session_key", [sessionKey]);
    } catch {
      // best-effort release
    }
  }
}

const server = new McpServer({
  name: "limesurvey",
  version: "1.0.0",
});

server.tool(
  "limesurvey_list_surveys",
  "List all surveys accessible to the authenticated user",
  {},
  async () => {
    const result = await withSession(async (sk) => {
      return rpcCall("list_surveys", [sk, null]);
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "limesurvey_get_survey_properties",
  "Get properties of a specific survey",
  {
    surveyId: z.number().describe("The survey ID"),
    properties: z
      .array(z.string())
      .optional()
      .describe("List of property names to retrieve (e.g. ['sid','surveyls_title','active']). Omit for all."),
  },
  async ({ surveyId, properties }) => {
    const result = await withSession(async (sk) => {
      const params: unknown[] = [sk, surveyId];
      if (properties && properties.length > 0) {
        params.push(properties);
      }
      return rpcCall("get_survey_properties", params);
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "limesurvey_list_responses",
  "Export survey responses as JSON",
  {
    surveyId: z.number().describe("The survey ID to export responses from"),
    completionStatus: z
      .enum(["complete", "incomplete", "all"])
      .optional()
      .default("all")
      .describe("Filter by completion status"),
  },
  async ({ surveyId, completionStatus }) => {
    const result = await withSession(async (sk) => {
      // export_responses returns base64-encoded data
      const b64 = await rpcCall("export_responses", [
        sk,
        surveyId,
        "json",
        null, // language
        completionStatus,
      ]);
      if (typeof b64 === "string") {
        try {
          const decoded = Buffer.from(b64, "base64").toString("utf-8");
          return JSON.parse(decoded);
        } catch {
          return { raw: b64 };
        }
      }
      return b64;
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "limesurvey_activate_survey",
  "Activate a survey to start collecting responses",
  {
    surveyId: z.number().describe("The survey ID to activate"),
  },
  async ({ surveyId }) => {
    const result = await withSession(async (sk) => {
      return rpcCall("activate_survey", [sk, surveyId]);
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "limesurvey_get_summary",
  "Get survey statistics summary (response count, completion rate, etc.)",
  {
    surveyId: z.number().describe("The survey ID"),
  },
  async ({ surveyId }) => {
    const result = await withSession(async (sk) => {
      return rpcCall("get_summary", [sk, surveyId]);
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
