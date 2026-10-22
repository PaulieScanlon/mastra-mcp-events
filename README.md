# mastra-mcp-events

A demo of [MCP events](https://mastra.ai/docs/guides/mcp-events) in Mastra. GitHub activity on a repo is turned into MCP events, and a desktop Octocat subscribes to them and reacts in real time.

```text
GitHub webhook → Mastra server (MCP server) → MCP events → Octocat app (MCP client)
```

- **Caller:** GitHub. Starring the repo, or opening and closing PRs and issues, sends a webhook.
- **MCP server:** this Mastra project. A custom route receives the webhook and starts a workflow, and the workflow emits an MCP event with `server.events.emit()`.
- **Subscriber:** the Electron app in `src/octocat-app`. It uses `MCPClient` to subscribe to each event and animates the Octocat when one arrives.

## Events

| GitHub webhook | Workflow | MCP event |
| --- | --- | --- |
| `star.created` | `starRepoWorkflow` | `repo.starred` |
| `star.deleted` | `unstarRepoWorkflow` | `repo.unstarred` |
| `pull_request.opened` | `openPullRequestWorkflow` | `pull_request.opened` |
| `pull_request.closed` | `closePullRequestWorkflow` | `pull_request.closed` |
| `issues.opened` | `openIssueWorkflow` | `issue.opened` |
| `issues.closed` | `closeIssueWorkflow` | `issue.closed` |

Each event is defined with `defineEvent()` in `src/mastra/mcp/server.ts`, and subscribers can filter by `repo`. Every workflow run is traced and logged, so each event shows up in Studio under Traces and Logs.

## Structure

```text
src/
├── mastra/        Mastra server: webhook route, workflows, MCP server with events
└── octocat-app/   Electron app: MCPClient subscriber and Octocat animations
```

## Run it

Start the MCP server:

```bash
npm install
npm run dev
```

Start the Octocat app:

```bash
cd src/octocat-app
npm install
npm start
```

Forward GitHub webhooks to the local server:

```bash
npx smee-client --url https://smee.io/<channel> --target http://localhost:4111/github/webhook
```

## GitHub webhook

Add a webhook to the repo under **Settings → Webhooks**:

- **Payload URL:** your smee.io channel, or `https://<your-server>/github/webhook` when deployed
- **Content type:** `application/json`
- **Events:** Stars, Pull requests, Issues

## Octocat app

On startup the app fetches the real star, open PR, and open issue counts from the GitHub API, then keeps them updated from MCP events. It fetches the counts again whenever a subscription reconnects, so a missed event can't leave them wrong. The test buttons fire each animation without GitHub.

Octocat artwork from [myoctocat.com](https://myoctocat.com).
