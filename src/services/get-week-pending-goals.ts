import dayjs from 'dayjs';
import { db } from '../db';
import { goalCompletions, goals } from '../db/schema';
import { and, count, eq, gte, lte, sql } from 'drizzle-orm';

export async function getWeekPendingGoals() {
  const fistDayOfWeek = dayjs().startOf('week').toDate();
  const lastDayOfWeek = dayjs().endOf('week').toDate();

  const goalsCreatedUpToWeek = db.$with('goals_created_up_to_week').as(
    db
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        createdAt: goals.createdAt,
      })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfWeek))
  );

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
          gte(goalCompletions.createdAt, fistDayOfWeek)
        )
      )
      .groupBy(goalCompletions.goalId)
  );

  const pendingGoals = await db
    .with(goalsCreatedUpToWeek, goalsCompletionCount)
    .select({
      id: goalsCreatedUpToWeek.id,
      title: goalsCreatedUpToWeek.title,
      desiredWeeklyFrequency: sql`
      COALESCE(${goalsCreatedUpToWeek.desiredWeeklyFrequency}, 0)
    `.mapWith(Number),
      completionCount: sql`
          COALESCE(${goalsCompletionCount.completionCount}, 0)
          `.mapWith(Number),
    })
    .from(goalsCreatedUpToWeek)
    .leftJoin(
      goalsCompletionCount,
      eq(goalsCompletionCount.goalId, goalsCreatedUpToWeek.id)
    );

  return { pendingGoals };
}
