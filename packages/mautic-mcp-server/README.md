# Mautic MCP Server

MCP server for the [Mautic](https://www.mautic.org/) open-source marketing automation platform API.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MAUTIC_URL` | Yes | Base URL of your Mautic instance (e.g. `https://mautic.example.com`) |
| `MAUTIC_USERNAME` | Yes | Mautic username for basic auth |
| `MAUTIC_PASSWORD` | Yes | Mautic password for basic auth |

## Tools (26)

### Contacts
- **list_contacts** — List all contacts
- **get_contact** — Get a contact by ID
- **create_contact** — Create a new contact
- **update_contact** — Update a contact
- **delete_contact** — Delete a contact
- **add_points** — Add points to a contact
- **subtract_points** — Subtract points from a contact

### Campaigns
- **list_campaigns** — List all campaigns
- **get_campaign** — Get a campaign by ID
- **create_campaign** — Create a new campaign
- **add_contact_to_campaign** — Add a contact to a campaign
- **remove_contact_from_campaign** — Remove a contact from a campaign

### Emails
- **list_emails** — List all emails
- **get_email** — Get an email by ID
- **create_email** — Create a new email
- **send_email_to_contact** — Send an email to a specific contact
- **send_email_to_segment** — Send an email to a segment

### Segments
- **list_segments** — List all segments
- **get_segment** — Get a segment by ID
- **create_segment** — Create a new segment
- **add_contact_to_segment** — Add a contact to a segment
- **remove_contact_from_segment** — Remove a contact from a segment

### Forms
- **list_forms** — List all forms
- **get_form** — Get a form by ID
- **get_form_submissions** — Get form submissions
- **delete_form** — Delete a form

## Usage

```json
{
  "mcpServers": {
    "mautic": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "MAUTIC_URL": "https://mautic.example.com",
        "MAUTIC_USERNAME": "admin",
        "MAUTIC_PASSWORD": "your-password"
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
