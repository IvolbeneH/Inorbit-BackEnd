import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { getWeekSummary } from '../../services/get-week-summary';

export const getWeekSummaryRoute: FastifyPluginAsyncZod = async (app) => {
  app.get('/summary', () => {
    return getWeekSummary();
  });
};
