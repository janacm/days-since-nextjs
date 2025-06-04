import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { EventItem } from '../event';
import { Event } from '@/lib/db';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock the actions
jest.mock('../actions', () => ({
  deleteEvent: jest.fn(),
  resetEvent: jest.fn(),
  resetEventWithDate: jest.fn()
}));

// Mock long press hook to prevent errors
jest.mock('../../../lib/hooks/use-long-press', () => ({
  useLongPress: jest.fn(({ onClick }) => ({
    onMouseDown: jest.fn(),
    onMouseUp: jest.fn(),
    onMouseLeave: jest.fn(),
    onTouchStart: jest.fn(),
    onTouchEnd: jest.fn(),
    onClick: onClick || jest.fn(),
    isPressed: false
  }))
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('Event Navigation', () => {
  const mockEvent: Event = {
    id: 123,
    userId: 'user123',
    name: 'Test Event',
    date: '2024-01-01T00:00:00.000Z',
    resetCount: 2,
    createdAt: new Date('2024-01-01'),
    reminderDays: null,
    reminderSent: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    } as any);
  });

  it('navigates to analytics page when row is clicked', () => {
    // Wrap EventItem in a table to avoid HTML structure warnings
    render(
      <table>
        <tbody>
          <EventItem event={mockEvent} />
        </tbody>
      </table>
    );

    const row = screen.getByRole('row');
    fireEvent.click(row);

    expect(mockPush).toHaveBeenCalledWith('/events/123');
  });

  it('does not navigate when reset button area is clicked', () => {
    render(
      <table>
        <tbody>
          <EventItem event={mockEvent} />
        </tbody>
      </table>
    );

    // Find the reset button by its accessible name from sr-only text
    const resetButton = screen
      .getByText('Reset event (long press for custom date)')
      .closest('button');
    if (resetButton) {
      fireEvent.click(resetButton);
      // Since the button has stopPropagation, navigation should not occur
      expect(mockPush).not.toHaveBeenCalled();
    }
  });

  it('does not navigate when dropdown menu is clicked', () => {
    render(
      <table>
        <tbody>
          <EventItem event={mockEvent} />
        </tbody>
      </table>
    );

    // Find the dropdown trigger button by its accessible name from sr-only text
    const dropdownButton = screen.getByText('Toggle menu').closest('button');
    if (dropdownButton) {
      fireEvent.click(dropdownButton);
      expect(mockPush).not.toHaveBeenCalled();
    }
  });

  it('applies correct hover styles to table row', () => {
    render(
      <table>
        <tbody>
          <EventItem event={mockEvent} />
        </tbody>
      </table>
    );

    const row = screen.getByRole('row');
    expect(row).toHaveClass(
      'cursor-pointer',
      'hover:bg-muted/50',
      'transition-colors'
    );
  });

  it('shows reminder badge when reminder is due', () => {
    const eventWithReminder: Event = {
      ...mockEvent,
      reminderDays: 5,
      reminderSent: false
    };

    // Mock current date to make reminder due
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-10T00:00:00.000Z')); // 9 days after event

    render(
      <table>
        <tbody>
          <EventItem event={eventWithReminder} />
        </tbody>
      </table>
    );

    expect(screen.getByText('Reminder due!')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('shows correct days countdown for reminder', () => {
    const eventWithReminder: Event = {
      ...mockEvent,
      reminderDays: 10,
      reminderSent: false
    };

    // Mock current date - 5 days after event start
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-06T00:00:00.000Z'));

    render(
      <table>
        <tbody>
          <EventItem event={eventWithReminder} />
        </tbody>
      </table>
    );

    expect(screen.getByText('Remind in 5 days')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('calculates correct days since event', () => {
    // Mock current date - 15 days after event start
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-16T00:00:00.000Z'));

    render(
      <table>
        <tbody>
          <EventItem event={mockEvent} />
        </tbody>
      </table>
    );

    expect(screen.getByText('15')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('formats event date in UTC', () => {
    const originalTZ = process.env.TZ;
    process.env.TZ = 'America/New_York';

    render(
      <table>
        <tbody>
          <EventItem event={mockEvent} />
        </tbody>
      </table>
    );

    expect(screen.getByText('January 1, 2024')).toBeInTheDocument();

    process.env.TZ = originalTZ;
  });
});

describe('Event Navigation Integration', () => {
  it('can find basic event structure without errors', () => {
    const mockEvent: Event = {
      id: 123,
      userId: 'user123',
      name: 'Test Event',
      date: '2024-01-01T00:00:00.000Z',
      resetCount: 2,
      createdAt: new Date('2024-01-01'),
      reminderDays: null,
      reminderSent: false
    };

    render(
      <table>
        <tbody>
          <EventItem event={mockEvent} />
        </tbody>
      </table>
    );

    // Verify the component renders without errors and has the correct structure
    expect(screen.getByRole('row')).toBeInTheDocument();
    expect(screen.getByText('Toggle menu')).toBeInTheDocument();
    expect(
      screen.getByText('Reset event (long press for custom date)')
    ).toBeInTheDocument();
  });
});
