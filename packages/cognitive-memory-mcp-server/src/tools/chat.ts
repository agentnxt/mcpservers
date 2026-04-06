import type { CognitiveMemoryClient } from "../client.js";
import type { Tool } from "../types.js";

export const tools: Tool[] = [
  {
    name: "cme_chat_pre_llm",
    description: "Retrieve relevant memories and cortex briefing before an LLM call. Returns scored memories and a contextual briefing for the user.",
    inputSchema: {
      type: "object",
      required: ["user_id", "conversation_id", "message_id", "user_message"],
      properties: {
        user_id: { type: "string", description: "User identifier" },
        conversation_id: { type: "string", description: "Conversation/session ID" },
        message_id: { type: "string", description: "Unique message ID" },
        user_message: { type: "string", description: "The user's message to retrieve context for" },
      },
    },
    handler: async (client, args) =>
      client.post("/chat", {
        user_id: args.user_id,
        conversation_id: args.conversation_id,
        message_id: args.message_id,
        user_message: args.user_message,
        mode: "pre_llm",
      }),
  },
  {
    name: "cme_chat_post_llm",
    description: "Extract and store memories from a completed chat turn (user message + assistant response). Runs asynchronously.",
    inputSchema: {
      type: "object",
      required: ["user_id", "conversation_id", "message_id", "user_message", "assistant_message"],
      properties: {
        user_id: { type: "string", description: "User identifier" },
        conversation_id: { type: "string", description: "Conversation/session ID" },
        message_id: { type: "string", description: "Unique message ID" },
        user_message: { type: "string", description: "The user's message" },
        assistant_message: { type: "string", description: "The assistant's response" },
      },
    },
    handler: async (client, args) =>
      client.post("/chat", {
        user_id: args.user_id,
        conversation_id: args.conversation_id,
        message_id: args.message_id,
        user_message: args.user_message,
        assistant_message: args.assistant_message,
        mode: "post_llm",
      }),
  },
];
