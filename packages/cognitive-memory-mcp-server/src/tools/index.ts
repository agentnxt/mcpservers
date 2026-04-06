import { tools as health } from "./health.js";
import { tools as chat } from "./chat.js";
import { tools as memories } from "./memories.js";

export const allTools = [
  ...health,
  ...chat,
  ...memories,
];
