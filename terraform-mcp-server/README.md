# terraform-mcp-server

MCP server for read-only Terraform operations.

## Status

**Read-only only** - This server exposes only read-only tools. No mutating operations are implemented.

## Tools

| Tool | Description |
|------|-------------|
| `health` | Return server health and configured Terraform CLI bindings. |
| `fmt_check` | Run `terraform fmt -check` to validate Terraform file formatting. |
| `validate` | Run `terraform validate` to validate Terraform configuration. |
| `plan` | Run `terraform plan` to create a Terraform execution plan. |
| `show_state_summary` | Show the state from a Terraform plan file in JSON format. |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TERRAFORM_BIN` | Path to Terraform binary. | `terraform` |
| `TERRAFORM_WORKDIR` | Working directory for Terraform commands. | Current working directory |
| `TERRAFORM_PLAN_OUT` | Output file for Terraform plan. | `tfplan` |

## Requirements

- Terraform CLI must be installed and accessible in PATH or via `TERRAFORM_BIN`.
- This server is read-only and does not execute `terraform apply`.

## Input Schemas

### plan
```json
{
  "workdir": "optional string - working directory",
  "out_plan": "optional string - output plan file name"
}
```

### show_state_summary
```json
{
  "plan_file": "optional string - path to plan file"
}
```

## Result Envelope

Every tool returns a normalized JSON envelope:

```json
{
  "tool": "terraform",
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
