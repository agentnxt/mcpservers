# ansible-mcp-server

MCP server for read-only Ansible operations.

## Status

**Read-only only** - This server exposes only read-only tools. No mutating operations are implemented.

## Tools

| Tool | Description |
|------|-------------|
| `health` | Return server health and configured Ansible command bindings. |
| `check_inventory` | Check and list Ansible inventory in JSON format. |
| `dry_run_playbook` | Run a playbook in check mode (dry run) for read-only validation. |
| `gather_facts` | Gather facts from inventory using the setup module. |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANSIBLE_BIN` | Path to ansible binary. | `ansible` |
| `ANSIBLE_PLAYBOOK_BIN` | Path to ansible-playbook binary. | `ansible-playbook` |
| `ANSIBLE_INVENTORY` | Default inventory path. | (empty) |

## Requirements

- Ansible and ansible-playbook must be installed and accessible in PATH.
- Valid inventory is required for `check_inventory`, `dry_run_playbook`, and `gather_facts`.
- This server is read-only: `dry_run_playbook` always uses `--check` mode.

## Input Schemas

### check_inventory
```json
{
  "inventory": "optional string - path to inventory file"
}
```

### dry_run_playbook
```json
{
  "playbook": "string - required path to playbook file",
  "inventory": "optional string - path to inventory file",
  "tags": "optional array of strings - tags to filter tasks"
}
```

### gather_facts
```json
{
  "inventory": "optional string - path to inventory file",
  "limit": "optional string - host pattern to limit to"
}
```

## Result Envelope

Every tool returns a normalized JSON envelope:

```json
{
  "tool": "ansible",
  "action": "string",
  "status": "ok|error",
  "summary": "short human-readable outcome",
  "stdout": "captured output or serialized structured output",
  "stderr": "captured errors",
  "exit_code": 0,
  "requires_approval": false,
  "rollback_hint": "what to do if this fails"
}
```
