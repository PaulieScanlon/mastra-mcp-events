import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { github, pullRequestPayload } from '../mcp/server';

const emitStep = createStep({
  id: 'emit',
  inputSchema: pullRequestPayload,
  outputSchema: z.object({ eventId: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const occurrence = await github.events.emit('pull_request.closed', inputData);
    mastra.getLogger().info(`Emitted pull_request.closed ${occurrence.eventId}`);
    return { eventId: occurrence.eventId };
  },
});

export const closePullRequestWorkflow = createWorkflow({
  id: 'close-pull-request',
  description: 'Emits a pull_request.closed event',
  inputSchema: pullRequestPayload,
  outputSchema: z.object({ eventId: z.string() }),
})
  .then(emitStep)
  .commit();
