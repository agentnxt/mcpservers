#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE_URL = process.env.OLLAMA_URL || 'http://localllm:11434';

async function api(path: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...((options.headers as Record<string, string>) || {}) },
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`Ollama API ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

const server = new McpServer({ name: 'ollama', version: '1.0.0' });

// ── List Models ─────────────────────────────────────────────────────────
server.tool(
  'list_models',
  'List all locally available Ollama models with their sizes and modification dates.',
  {},
  async () => {
    const data = await api('/api/tags');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Show Model Info ─────────────────────────────────────────────────────
server.tool(
  'show_model',
  'Show detailed information about a model including parameters, template, and system prompt.',
  {
    name: z.string().describe('Model name (e.g., "llama3.2", "codellama:13b")'),
  },
  async ({ name }) => {
    const data = await api('/api/show', { method: 'POST', body: JSON.stringify({ name }) });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Pull Model ──────────────────────────────────────────────────────────
server.tool(
  'pull_model',
  'Download a model from the Ollama library. Returns download progress.',
  {
    name: z.string().describe('Model name to pull (e.g., "llama3.2", "mistral", "codellama")'),
  },
  async ({ name }) => {
    const data = await api('/api/pull', {
      method: 'POST',
      body: JSON.stringify({ name, stream: false }),
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Delete Model ────────────────────────────────────────────────────────
server.tool(
  'delete_model',
  'Delete a locally stored model.',
  {
    name: z.string().describe('Model name to delete'),
  },
  async ({ name }) => {
    const data = await api('/api/delete', { method: 'DELETE', body: JSON.stringify({ name }) });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? { deleted: true }, null, 2) }] };
  },
);

// ── Generate ────────────────────────────────────────────────────────────
server.tool(
  'generate',
  'Generate a completion from a local Ollama model. Use this to run inference on local models.',
  {
    model: z.string().describe('Model name'),
    prompt: z.string().describe('The prompt to generate from'),
    system: z.string().optional().describe('System prompt'),
    temperature: z.number().optional().describe('Temperature (0.0-2.0)'),
    max_tokens: z.number().optional().describe('Max tokens to generate'),
  },
  async ({ model, prompt, system, temperature, max_tokens }) => {
    const body: Record<string, unknown> = { model, prompt, stream: false };
    const options: Record<string, unknown> = {};
    if (system) body.system = system;
    if (temperature !== undefined) options.temperature = temperature;
    if (max_tokens !== undefined) options.num_predict = max_tokens;
    if (Object.keys(options).length > 0) body.options = options;

    const data = await api('/api/generate', { method: 'POST', body: JSON.stringify(body) });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Chat ────────────────────────────────────────────────────────────────
server.tool(
  'chat',
  'Have a multi-turn chat conversation with a local Ollama model.',
  {
    model: z.string().describe('Model name'),
    messages: z.array(z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })).describe('Chat messages'),
    temperature: z.number().optional().describe('Temperature (0.0-2.0)'),
  },
  async ({ model, messages, temperature }) => {
    const body: Record<string, unknown> = { model, messages, stream: false };
    if (temperature !== undefined) body.options = { temperature };

    const data = await api('/api/chat', { method: 'POST', body: JSON.stringify(body) });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── List Running Models ─────────────────────────────────────────────────
server.tool(
  'list_running',
  'List models currently loaded in memory.',
  {},
  async () => {
    const data = await api('/api/ps');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Create Model ────────────────────────────────────────────────────────
server.tool(
  'create_model',
  'Create a custom model from a Modelfile (custom system prompt, parameters, etc.).',
  {
    name: z.string().describe('Name for the new model'),
    modelfile: z.string().describe('Modelfile content (e.g., "FROM llama3.2\\nSYSTEM You are a helpful assistant.")'),
  },
  async ({ name, modelfile }) => {
    const data = await api('/api/create', {
      method: 'POST',
      body: JSON.stringify({ name, modelfile, stream: false }),
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Generate Embeddings ─────────────────────────────────────────────────
server.tool(
  'embeddings',
  'Generate embeddings from a local model. Useful for semantic search and RAG.',
  {
    model: z.string().describe('Model name (e.g., "nomic-embed-text")'),
    input: z.union([z.string(), z.array(z.string())]).describe('Text or array of texts to embed'),
  },
  async ({ model, input }) => {
    const data = await api('/api/embed', {
      method: 'POST',
      body: JSON.stringify({ model, input }),
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('Ollama MCP server failed to start:', err);
  process.exit(1);
});
