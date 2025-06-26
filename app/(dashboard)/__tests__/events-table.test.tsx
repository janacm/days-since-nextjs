import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
jest.mock('../actions', () => ({
  deleteEvent: jest.fn(),
  resetEvent: jest.fn(),
  resetEventWithDate: jest.fn()
}));
import { EventsTable } from '../events-table';
import { Event } from '@/lib/db';

const baseEvent: Event = {
  id: 1,
  userId: 'user',
  name: 'First',
  date: '2024-01-01T00:00:00.000Z',
  resetCount: 0,
  createdAt: new Date('2024-01-01'),
  reminderDays: null,
  reminderSent: false,
  tags: []
};

describe('EventsTable tag filtering', () => {
  const events: Event[] = [
    { ...baseEvent, id: 1, name: 'Work Event', tags: ['work', 'urgent'] },
    { ...baseEvent, id: 2, name: 'Home Event', tags: ['home'] }
  ];

  it('shows all unique tags in dropdown', () => {
    render(<EventsTable events={events} />);
    const select = screen.getByRole('combobox');
    expect(screen.getByRole('option', { name: 'All Tags' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'work' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'urgent' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'home' })).toBeInTheDocument();
  });

  it('filters events based on selected tag', () => {
    render(<EventsTable events={events} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'home' } });
    expect(screen.getByText('Home Event')).toBeInTheDocument();
    expect(screen.queryByText('Work Event')).not.toBeInTheDocument();
  });
});
