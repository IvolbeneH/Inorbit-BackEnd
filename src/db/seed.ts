import dayjs from 'dayjs';
import { client, db } from '.';
import { goalCompletions, goals } from './schema';

async function seed() {
  await db.delete(goals);
  await db.delete(goalCompletions);

  const result = await db
    .insert(goals)
    .values([
      { title: 'Acordar cedo', desiredWeeklyFrequency: 5 },
      { title: 'Me exercitar', desiredWeeklyFrequency: 3 },
      { title: 'Meditar', desiredWeeklyFrequency: 1 },
    ])
    .returning();

  const startOffWeek = dayjs().startOf('week');

  await db.insert(goalCompletions).values([
    { goalId: result[0].id, createdAt: startOffWeek.toDate() },
    { goalId: result[1].id, createdAt: startOffWeek.add(1, 'day').toDate() },
  ]);
}
seed().finally(() => {
  client.end();
});
