import React from 'react';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getEventAnalytics } from '@/lib/db';
import EventAnalyticsPage from '../page';

// Mock Next.js functions
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn()
}));

// Mock database function
jest.mock('@/lib/db', () => ({
  getEventAnalytics: jest.fn()
}));

// Mock the analytics charts component
jest.mock('../analytics-charts', () => ({
  AnalyticsCharts: ({ event, currentStreak, totalResets }: any) => (
    <div data-testid="analytics-charts">
      <div>Event: {event.name}</div>
      <div>Current: {currentStreak}</div>
      <div>Total Resets: {totalResets}</div>
    </div>
  )
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetEventAnalytics = getEventAnalytics as jest.MockedFunction<
  typeof getEventAnalytics
>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

describe('EventAnalyticsPage', () => {
  const mockAnalyticsData = {
    event: {
      id: 1,
      userId: 'user123',
      name: 'Test Event',
      date: '2024-01-01T00:00:00.000Z',
      resetCount: 3,
      createdAt: new Date('2024-01-01'),
      reminderDays: 14,
      reminderSent: false
    },
    totalResets: 3,
    currentStreak: 10,
    longestStreak: 25,
    averageDaysBetweenResets: 15,
    recentResets: [
      {
        id: 1,
        eventId: 1,
        resetAt: new Date('2024-02-15T10:00:00.000Z')
      },
      {
        id: 2,
        eventId: 1,
        resetAt: new Date('2024-02-01T10:00:00.000Z')
      }
    ],
    allResets: [
      {
        id: 1,
        eventId: 1,
        resetAt: new Date('2024-02-15T10:00:00.000Z')
      },
      {
        id: 2,
        eventId: 1,
        resetAt: new Date('2024-02-01T10:00:00.000Z')
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to login when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null as any);

    await EventAnalyticsPage({
      params: Promise.resolve({ id: '1' })
    });

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to home when event ID is invalid', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any);

    await EventAnalyticsPage({
      params: Promise.resolve({ id: 'invalid' })
    });

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('renders analytics page with correct data', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any);
    mockGetEventAnalytics.mockResolvedValue(mockAnalyticsData as any);

    const result = await EventAnalyticsPage({
      params: Promise.resolve({ id: '1' })
    });

    // Since this is a server component, we need to render the returned JSX
    render(result as React.ReactElement);

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Days Since Reset')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Current streak
    expect(screen.getByText('Total Resets')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Total resets
    expect(screen.getByText('Longest Period')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument(); // Longest streak
    expect(screen.getByText('Average Days')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // Average
  });

  it('shows reminder badge when event has reminder', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any);
    mockGetEventAnalytics.mockResolvedValue(mockAnalyticsData as any);

    const result = await EventAnalyticsPage({
      params: Promise.resolve({ id: '1' })
    });

    render(result as React.ReactElement);

    expect(screen.getByText('Reminder every 14 days')).toBeInTheDocument();
  });

  it('renders recent resets section when resets exist', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any);
    mockGetEventAnalytics.mockResolvedValue(mockAnalyticsData as any);

    const result = await EventAnalyticsPage({
      params: Promise.resolve({ id: '1' })
    });

    render(result as React.ReactElement);

    expect(screen.getByText('Recent Resets')).toBeInTheDocument();
  });

  it('renders no resets message when no resets exist', async () => {
    const noResetsData = {
      ...mockAnalyticsData,
      totalResets: 0,
      recentResets: [],
      allResets: [],
      currentStreak: 45
    };

    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any);
    mockGetEventAnalytics.mockResolvedValue(noResetsData as any);

    const result = await EventAnalyticsPage({
      params: Promise.resolve({ id: '1' })
    });

    render(result as React.ReactElement);

    expect(screen.getByText('No resets yet!')).toBeInTheDocument();
    expect(screen.getByText(/tracking for 45 days/)).toBeInTheDocument();
  });

  it('includes back to events link', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any);
    mockGetEventAnalytics.mockResolvedValue(mockAnalyticsData as any);

    const result = await EventAnalyticsPage({
      params: Promise.resolve({ id: '1' })
    });

    render(result as React.ReactElement);

    const backLink = screen.getByRole('link', { name: /back to events/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('renders analytics charts component', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any);
    mockGetEventAnalytics.mockResolvedValue(mockAnalyticsData as any);

    const result = await EventAnalyticsPage({
      params: Promise.resolve({ id: '1' })
    });

    render(result as React.ReactElement);

    expect(screen.getByTestId('analytics-charts')).toBeInTheDocument();
    expect(screen.getByText('Event: Test Event')).toBeInTheDocument();
    expect(screen.getByText('Current: 10')).toBeInTheDocument();
    expect(screen.getByText('Total Resets: 3')).toBeInTheDocument();
  });

  it('handles analytics loading error gracefully', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any);
    mockGetEventAnalytics.mockRejectedValue(new Error('Event not found'));

    await EventAnalyticsPage({
      params: Promise.resolve({ id: '1' })
    });

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('formats event date correctly', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any);
    mockGetEventAnalytics.mockResolvedValue(mockAnalyticsData as any);

    const result = await EventAnalyticsPage({
      params: Promise.resolve({ id: '1' })
    });

    render(result as React.ReactElement);

    // Use getAllByText since the date appears in multiple elements
    const dateElements = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('December 31, 2023') || false;
    });
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('shows correct metric descriptions', async () => {
    mockAuth.mockResolvedValue({
      user: { email: 'test@example.com' }
    } as any);
    mockGetEventAnalytics.mockResolvedValue(mockAnalyticsData as any);

    const result = await EventAnalyticsPage({
      params: Promise.resolve({ id: '1' })
    });

    render(result as React.ReactElement);

    expect(screen.getByText('days since last reset')).toBeInTheDocument();
    expect(screen.getByText('times reset since start')).toBeInTheDocument();
    expect(screen.getByText('best performance')).toBeInTheDocument();
    expect(screen.getByText('days on average')).toBeInTheDocument();
  });
});
