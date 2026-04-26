# SOP: Publishing MCP Servers to the AgentNxt Registry

This SOP defines the standard process for adding, reviewing, and publishing MCP servers in this repository.

## Goals

- Keep every server discoverable through structured metadata.
- Make local and hosted deployment instructions predictable.
- Preserve upstream attribution, license notices, and security context.
- Ensure new entries can be reviewed without reverse-engineering the server.

## Repository layout

Use this structure for new entries:

```text
registry/
  schema.json
  servers/
    <server-id>.json
<server-id>/
  README.md
  Dockerfile
  LICENSE              # when vendoring or required by upstream
  NOTICE               # when attribution or upstream notices are required
  src/                 # only when the implementation is maintained here
```

Existing historical server folders may still live at the repository root. Do not bulk-move existing folders without a separate migration PR.

## Server ID conventions

Server IDs must:

- Use lowercase kebab-case.
- End with `-mcp-server` for runnable servers.
- Match the folder name whenever this repository contains a wrapper or implementation.
- Be globally unique in `registry/servers/`.

Examples:

```text
brave-search-mcp-server
google-analytics-mcp-server
stripe-mcp-server
```

## Required files for a new server

Each new server entry must include:

1. `registry/servers/<server-id>.json`
2. A server README at `<server-id>/README.md` when this repo contains code, wrappers, Dockerfiles, or deployment instructions.
3. A `Dockerfile` when AgentNxt publishes or deploys a container image.
4. `LICENSE` and `NOTICE` files when vendoring upstream code or when upstream license terms require attribution.

## Registry metadata checklist

Every `registry/servers/<server-id>.json` file must include:

- `id`
- `name`
- `description`
- `status`
- `category`
- `source`
- `transports`
- `deployment`
- `auth`
- `tools`
- `maintainers`
- useful `links`

Use one of these statuses:

- `draft`: metadata is incomplete or implementation is not validated.
- `experimental`: deployable, but not production-hardened or fully verified.
- `stable`: validated, documented, and supported for production use.
- `deprecated`: retained for compatibility but no longer recommended.

## Publishing workflow

1. Create a branch from `main`:

```bash
git checkout main
git pull
git checkout -b add/<server-id>
```

2. Add the registry metadata file:

```bash
mkdir -p registry/servers
cp registry/servers/example.json registry/servers/<server-id>.json
```

If `example.json` does not exist yet, use `registry/schema.json` as the contract.

3. Add implementation, wrapper, or docs under `<server-id>/`.

4. Validate metadata:

```bash
python -m json.tool registry/servers/<server-id>.json >/dev/null
```

When a JSON Schema validator is available:

```bash
npx ajv validate -s registry/schema.json -d registry/servers/<server-id>.json
```

5. Build or test the server locally.

For Node.js servers:

```bash
npm install
npm run build
```

For Python wrapper servers:

```bash
docker build -t agentnxt/<server-id>:local <server-id>
```

6. Run a smoke test with an MCP-compatible client or inspector.

7. Open a pull request using the standard PR checklist below.

## Pull request checklist

Include this checklist in the PR description:

```markdown
## Registry
- [ ] Added `registry/servers/<server-id>.json`
- [ ] Metadata validates as JSON
- [ ] Source URL, package, and license are accurate
- [ ] Runtime, transports, auth, and deployment fields are complete

## Server docs
- [ ] README includes local usage
- [ ] README includes deployment instructions
- [ ] README documents required environment variables and secrets
- [ ] README documents security considerations

## Build and smoke test
- [ ] Docker image builds, if applicable
- [ ] Local stdio or HTTP launch works, if applicable
- [ ] MCP client or inspector can list tools
- [ ] At least one read-only tool call succeeds, or limitations are documented

## Compliance
- [ ] Upstream license and attribution preserved
- [ ] No secrets, credentials, tokens, or private endpoints committed
- [ ] Production data access is least-privilege
```

## Review standards

Reviewers should verify:

- The entry is useful and not a duplicate.
- The source and license are clear.
- Secrets are passed through environment variables or a secret manager.
- Deployment instructions are safe by default.
- Hosted endpoints requiring public access include an authentication plan.
- Read/write tools are clearly described, especially destructive operations.

## Release and image publishing

When a server is approved for container publishing:

```bash
docker build -t agentnxt/<server-id>:<version> <server-id>
docker tag agentnxt/<server-id>:<version> agentnxt/<server-id>:latest
docker push agentnxt/<server-id>:<version>
docker push agentnxt/<server-id>:latest
```

Use semantic versions when the implementation is maintained in this repo. For wrappers around upstream projects, use the upstream version plus an AgentNxt wrapper revision when needed:

```text
<upstream-version>-agentnxt.1
```

## Deprecation process

To deprecate a server:

1. Set `status` to `deprecated`.
2. Add a deprecation note in the server README.
3. Point users to the replacement server when one exists.
4. Keep the existing Docker image available unless there is a security reason to remove it.
