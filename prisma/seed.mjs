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

function startOfUtcWeek(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
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

  // ── Periodization: a plan with blocks + a recurring rule, materialized ──────
  const weekStart = startOfUtcWeek(new Date());
  await prisma.trainingPlan.upsert({
    where: { id: 'plan-spring-build' },
    update: {},
    create: {
      id: 'plan-spring-build',
      userId: USER_ID,
      name: 'Spring Build',
      startDate: weekStart,
      blocks: {
        create: [
          { name: 'Base', focus: 'BASE', weeks: 2, order: 0, weeklyLoadTarget: 280 },
          { name: 'Build', focus: 'BUILD', weeks: 3, order: 1, weeklyLoadTarget: 360 },
          { name: 'Taper', focus: 'TAPER', weeks: 1, order: 2, weeklyLoadTarget: 200 },
        ],
      },
    },
  });

  await prisma.recurringRule.upsert({
    where: { id: 'rule-threshold' },
    update: {},
    create: {
      id: 'rule-threshold',
      userId: USER_ID,
      planId: 'plan-spring-build',
      title: 'Threshold run',
      sportType: 'Running',
      intensity: 'HARD',
      estimatedDurationMin: 50,
      estimatedLoad: 70,
      daysOfWeek: JSON.stringify([2, 4]), // Tue + Thu
      weekInterval: 1,
      startDate: weekStart,
      active: true,
    },
  });

  // Materialize the recurring rule across the next 21 days (deterministic ids → idempotent).
  for (let i = 0; i < 21; i++) {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    if (![2, 4].includes(d.getUTCDay())) continue;
    const id = `gen-threshold-${d.toISOString().slice(0, 10)}`;
    await prisma.plannedWorkout.upsert({
      where: { id },
      update: {},
      create: {
        id,
        userId: USER_ID,
        date: d,
        title: 'Threshold run',
        sportType: 'Running',
        intensity: 'HARD',
        estimatedDurationMin: 50,
        estimatedLoad: 70,
        status: 'PLANNED',
        order: 5,
        generated: true,
        recurringRuleId: 'rule-threshold',
        planId: 'plan-spring-build',
      },
    });
  }

  console.log(
    `• Seeded demo user "${USER_ID}" with templates, today's plan, and "Spring Build" plan (3 blocks + recurring threshold runs)`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
