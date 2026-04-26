# AGENTS.md

This file defines operating guidance for agents and contributors working in this repository.

## Repository purpose

AgentNxt MCP Registry catalogs MCP servers, wrappers, deployment patterns, metadata, trust/provenance signals, and publishing guidance.

The registry uses Schema.org as an inherited public semantic baseline, while AgentNxt controls the MCP registry profile, AgentNxt extension fields, publishing workflow, deployment workflow, trust model, and identity-resolution rules.

## Core rule

Prefer existing Schema.org vocabulary first. Add AgentNxt `mcp.*` fields only when the concept is MCP-specific or not cleanly represented in Schema.org.

Schema.org is not a blocking dependency. AgentNxt owns this registry profile and may extend it incrementally.

## Schema.org developer references

Use the Schema.org developer docs as the starting point for understanding how Schema.org data is consumed, validated, and represented:

- Schema.org developers: https://schema.org/docs/developers.html
- Schema.org validator: https://schema.org/docs/validator.html
- Schema.org releases: https://schema.org/docs/releases.html
- Schema.org how we work: https://schema.org/docs/howwework.html
- WebApplication: https://schema.org/WebApplication
- WebAPI: https://schema.org/WebAPI
- APIReference: https://schema.org/APIReference
- EntryPoint: https://schema.org/EntryPoint
- isBasedOn: https://schema.org/isBasedOn

## Registry profile docs

Before changing schema or metadata conventions, read:

- `docs/schema-org-profile.md`
- `docs/field-proposal-sop.md`
- `docs/publishing-sop.md`
- `docs/deployment-sop.md`
- `registry/schema.json`

## Metadata model

Use these Schema.org types by default:

| Concept | Schema.org type |
|---|---|
| MCP server artifact or hosted app | `WebApplication` |
| Hosted MCP API/service surface | `WebAPI` |
| API documentation/reference | `APIReference` |
| Concrete hosted endpoint | `EntryPoint` |
| Publisher/provider | `Organization` or `Person` |

Use these relationship fields carefully:

| Field | Meaning |
|---|---|
| `sameAs` | Same entity/equivalent identity only. Do not use for forks or wrappers. |
| `isBasedOn` | Fork, wrapper, clone, mirror, adaptation, or derivative relationship. |
| `softwareRequirements` | Runtime packages, SDKs, APIs, services, or system requirements. |
| `runtimePlatform` | Runtime or deployment environment. |
| `programmingLanguage` | Implementation language. |
| `documentation` | Documentation for `WebAPI` or other described resources. |

## Canonical identity

Every MCP server should ideally have a stable canonical identity, but schema validation must remain permissive so entries can be incrementally enriched.

Use:

- `mcp.canonicalId` for the stable MCP server identity.
- `@id` for the JSON-LD entity identifier.
- `url` for the primary human-facing page.
- `sameAs` for equivalent identities only.
- `isBasedOn` for upstream/derived relationships.
- `mcp.id` for local AgentNxt registry slug or legacy ID.
- `mcp.aliases` for search aliases, package names, or prior IDs.

Prefer `mcp.canonicalId` as a publisher-controlled URL. DID URLs may be used when the publisher supports decentralized identity.

## Domain authority and trust

Domain ownership is an authority signal. Trust is registry-assigned enrichment, not a publisher self-claim.

Use optional fields such as:

- `mcp.publisherDomain`
- `mcp.authority.domain`
- `mcp.authority.canonicalUrl`
- `mcp.authority.verificationMethod`
- `mcp.authority.evidence`
- `trust.score`
- `trust.level`
- `trust.publisherDomain`
- `trust.domainRelationship`

Do not confuse this with Google Search ranking or third-party SEO metrics. In this registry, domain authority means provenance and control over the canonical URL.

## Schema requirements

The schema must remain permissive:

- Do not make fields mandatory by default.
- Do not close top-level metadata with `additionalProperties: false`.
- Do not close `mcp` metadata with `additionalProperties: false`.
- Recognize known fields when present.
- Allow unknown Schema.org and AgentNxt extension fields.
- Support incremental updates to partial records.

## Adding fields

Before adding a new field:

1. Check Schema.org developer docs and latest release notes.
2. Check whether an existing Schema.org field represents the concept.
3. Check `docs/schema-org-profile.md` and current registry entries.
4. If a new AgentNxt field is still needed, place it under `mcp.*` unless it is a registry-level trust/provenance field.
5. Update `docs/field-proposal-sop.md` or add a proposal under `docs/proposals/fields/` when the field affects semantics or tooling.
6. Keep examples and migration guidance clear.

Do not invent fields like `mcp.frameworks`, `mcp.sdks`, or `mcp.toolkits` unless the AgentNxt vocabulary explicitly adopts them. Prefer Schema.org fields such as `softwareRequirements`, `runtimePlatform`, `programmingLanguage`, `softwareAddOn`, and `isBasedOn` first.

## Validation workflow

Use layered validation:

1. JSON syntax: `python -m json.tool registry/servers/<entry>.json`
2. AgentNxt profile: validate against `registry/schema.json` when tooling is available.
3. Schema.org layer: paste JSON-LD HTML fixtures into Schema.org Markup Validator.
4. Human/tooling review: verify canonical identity, provenance, trust, and derivation semantics.

Schema.org Markup Validator validates the public Schema.org/JSON-LD layer. It is not expected to fully validate AgentNxt `mcp.*` extensions.

## Publishing new MCP servers

When adding a server:

1. Add or update a metadata entry under `registry/servers/`.
2. Add a server folder only when this repository contains a wrapper, implementation, deployment package, or detailed server-specific documentation.
3. Prefer publisher-controlled canonical IDs.
4. Use `isBasedOn` for upstream relationships.
5. Add deployment docs when the registry provides a wrapper or hosted deployment path.
6. Do not commit secrets, credentials, tokens, or private endpoints.

## Deployment guidance

For remote MCP servers, document:

- supported transports: stdio, SSE, Streamable HTTP, HTTP
- local launch command
- Docker build/run command if applicable
- remote deployment target if applicable
- required environment variables
- secret handling
- authentication model
- smoke-test instructions
- rollback notes

Use `WebAPI`, `APIReference`, and `EntryPoint` metadata for hosted API surfaces when useful.

## Pull request expectations

PRs should explain:

- what changed
- whether the change affects schema, metadata, docs, deployment, or trust semantics
- whether new fields are Schema.org fields or AgentNxt extensions
- how entries should be validated
- any migration or compatibility impact

Keep changes additive and reversible where possible.
