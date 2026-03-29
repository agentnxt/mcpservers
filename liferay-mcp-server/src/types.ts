import type { LiferayClient } from "./liferay-client.js";

export interface Tool {
  name: string;
  api: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (
    client: LiferayClient,
    args: Record<string, unknown>
  ) => Promise<unknown>;
}
