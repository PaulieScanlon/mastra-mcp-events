import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { github, pullRequestPayload } from '../mcp/server';

const emitStep = createStep({
  id: 'emit',
  inputSchema: pullRequestPayload,
  outputSchema: z.object({ eventId: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const occurrence = await github.events.emit('pull_request.opened', inputData);
    mastra.getLogger().info(`Emitted pull_request.opened ${occurrence.eventId}`);
    return { eventId: occurrence.eventId };
  },
});

export const openPullRequestWorkflow = createWorkflow({
  id: 'open-pull-request',
  description: 'Emits a pull_request.opened event',
  inputSchema: pullRequestPayload,
  outputSchema: z.object({ eventId: z.string() }),
})
  .then(emitStep)
  .commit();
