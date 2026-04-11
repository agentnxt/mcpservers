# OpenSaaSApps MCPs

Monorepo of MCP servers for the OpenSaaSApps platform. Contains 20 individual MCP servers with shared utilities.

## Servers

| Server | Description |
|---|---|
| `calcom` | Cal.com scheduling |
| `erpnext` | ERPNext ERP |
| `evolution` | Evolution API (WhatsApp) |
| `ghost` | Ghost CMS |
| `glitchtip` | GlitchTip error tracking |
| `lago` | Lago billing |
| `limesurvey` | LimeSurvey surveys |
| `matomo` | Matomo analytics |
| `mautic` | Mautic marketing automation |
| `n8n` | n8n workflow automation |
| `nextcloud` | Nextcloud file management |
| `nocodb` | NocoDB database |
| `postiz` | Postiz social media |
| `rustfs` | RustFS object storage |
| `stalwart` | Stalwart mail server |
| `tuwunel` | Tuwunel/Matrix chat |
| `txtai` | txtai semantic search |
| `uptime-kuma` | Uptime Kuma monitoring |
| `woocommerce` | WooCommerce store |
| `wuzapi` | WuzAPI WhatsApp gateway |

## Usage

```bash
npm install
npm run build
```

## Structure

```
opensaasapps-mcps/
├── shared/          # Shared utilities across servers
├── servers/         # Individual MCP server implementations
│   ├── calcom/
│   ├── erpnext/
│   └── ...
├── settings-snippet.json  # MCP client config snippet
└── tsconfig.base.json
```
