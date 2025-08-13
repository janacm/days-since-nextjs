import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { EventsTable } from '../events-table';
import { Event } from '@/lib/db';

// Mock server actions and hooks to avoid loading server-related code in tests
jest.mock('../actions', () => ({
  deleteEvent: jest.fn(),
  resetEvent: jest.fn(),
  resetEventWithDate: jest.fn()
}));
jest.mock('../../../lib/hooks/use-long-press', () => ({
  useLongPress: jest.fn(() => ({
    onMouseDown: jest.fn(),
    onMouseUp: jest.fn(),
    onMouseLeave: jest.fn(),
    onTouchStart: jest.fn(),
    onTouchEnd: jest.fn(),
    onClick: jest.fn(),
    isPressed: false
  }))
}));

describe('EventsTable column resizing', () => {
  const mockEvents: Event[] = [
    {
      id: 1,
      userId: 'user1',
      name: 'First',
      date: '2024-01-01T00:00:00.000Z',
      resetCount: 0,
      createdAt: new Date('2024-01-01'),
      reminderDays: null,
      reminderSent: false
    }
  ];

  it('renders default column widths', () => {
    render(<EventsTable events={mockEvents} />);
    const cols = document.querySelectorAll('colgroup col');
    expect(cols).toHaveLength(5);
    expect(cols[0].style.width).toBe('220px');
    expect(cols[1].style.width).toBe('150px');
    expect(cols[2].style.width).toBe('110px');
    expect(cols[3].style.width).toBe('180px');
    expect(cols[4].style.width).toBe('70px');
  });

  it('updates column width on drag', async () => {
    render(<EventsTable events={mockEvents} />);
    const handle = document.querySelectorAll('.cursor-col-resize')[0] as Element;

    fireEvent.mouseDown(handle, { clientX: 100 });
    fireEvent.mouseMove(document, { clientX: 150 });
    fireEvent.mouseUp(document);

    const cols = document.querySelectorAll('colgroup col');
    await waitFor(() => {
      expect(cols[0].style.width).toBe('270px');
    });
  });
});
