// Idempotent seed: a demo user, a handful of system workout templates, plus a
// recovery reading and a planned session for today — so the dashboard, calendar,
// and "today" endpoints return something to look at immediately after `npm run dev`.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const USER_ID = 'demo-user';

function utcToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: { id: USER_ID, email: 'demo@helf.app', name: 'Demo Athlete' },
  });

  const templates = [
    { id: 'tmpl-easy5k', title: 'Easy 5k', sportType: 'Running', intensity: 'EASY', estimatedDurationMin: 30, estimatedLoad: 24 },
    { id: 'tmpl-threshold', title: 'Threshold 4×5', sportType: 'Running', intensity: 'HARD', estimatedDurationMin: 50, estimatedLoad: 70 },
    { id: 'tmpl-z2ride', title: 'Zone 2 ride', sportType: 'Cycling', intensity: 'EASY', estimatedDurationMin: 90, estimatedLoad: 72 },
    { id: 'tmpl-heavylower', title: 'Heavy lower', sportType: 'Strength', intensity: 'HARD', estimatedDurationMin: 60, estimatedLoad: 84 },
    { id: 'tmpl-mobility', title: 'Mobility flow', sportType: 'Mobility', intensity: 'RECOVERY', estimatedDurationMin: 20, estimatedLoad: 10 },
  ];
  for (const t of templates) {
    await prisma.workoutTemplate.upsert({
      where: { id: t.id },
      update: t,
      create: { ...t, userId: null },
    });
  }

  const today = utcToday();
  await prisma.dailyRecovery.upsert({
    where: { userId_source_date: { userId: USER_ID, source: 'WHOOP', date: today } },
    update: { score: 58, hrvRmssd: 61, restingHeartRate: 56 },
    create: {
      userId: USER_ID,
      source: 'WHOOP',
      externalId: 'seed-recovery-today',
      date: today,
      score: 58,
      hrvRmssd: 61,
      restingHeartRate: 56,
      raw: '{}',
    },
  });

  await prisma.plannedWorkout.upsert({
    where: { id: 'plan-today-1' },
    update: {},
    create: {
      id: 'plan-today-1',
      userId: USER_ID,
      date: today,
      title: 'Heavy lower',
      sportType: 'Strength',
      intensity: 'HARD',
      estimatedDurationMin: 60,
      estimatedLoad: 84,
      order: 0,
    },
  });

  console.log(`• Seeded demo user "${USER_ID}" (email demo@helf.app) with templates + today's plan`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
