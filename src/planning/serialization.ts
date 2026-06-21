import { PlannedWorkout, WorkoutTemplate } from '@prisma/client';
import { WorkoutStep } from './workout-step.types';

/**
 * `steps` is stored as a JSON string (SQLite has no Json column). These helpers
 * deserialize it back to structured objects at the API read boundary, so clients
 * get `steps: WorkoutStep[]` rather than an escaped string.
 */
export function parseSteps(raw: string | null | undefined): WorkoutStep[] | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkoutStep[];
  } catch {
    return null;
  }
}

export type PlannedView = Omit<PlannedWorkout, 'steps'> & { steps: WorkoutStep[] | null };
export type TemplateView = Omit<WorkoutTemplate, 'steps'> & { steps: WorkoutStep[] | null };

export function viewPlanned(row: PlannedWorkout): PlannedView {
  return { ...row, steps: parseSteps(row.steps) };
}

export function viewTemplate(row: WorkoutTemplate): TemplateView {
  return { ...row, steps: parseSteps(row.steps) };
}
