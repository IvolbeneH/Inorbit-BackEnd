import { z } from 'zod';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { CreateGoalCompletion } from '../../services/create-goal-completion';

export const goalCompletionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/completions',
    {
      schema: {
        body: z.object({
          goalId: z.string(),
        }),
      },
    },
    async (request) => {
      const { goalId } = request.body;

      await CreateGoalCompletion({
        goalId,
      });
    }
  );
};
