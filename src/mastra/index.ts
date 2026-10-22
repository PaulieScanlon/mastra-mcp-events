import { Mastra } from '@mastra/core/mastra';
import { MastraCompositeStore } from '@mastra/core/storage';
import { registerApiRoute } from '@mastra/core/server';
import { EntityType, SpanType, getOrCreateSpan } from '@mastra/core/observability';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { PinoLogger } from '@mastra/loggers';
import { Observability, MastraStorageExporter } from '@mastra/observability';
import { github } from './mcp/server';

export const mastra = new Mastra({
  mcpServers: { github },
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

          let name: 'repo.starred' | 'repo.unstarred' | 'pull_request.opened' | 'pull_request.closed' | 'issue.opened' | 'issue.closed' | undefined;
          let data: Record<string, unknown> = {};

          if (event === 'star' && (body.action === 'created' || body.action === 'deleted')) {
            name = body.action === 'created' ? 'repo.starred' : 'repo.unstarred';
            data = { repo, user: body.sender.login, stars: body.repository.stargazers_count };
          }

          if (event === 'pull_request' && (body.action === 'opened' || body.action === 'closed')) {
            name = body.action === 'opened' ? 'pull_request.opened' : 'pull_request.closed';
            data = {
              repo,
              number: body.pull_request.number,
              title: body.pull_request.title,
              author: body.pull_request.user.login,
              url: body.pull_request.html_url,
              merged: body.pull_request.merged,
            };
          }

          if (event === 'issues' && (body.action === 'opened' || body.action === 'closed')) {
            name = body.action === 'opened' ? 'issue.opened' : 'issue.closed';
            data = {
              repo,
              number: body.issue.number,
              title: body.issue.title,
              author: body.issue.user.login,
              url: body.issue.html_url,
              reason: body.issue.state_reason ?? undefined,
            };
          }

          if (!name) {
            return c.json({ ok: true });
          }

          const span = getOrCreateSpan({
            type: SpanType.MCP_SERVER_REQUEST,
            name: `events/emit ${name}`,
            entityType: EntityType.MCP_SERVER,
            entityId: github.id,
            entityName: github.name,
            input: data,
            attributes: { mcpMethod: 'events/emit', targetName: name, mcpServer: github.name },
            tracingContext: {},
            mastra,
          });
          const occurrence = await github.events.emit(name, data);
          logger.info(`Emitted ${name} ${occurrence.eventId}`);
          span?.end({ output: occurrence });

          return c.json({ eventId: occurrence.eventId });
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
        spanFilter: (span) => {
          return span.name !== 'events/list' && !span.name.startsWith('events/stream');
        },
      },
    },
  }),
});
