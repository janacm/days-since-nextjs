import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventsTable } from '../events-table';
import { Event } from '@/lib/db';

// Mock EventItem to avoid importing server actions
jest.mock('../event', () => ({
  EventItem: () => <tr data-testid="event-item" />
}));

const mockEvent: Event = {
  id: 1,
  userId: 'user1',
  name: 'Test Event',
  date: '2024-01-01T00:00:00.000Z',
  resetCount: 0,
  createdAt: new Date('2024-01-01'),
  reminderDays: null,
  reminderSent: false
};

describe('EventsTable search behavior', () => {
  it('scrolls search into view on focus', () => {
    render(<EventsTable events={[mockEvent]} />);

    const input = screen.getByPlaceholderText('Search events...');
    const spy = jest.fn();
    // jsdom doesn't implement scrollIntoView
    Object.defineProperty(input, 'scrollIntoView', { value: spy, writable: true });

    fireEvent.focus(input);

    expect(spy).toHaveBeenCalled();
  });
});
