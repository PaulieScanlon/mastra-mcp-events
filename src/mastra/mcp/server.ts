import { MCPServer, defineEvent } from '@mastra/mcp';
import { z } from 'zod';

export const repoArgs = z.object({ repo: z.string().optional() });

export const starPayload = z.object({
  repo: z.string(),
  user: z.string(),
  stars: z.number(),
});

export const pullRequestPayload = z.object({
  repo: z.string(),
  number: z.number(),
  title: z.string(),
  author: z.string(),
  url: z.string(),
  merged: z.boolean().optional(),
});

export const issuePayload = z.object({
  repo: z.string(),
  number: z.number(),
  title: z.string(),
  author: z.string(),
  url: z.string(),
  reason: z.string().optional(),
});

const matchRepo = (args: z.infer<typeof repoArgs>, data: { repo: string }) => {
  return !args.repo || data.repo === args.repo;
};

export const github: MCPServer = new MCPServer({
  id: 'github',
  name: 'GitHub',
  version: '1.0.0',
  tools: {},
  events: {
    'repo.starred': defineEvent({
      description: 'Someone starred the repository',
      inputSchema: repoArgs,
      payloadSchema: starPayload,
      match: matchRepo,
    }),
    'repo.unstarred': defineEvent({
      description: 'Someone removed their star from the repository',
      inputSchema: repoArgs,
      payloadSchema: starPayload,
      match: matchRepo,
    }),
    'pull_request.opened': defineEvent({
      description: 'A pull request was opened',
      inputSchema: repoArgs,
      payloadSchema: pullRequestPayload,
      match: matchRepo,
    }),
    'pull_request.closed': defineEvent({
      description: 'A pull request was closed or merged',
      inputSchema: repoArgs,
      payloadSchema: pullRequestPayload,
      match: matchRepo,
    }),
    'issue.opened': defineEvent({
      description: 'An issue was opened',
      inputSchema: repoArgs,
      payloadSchema: issuePayload,
      match: matchRepo,
    }),
    'issue.closed': defineEvent({
      description: 'An issue was closed',
      inputSchema: repoArgs,
      payloadSchema: issuePayload,
      match: matchRepo,
    }),
  },
});
