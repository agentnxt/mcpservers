import type { CognitiveMemoryClient } from "../client.js";
import type { Tool } from "../types.js";

export const tools: Tool[] = [
  {
    name: "cme_list_memories",
    description: "List memories for a user with optional filtering by type, sorting, and pagination. Memory types: fact, preference, decision, identity, event, observation, goal, todo.",
    inputSchema: {
      type: "object",
      required: ["user_id"],
      properties: {
        user_id: { type: "string", description: "User identifier" },
        type: {
          type: "string",
          description: "Filter by memory type",
          enum: ["fact", "preference", "decision", "identity", "event", "observation", "goal", "todo"],
        },
        limit: { type: "number", description: "Max results (default 50, max 100)" },
        offset: { type: "number", description: "Pagination offset (default 0)" },
        sort: {
          type: "string",
          description: "Sort field",
          enum: ["created_at", "updated_at", "importance", "last_accessed"],
        },
      },
    },
    handler: async (client, args) => {
      const params: Record<string, string> = {};
      if (args.type) params.type = String(args.type);
      if (args.limit) params.limit = String(args.limit);
      if (args.offset) params.offset = String(args.offset);
      if (args.sort) params.sort = String(args.sort);
      return client.get(`/memories/${args.user_id}`, Object.keys(params).length > 0 ? params : undefined);
    },
  },
  {
    name: "cme_create_memory",
    description: "Manually create a memory for a user. Types: fact, preference, decision, identity, event, observation, goal, todo.",
    inputSchema: {
      type: "object",
      required: ["user_id", "content"],
      properties: {
        user_id: { type: "string", description: "User identifier" },
        content: { type: "string", description: "Memory content (max 10000 chars)" },
        type: {
          type: "string",
          description: "Memory type (auto-classified if omitted)",
          enum: ["fact", "preference", "decision", "identity", "event", "observation", "goal", "todo"],
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Optional keywords for the memory",
        },
      },
    },
    handler: async (client, args) =>
      client.post("/memories", {
        user_id: args.user_id,
        content: args.content,
        type: args.type,
        keywords: args.keywords,
      }),
  },
  {
    name: "cme_delete_memory",
    description: "Delete a specific memory and its graph edges by memory ID.",
    inputSchema: {
      type: "object",
      required: ["memory_id"],
      properties: {
        memory_id: { type: "string", description: "The memory ID to delete (e.g. memory:xxx)" },
      },
    },
    handler: async (client, args) =>
      client.delete(`/memories/${args.memory_id}`),
  },
];
