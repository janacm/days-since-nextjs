import React from 'react';
import { render } from '@testing-library/react';
import DashboardPage from '../page';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => ({ user: { email: 'user@example.com' } }))
}));

jest.mock('@/lib/db', () => ({
  getEvents: jest.fn(async () => [
    {
      id: 1,
      userId: 'user@example.com',
      name: 'Public Event A',
      date: '2025-01-01T00:00:00.000Z',
      resetCount: 0,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      reminderDays: null,
      reminderSent: false,
      isPrivate: false
    },
    {
      id: 2,
      userId: 'user@example.com',
      name: 'Private Event B',
      date: '2025-01-02T00:00:00.000Z',
      resetCount: 0,
      createdAt: new Date('2025-01-02T00:00:00.000Z'),
      reminderDays: null,
      reminderSent: false,
      isPrivate: true
    },
    {
      id: 3,
      userId: 'user@example.com',
      name: 'Public Event C',
      date: '2025-01-03T00:00:00.000Z',
      resetCount: 0,
      createdAt: new Date('2025-01-03T00:00:00.000Z'),
      reminderDays: 5,
      reminderSent: false,
      isPrivate: false
    }
  ])
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

const calls: any[] = [];
jest.mock('../events-table', () => {
  return {
    EventsTable: ({ events }: { events: any[] }) => {
      calls.push(events);
      return <div />;
    }
  };
});

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

describe('DashboardPage Private Tab Filtering', () => {
  it('excludes private events from the All tab', async () => {
    const element = await DashboardPage();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-02-01T00:00:00.000Z'));
    calls.length = 0;
    render(element as React.ReactElement);

    // Only the default "all" tab content renders on initial load
    expect(calls.length).toBe(1);
    const [allEvents] = calls;
    expect(allEvents.map((e: any) => e.name)).toEqual([
      'Public Event A',
      'Public Event C'
    ]);

    jest.useRealTimers();
  });
});
