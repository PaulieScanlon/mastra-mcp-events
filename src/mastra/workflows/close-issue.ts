import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { github, issuePayload } from '../mcp/server';

const emitStep = createStep({
  id: 'emit',
  inputSchema: issuePayload,
  outputSchema: z.object({ eventId: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const occurrence = await github.events.emit('issue.closed', inputData);
    mastra.getLogger().info(`Emitted issue.closed ${occurrence.eventId}`);
    return { eventId: occurrence.eventId };
  },
});

export const closeIssueWorkflow = createWorkflow({
  id: 'close-issue',
  description: 'Emits an issue.closed event',
  inputSchema: issuePayload,
  outputSchema: z.object({ eventId: z.string() }),
})
  .then(emitStep)
  .commit();
