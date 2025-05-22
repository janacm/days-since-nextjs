import { Event } from '@/shared/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://dayssince.app';

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
}

export async function signup(email: string, password: string, name?: string) {
  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  if (!res.ok) throw new Error('Signup failed');
}

export async function logout() {
  await fetch(`${API_URL}/api/auth/signout`, { method: 'POST' });
}

export async function getEvents(): Promise<Event[]> {
  const res = await fetch(`${API_URL}/api/events`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function getEvent(id: number): Promise<Event | null> {
  const res = await fetch(`${API_URL}/api/events/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function createEvent(name: string, date: Date) {
  await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, date: date.toISOString() })
  });
}

export async function updateEvent(
  id: number,
  name: string,
  date: Date,
  reminderDays?: number | null
) {
  await fetch(`${API_URL}/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, date: date.toISOString(), reminderDays })
  });
}

export async function sendTestEmail() {
  await fetch(`${API_URL}/api/reminders`, { method: 'POST' });
}
