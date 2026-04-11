# Tuwunel MCP Server

MCP server for [Tuwunel](https://github.com/girlbossceo/tuwunel) (Matrix-compatible chat server) — manage rooms, messages, and users via the Matrix Client-Server API.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TUWUNEL_URL` | Yes | Base URL of your Tuwunel/Matrix server (e.g. `https://matrix.example.com`) |
| `TUWUNEL_ACCESS_TOKEN` | Yes* | Matrix access token for authentication |
| `TUWUNEL_USERNAME` | No* | Username for password-based login |
| `TUWUNEL_PASSWORD` | No* | Password for password-based login |

*Either `TUWUNEL_ACCESS_TOKEN` or both `TUWUNEL_USERNAME` + `TUWUNEL_PASSWORD` are required.

## Tools (19)

### Messages
- **send_message** — Send a message to a room
- **get_messages** — Get messages from a room
- **search_messages** — Search messages across rooms
- **sync** — Sync latest events from the server

### Rooms
- **list_joined_rooms** — List all joined rooms
- **list_public_rooms** — List public rooms on the server
- **list_room_members** — List members of a room
- **create_room** — Create a new room
- **join_room** — Join a room
- **leave_room** — Leave a room
- **get_room_state** — Get the state of a room
- **set_room_name** — Set a room's name
- **set_room_topic** — Set a room's topic
- **invite_to_room** — Invite a user to a room
- **kick_from_room** — Kick a user from a room

### User
- **whoami** — Get the authenticated user ID
- **get_profile** — Get a user's profile
- **set_display_name** — Set your display name
- **set_avatar_url** — Set your avatar URL

## Usage

```json
{
  "mcpServers": {
    "tuwunel": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "TUWUNEL_URL": "https://matrix.example.com",
        "TUWUNEL_ACCESS_TOKEN": "your-access-token"
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
