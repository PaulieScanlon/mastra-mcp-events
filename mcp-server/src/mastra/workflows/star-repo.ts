import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { github, starPayload } from '../mcp/server';

const emitStep = createStep({
  id: 'emit',
  inputSchema: starPayload,
  outputSchema: z.object({ eventId: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const occurrence = await github.events.emit('repo.starred', inputData);
    mastra.getLogger().info(`Emitted repo.starred ${occurrence.eventId}`);
    return { eventId: occurrence.eventId };
  },
});

export const starRepoWorkflow = createWorkflow({
  id: 'star-repo',
  description: 'Emits a repo.starred event',
  inputSchema: starPayload,
  outputSchema: z.object({ eventId: z.string() }),
})
  .then(emitStep)
  .commit();
