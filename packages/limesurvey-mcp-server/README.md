# LimeSurvey MCP Server

MCP server for the [LimeSurvey](https://www.limesurvey.org/) survey platform RemoteControl API.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `LIMESURVEY_URL` | Yes | Base URL of your LimeSurvey instance (e.g. `https://survey.example.com`) |
| `LIMESURVEY_USERNAME` | Yes | LimeSurvey admin username |
| `LIMESURVEY_PASSWORD` | Yes | LimeSurvey admin password |

## Tools (16)

### Surveys
- **list_surveys** — List all surveys
- **get_survey_properties** — Get survey properties
- **add_survey** — Create a new survey
- **delete_survey** — Delete a survey
- **activate_survey** — Activate a survey
- **set_survey_properties** — Update survey properties

### Questions & Groups
- **list_questions** — List all questions in a survey
- **get_question_properties** — Get question properties
- **list_groups** — List question groups in a survey
- **add_group** — Add a question group

### Participants & Responses
- **list_participants** — List survey participants
- **add_participants** — Add participants to a survey
- **get_response_ids** — Get response IDs for a survey
- **add_response** — Submit a response to a survey
- **export_responses** — Export survey responses
- **get_summary** — Get response summary statistics

## Usage

```json
{
  "mcpServers": {
    "limesurvey": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "LIMESURVEY_URL": "https://survey.example.com",
        "LIMESURVEY_USERNAME": "admin",
        "LIMESURVEY_PASSWORD": "your-password"
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
