import type { CognitiveMemoryClient } from "../client.js";
import type { Tool } from "../types.js";

export const tools: Tool[] = [
  {
    name: "cme_health",
    description: "Check Cognitive Memory Engine health status and database connectivity.",
    inputSchema: { type: "object", properties: {} },
    handler: async (client) => {
      // Health endpoint is unauthenticated, but client.get works fine
      const url = `${client.baseUrl}/health`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      return res.json();
    },
  },
];
