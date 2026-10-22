import { Mastra } from '@mastra/core/mastra';
import { MastraCompositeStore } from '@mastra/core/storage';
import { registerApiRoute } from '@mastra/core/server';
import { SpanType } from '@mastra/core/observability';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { PinoLogger } from '@mastra/loggers';
import { Observability, MastraStorageExporter } from '@mastra/observability';
import { github } from './mcp/server';
import { starRepoWorkflow } from './workflows/star-repo';
import { unstarRepoWorkflow } from './workflows/unstar-repo';
import { openPullRequestWorkflow } from './workflows/open-pull-request';
import { closePullRequestWorkflow } from './workflows/close-pull-request';
import { openIssueWorkflow } from './workflows/open-issue';
import { closeIssueWorkflow } from './workflows/close-issue';

export const mastra = new Mastra({
  mcpServers: { github },
  workflows: { starRepoWorkflow, unstarRepoWorkflow, openPullRequestWorkflow, closePullRequestWorkflow, openIssueWorkflow, closeIssueWorkflow },
  server: {
    apiRoutes: [
      registerApiRoute('/github/webhook', {
        method: 'POST',
        requiresAuth: false,
        handler: async (c) => {
          const mastra = c.get('mastra');
          const logger = mastra.getLogger();
          const event = c.req.header('X-GitHub-Event');
          const body = await c.req.json();
          const repo = body.repository.full_name;

          if (event === 'star' && (body.action === 'created' || body.action === 'deleted')) {
            const workflow = body.action === 'created' ? 'starRepoWorkflow' : 'unstarRepoWorkflow';
            logger.info(`GitHub star.${body.action} received, starting ${workflow}`);
            const run = await mastra.getWorkflow(workflow).createRun();
            await run.start({
              inputData: { repo, user: body.sender.login, stars: body.repository.stargazers_count },
            });
          }

          if (event === 'pull_request' && (body.action === 'opened' || body.action === 'closed')) {
            const workflow = body.action === 'opened' ? 'openPullRequestWorkflow' : 'closePullRequestWorkflow';
            logger.info(`GitHub pull_request.${body.action} received, starting ${workflow}`);
            const run = await mastra.getWorkflow(workflow).createRun();
            await run.start({
              inputData: {
                repo,
                number: body.pull_request.number,
                title: body.pull_request.title,
                author: body.pull_request.user.login,
                url: body.pull_request.html_url,
                merged: body.pull_request.merged,
              },
            });
          }

          if (event === 'issues' && (body.action === 'opened' || body.action === 'closed')) {
            const workflow = body.action === 'opened' ? 'openIssueWorkflow' : 'closeIssueWorkflow';
            logger.info(`GitHub issues.${body.action} received, starting ${workflow}`);
            const run = await mastra.getWorkflow(workflow).createRun();
            await run.start({
              inputData: {
                repo,
                number: body.issue.number,
                title: body.issue.title,
                author: body.issue.user.login,
                url: body.issue.html_url,
                reason: body.issue.state_reason ?? undefined,
              },
            });
          }

          return c.json({ ok: true });
        },
      }),
    ],
  },
  logger: new PinoLogger({ name: 'Mastra', level: 'info' }),
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({ id: 'mastra-storage', url: 'file:./mastra.db' }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    },
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mcp-server',
        exporters: [new MastraStorageExporter()],
        excludeSpanTypes: [SpanType.MCP_SERVER_REQUEST],
      },
    },
  }),
});
