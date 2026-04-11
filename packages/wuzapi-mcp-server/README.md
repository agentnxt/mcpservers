# WuzAPI MCP Server

MCP server for [WuzAPI](https://github.com/asternic/wuzapi) — a WhatsApp API gateway built on the whatsmeow library.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `WUZAPI_URL` | Yes | Base URL of your WuzAPI instance (e.g. `http://wuzapi:8080`) |
| `WUZAPI_TOKEN` | Yes | WuzAPI authentication token |

## Tools (13)

### Messaging
- **send_text** — Send a text message
- **send_image** — Send an image message
- **send_document** — Send a document
- **send_audio** — Send an audio message
- **send_video** — Send a video message
- **send_contact** — Send a contact card

### Contacts & Messages
- **list_contacts** — List all contacts
- **get_messages** — Get messages from a chat
- **check_number** — Check if a phone number is on WhatsApp

### Session
- **session_status** — Get current session status
- **session_connect** — Connect/start a WhatsApp session
- **session_disconnect** — Disconnect the session
- **session_qr** — Get QR code for authentication

## Usage

```json
{
  "mcpServers": {
    "wuzapi": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "WUZAPI_URL": "http://localhost:8080",
        "WUZAPI_TOKEN": "your-wuzapi-token"
      }
    }
  }
}
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```
