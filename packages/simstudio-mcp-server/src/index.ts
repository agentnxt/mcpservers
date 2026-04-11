#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE_URL = process.env.SIMSTUDIO_URL || 'https://agentstudio.agnxxt.com';
const API_KEY = process.env.SIMSTUDIO_API_KEY || '';

async function api(path: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${BASE_URL}/api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(`SimStudio API ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }

  return data;
}

const server = new McpServer({
  name: 'simstudio',
  version: '1.0.0',
});

// ── List Workflows ──────────────────────────────────────────────────────
server.tool(
  'list_workflows',
  'List all workflows in a workspace. Returns workflow IDs, names, descriptions, colors, deploy status.',
  {
    workspaceId: z.string().describe('Workspace ID to list workflows from'),
    scope: z.enum(['active', 'archived', 'all']).default('active').describe('Filter scope'),
  },
  async ({ workspaceId, scope }) => {
    const data = await api(`/workflows?workspaceId=${workspaceId}&scope=${scope}`);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Get Workflow ─────────────────────────────────────────────────────────
server.tool(
  'get_workflow',
  'Get a workflow by ID including its full state (blocks, connections, configuration).',
  {
    workflowId: z.string().describe('Workflow ID'),
  },
  async ({ workflowId }) => {
    const [info, state] = await Promise.all([
      api(`/workflows/${workflowId}`),
      api(`/workflows/${workflowId}/state`),
    ]);
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify({ workflow: info, state }, null, 2) },
      ],
    };
  },
);

// ── Create Workflow ──────────────────────────────────────────────────────
server.tool(
  'create_workflow',
  'Create a new empty workflow in a workspace.',
  {
    name: z.string().describe('Workflow name'),
    description: z.string().default('').describe('Workflow description'),
    workspaceId: z.string().describe('Workspace ID to create the workflow in'),
  },
  async ({ name, description, workspaceId }) => {
    const data = await api('/workflows', {
      method: 'POST',
      body: JSON.stringify({ name, description, workspaceId }),
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Update Workflow State ────────────────────────────────────────────────
server.tool(
  'update_workflow_state',
  'Update a workflow\'s blocks, connections, and configuration. Use this to build the workflow logic. The state contains blocks (nodes) with their type and config, and edges (connections between blocks).',
  {
    workflowId: z.string().describe('Workflow ID to update'),
    state: z
      .object({
        blocks: z.record(z.any()).describe('Block definitions keyed by block ID'),
        edges: z.array(z.any()).describe('Connection edges between blocks'),
        loops: z.record(z.any()).optional().describe('Loop definitions'),
      })
      .describe('The full workflow state to save'),
  },
  async ({ workflowId, state }) => {
    const data = await api(`/workflows/${workflowId}/state`, {
      method: 'PUT',
      body: JSON.stringify(state),
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Execute Workflow ─────────────────────────────────────────────────────
server.tool(
  'execute_workflow',
  'Execute (run) a workflow. Returns the execution result.',
  {
    workflowId: z.string().describe('Workflow ID to execute'),
    inputData: z.record(z.any()).optional().describe('Input data to pass to the workflow starter block'),
  },
  async ({ workflowId, inputData }) => {
    const data = await api(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify(inputData || {}),
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Deploy Workflow ──────────────────────────────────────────────────────
server.tool(
  'deploy_workflow',
  'Deploy a workflow, making it available via webhook/API endpoint.',
  {
    workflowId: z.string().describe('Workflow ID to deploy'),
  },
  async ({ workflowId }) => {
    const data = await api(`/workflows/${workflowId}/deploy`, {
      method: 'POST',
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Get Workflow Logs ────────────────────────────────────────────────────
server.tool(
  'get_workflow_logs',
  'Get execution logs for a workflow.',
  {
    workflowId: z.string().describe('Workflow ID'),
  },
  async ({ workflowId }) => {
    const data = await api(`/workflows/${workflowId}/log`);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Get Workflow Deployments ─────────────────────────────────────────────
server.tool(
  'get_deployments',
  'List all deployment versions for a workflow.',
  {
    workflowId: z.string().describe('Workflow ID'),
  },
  async ({ workflowId }) => {
    const data = await api(`/workflows/${workflowId}/deployments`);
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── List Templates ───────────────────────────────────────────────────────
server.tool(
  'list_templates',
  'List available workflow templates that can be used as starting points.',
  {},
  async () => {
    const data = await api('/templates');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── List Workspaces ──────────────────────────────────────────────────────
server.tool(
  'list_workspaces',
  'List all workspaces the authenticated user has access to.',
  {},
  async () => {
    const data = await api('/workspaces');
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Duplicate Workflow ───────────────────────────────────────────────────
server.tool(
  'duplicate_workflow',
  'Duplicate an existing workflow.',
  {
    workflowId: z.string().describe('Workflow ID to duplicate'),
  },
  async ({ workflowId }) => {
    const data = await api(`/workflows/${workflowId}/duplicate`, {
      method: 'POST',
    });
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
  },
);

// ── Start Server ─────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('SimStudio MCP server failed to start:', err);
  process.exit(1);
});
