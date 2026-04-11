#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE_URL = process.env.AGENTCREW_URL || 'http://agentcrew:8502';

async function api(path: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...((options.headers as Record<string, string>) || {}) },
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`AgentCrew API ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

const server = new McpServer({ name: 'agentcrew', version: '1.0.0' });

// ── Agents ──────────────────────────────────────────────────────────────
server.tool(
  'list_agents',
  'List all AI agents configured in AgentCrew. Each agent has a role, goal, and backstory.',
  {},
  async () => {
    const data = await api('/agents');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'create_agent',
  'Create a new AI agent with a role, goal, and backstory.',
  {
    role: z.string().describe('Agent role (e.g., "Senior Researcher")'),
    goal: z.string().describe('Agent goal (what it should achieve)'),
    backstory: z.string().describe('Agent backstory (context and expertise)'),
    llm: z.string().optional().describe('LLM model to use (e.g., "gpt-4")'),
    allow_delegation: z.boolean().default(false).describe('Allow this agent to delegate tasks'),
  },
  async ({ role, goal, backstory, llm, allow_delegation }) => {
    const data = await api('/agents', {
      method: 'POST',
      body: JSON.stringify({ role, goal, backstory, llm, allow_delegation }),
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'delete_agent',
  'Delete an agent by ID.',
  { agentId: z.string().describe('Agent ID') },
  async ({ agentId }) => {
    const data = await api(`/agents/${agentId}`, { method: 'DELETE' });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Tasks ───────────────────────────────────────────────────────────────
server.tool(
  'list_tasks',
  'List all tasks configured in AgentCrew.',
  {},
  async () => {
    const data = await api('/tasks');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'create_task',
  'Create a new task with a description and expected output.',
  {
    description: z.string().describe('Task description'),
    expected_output: z.string().describe('What the task should produce'),
    agent_id: z.string().optional().describe('Assign to agent ID'),
  },
  async ({ description, expected_output, agent_id }) => {
    const data = await api('/tasks', {
      method: 'POST',
      body: JSON.stringify({ description, expected_output, agent_id }),
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'delete_task',
  'Delete a task by ID.',
  { taskId: z.string().describe('Task ID') },
  async ({ taskId }) => {
    const data = await api(`/tasks/${taskId}`, { method: 'DELETE' });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Crews ───────────────────────────────────────────────────────────────
server.tool(
  'list_crews',
  'List all crews (agent teams). Each crew has agents, tasks, and a process type.',
  {},
  async () => {
    const data = await api('/crews');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

server.tool(
  'delete_crew',
  'Delete a crew by ID.',
  { crewId: z.string().describe('Crew ID') },
  async ({ crewId }) => {
    const data = await api(`/crews/${crewId}`, { method: 'DELETE' });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Results ─────────────────────────────────────────────────────────────
server.tool(
  'list_results',
  'List crew execution results.',
  {},
  async () => {
    const data = await api('/results');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Tools ───────────────────────────────────────────────────────────────
server.tool(
  'list_tools',
  'List all available tools that agents can use.',
  {},
  async () => {
    const data = await api('/tools');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Export ───────────────────────────────────────────────────────────────
server.tool(
  'export_all',
  'Export all AgentCrew data (agents, tasks, crews, tools) as JSON.',
  {},
  async () => {
    const data = await api('/export');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('AgentCrew MCP server failed to start:', err);
  process.exit(1);
});
