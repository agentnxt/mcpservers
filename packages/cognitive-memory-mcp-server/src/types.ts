import type { CognitiveMemoryClient } from "./client.js";

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (client: CognitiveMemoryClient, args: Record<string, unknown>) => Promise<unknown>;
}
