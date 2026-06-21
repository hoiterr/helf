import type {
  CalendarDay,
  DashboardResponse,
  ParsedWorkout,
  PlannedItem,
  Template,
  TodayResponse,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
export const USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? 'demo-user';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${path}${body ? `: ${body}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: BASE,
  userId: USER_ID,

  today: () => request<TodayResponse>(`/users/${USER_ID}/today`),
  dashboard: () => request<DashboardResponse>(`/users/${USER_ID}/dashboard`),
  calendar: (from: string, to: string) =>
    request<CalendarDay[]>(`/users/${USER_ID}/calendar?from=${from}&to=${to}`),
  templates: () => request<Template[]>(`/users/${USER_ID}/templates`),

  parse: (text: string) =>
    request<ParsedWorkout>(`/planning/parse`, { method: 'POST', body: JSON.stringify({ text }) }),

  createPlanned: (body: { date: string; text?: string; templateId?: string }) =>
    request<PlannedItem>(`/users/${USER_ID}/planned`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updatePlanned: (id: string, body: Record<string, unknown>) =>
    request<PlannedItem>(`/planned/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};
