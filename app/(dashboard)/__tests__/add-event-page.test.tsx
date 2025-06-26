import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddEventPage from '../add/page';
import { auth } from '@/lib/auth';
import { getEvents } from '@/lib/db';
import { redirect } from 'next/navigation';

// Mock the addEvent action
jest.mock('../actions', () => ({
  addEvent: jest.fn()
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn()
}));

jest.mock('@/lib/db', () => ({
  getEvents: jest.fn()
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('Add Event Page', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockGetEvents = getEvents as jest.MockedFunction<typeof getEvents>;
  const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } } as any);
    mockGetEvents.mockResolvedValue([
      {
        id: 1,
        userId: 'test@example.com',
        name: 'Existing Event',
        date: '2024-01-01T00:00:00.000Z',
        resetCount: 0,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        reminderDays: null,
        reminderSent: false
      }
    ] as any);
    mockRedirect.mockClear();
  });

  describe('Authentication and Data Fetching', () => {
    it('redirects to login when user is not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null as any);
      mockRedirect.mockImplementationOnce(() => {
        throw new Error('redirect');
      });

      await expect(AddEventPage()).rejects.toThrow('redirect');

      expect(mockRedirect).toHaveBeenCalledWith('/login');
      expect(mockGetEvents).not.toHaveBeenCalled();
    });

    it('fetches events and displays unique suggestions', async () => {
      mockGetEvents.mockResolvedValueOnce([
        {
          id: 1,
          userId: 'test@example.com',
          name: 'Event A',
          date: '2024-01-01T00:00:00.000Z',
          resetCount: 0,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          reminderDays: null,
          reminderSent: false
        },
        {
          id: 2,
          userId: 'test@example.com',
          name: 'Event B',
          date: '2024-02-01T00:00:00.000Z',
          resetCount: 0,
          createdAt: new Date('2024-02-01T00:00:00.000Z'),
          reminderDays: null,
          reminderSent: false
        },
        {
          id: 3,
          userId: 'test@example.com',
          name: 'Event A',
          date: '2024-03-01T00:00:00.000Z',
          resetCount: 0,
          createdAt: new Date('2024-03-01T00:00:00.000Z'),
          reminderDays: null,
          reminderSent: false
        }
      ] as any);

      const result = await AddEventPage();
      render(result as React.ReactElement);

      expect(mockGetEvents).toHaveBeenCalledWith('test@example.com');

      const dataList = screen.getByTestId('event-suggestions');
      const values = Array.from(dataList.querySelectorAll('option')).map((opt) =>
        opt.getAttribute('value')
      );
      expect(values.sort()).toEqual(['Event A', 'Event B']);
    });
  });

  describe('Default Date Functionality', () => {
    it("sets today's date as default value in local timezone", async () => {
      // Mock the current date
      const mockDate = new Date('2025-06-03T15:30:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      render(await AddEventPage());

      const dateInput = screen.getByLabelText(
        'When did it happen?'
      ) as HTMLInputElement;
      expect(dateInput.value).toBe('2025-06-03');

      jest.useRealTimers();
    });

    it('formats date correctly with leading zeros for single digit months and days', async () => {
      // Test with single-digit month and day
      const mockDate = new Date('2025-03-05T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      render(await AddEventPage());

      const dateInput = screen.getByLabelText(
        'When did it happen?'
      ) as HTMLInputElement;
      expect(dateInput.value).toBe('2025-03-05');

      jest.useRealTimers();
    });

    it('handles timezone correctly (does not use UTC)', async () => {
      // Create a date that would be different in UTC vs local time
      // Assuming local timezone is behind UTC (like PST/PDT)
      const mockDate = new Date('2025-06-03T23:00:00'); // 11 PM local time
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      render(await AddEventPage());

      const dateInput = screen.getByLabelText(
        'When did it happen?'
      ) as HTMLInputElement;

      // Should be June 3rd in local timezone, not June 4th (which would be UTC)
      expect(dateInput.value).toBe('2025-06-03');

      jest.useRealTimers();
    });
  });

  describe('Form Rendering', () => {
    it('renders all required form elements', async () => {
      render(await AddEventPage());

      // Check for form elements
      expect(screen.getByText('Add New Event')).toBeInTheDocument();
      expect(screen.getByLabelText('Event Name')).toBeInTheDocument();
      expect(screen.getByLabelText('When did it happen?')).toBeInTheDocument();
      expect(screen.getByLabelText('Set a reminder')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Remind me after (days)')
      ).toBeInTheDocument();

      // Check for buttons
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Add Event')).toBeInTheDocument();
    });

    it('has correct input types and attributes', async () => {
      render(await AddEventPage());

      const nameInput = screen.getByLabelText('Event Name');
      const dateInput = screen.getByLabelText('When did it happen?');
      const reminderDaysInput = screen.getByLabelText('Remind me after (days)');

      // Text inputs don't explicitly have type="text" in HTML
      expect(nameInput).toHaveAttribute('required');
      expect(nameInput).toHaveAttribute('placeholder', 'What happened?');
      expect(nameInput).toHaveAttribute('list', 'eventSuggestions');

      expect(dateInput).toHaveAttribute('type', 'date');
      expect(dateInput).toHaveAttribute('required');

      expect(reminderDaysInput).toHaveAttribute('type', 'number');
      expect(reminderDaysInput).toHaveAttribute('min', '1');
      expect(reminderDaysInput).toHaveAttribute('placeholder', 'e.g. 30');
    });

    it('renders autocomplete options', async () => {
      render(await AddEventPage());

      const dataList = screen.getByTestId('event-suggestions');
      expect(dataList).toBeInTheDocument();
      expect(dataList.querySelectorAll('option').length).toBeGreaterThan(0);
    });

    it('has correct form action', async () => {
      render(await AddEventPage());

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('allows user to input event name', async () => {
      const user = userEvent.setup();
      render(await AddEventPage());

      const nameInput = screen.getByLabelText('Event Name');
      await user.type(nameInput, 'Test Event');

      expect(nameInput).toHaveValue('Test Event');
    });

    it('allows user to change the date', async () => {
      const user = userEvent.setup();
      render(await AddEventPage());

      const dateInput = screen.getByLabelText('When did it happen?');
      await user.clear(dateInput);
      await user.type(dateInput, '2025-05-15');

      expect(dateInput).toHaveValue('2025-05-15');
    });

    it('allows user to toggle reminder switch', async () => {
      const user = userEvent.setup();
      render(await AddEventPage());

      const reminderSwitch = screen.getByRole('switch');
      expect(reminderSwitch).not.toBeChecked();

      await user.click(reminderSwitch);
      expect(reminderSwitch).toBeChecked();
    });

    it('allows user to input reminder days', async () => {
      const user = userEvent.setup();
      render(await AddEventPage());

      const reminderDaysInput = screen.getByLabelText('Remind me after (days)');
      await user.type(reminderDaysInput, '30');

      expect(reminderDaysInput).toHaveValue(30);
    });
  });

  describe('Navigation', () => {
    it('has cancel button that links to home page', async () => {
      render(await AddEventPage());

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('Form Validation', () => {
    it('marks required fields as required', async () => {
      render(await AddEventPage());

      const nameInput = screen.getByLabelText('Event Name');
      const dateInput = screen.getByLabelText('When did it happen?');

      expect(nameInput).toBeRequired();
      expect(dateInput).toBeRequired();
    });

    it('has proper form structure for server action', async () => {
      render(await AddEventPage());

      const form = document.querySelector('form');
      const submitButton = screen.getByText('Add Event');

      expect(form).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all form controls', async () => {
      render(await AddEventPage());

      // All inputs should have associated labels
      expect(screen.getByLabelText('Event Name')).toBeInTheDocument();
      expect(screen.getByLabelText('When did it happen?')).toBeInTheDocument();
      expect(screen.getByLabelText('Set a reminder')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Remind me after (days)')
      ).toBeInTheDocument();
    });

    it('has proper semantic structure', async () => {
      render(await AddEventPage());

      // Should have a proper heading
      expect(
        screen.getByRole('heading', { name: 'Add New Event' })
      ).toBeInTheDocument();

      // Should have form elements
      expect(document.querySelector('form')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Add Event' })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Cancel' })).toBeInTheDocument();
    });
  });
});
