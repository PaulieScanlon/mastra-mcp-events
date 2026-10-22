import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { github, starPayload } from '../mcp/server';

const emitStep = createStep({
  id: 'emit',
  inputSchema: starPayload,
  outputSchema: z.object({ eventId: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const occurrence = await github.events.emit('repo.unstarred', inputData);
    mastra.getLogger().info(`Emitted repo.unstarred ${occurrence.eventId}`);
    return { eventId: occurrence.eventId };
  },
});

export const unstarRepoWorkflow = createWorkflow({
  id: 'unstar-repo',
  description: 'Emits a repo.unstarred event',
  inputSchema: starPayload,
  outputSchema: z.object({ eventId: z.string() }),
})
  .then(emitStep)
  .commit();
