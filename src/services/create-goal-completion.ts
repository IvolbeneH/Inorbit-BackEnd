import { and, count, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { goalCompletions, goals } from '../db/schema';
import dayjs from 'dayjs';

interface CreateGoalCompletionRequest {
  goalId: string;
}

export async function CreateGoalCompletion({
  goalId,
}: CreateGoalCompletionRequest) {
  const fistDayOfWeek = dayjs().startOf('week').toDate();
  const lastDayOfWeek = dayjs().endOf('week').toDate();

  const goalsCompletionCount = db.$with('goals_completion_counts').as(
    db
      .select({
        goalId: goalCompletions.goalId,
        completionCount: count(goalCompletions.id).as('completionCount'),
      })
      .from(goalCompletions)
      .where(
        and(
          lte(goalCompletions.createdAt, lastDayOfWeek),
          gte(goalCompletions.createdAt, fistDayOfWeek),
          eq(goalCompletions.goalId, goalId)
        )
      )
      .groupBy(goalCompletions.goalId)
  );

  const result = await db
    .with(goalsCompletionCount)
    .select({
      desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
      completionCount: sql`
        COALESCE(${goalsCompletionCount.completionCount}, 0)
        `.mapWith(Number),
    })
    .from(goals)
    .leftJoin(goalsCompletionCount, eq(goalsCompletionCount.goalId, goalId))
    .where(eq(goals.id, goalId))
    .limit(1);

  const { completionCount, desiredWeeklyFrequency } = result[0];

  if (completionCount >= (desiredWeeklyFrequency ?? 0)) {
    throw new Error('Goal alredy completed this week!');
  }

  const insertResult = await db
    .insert(goalCompletions)
    .values({ goalId })
    .returning();

  const goalCompletion = insertResult[0];

  return { goalCompletion };
}
