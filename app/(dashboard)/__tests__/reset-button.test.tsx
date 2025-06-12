import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResetButton } from '../reset-button';
import { resetEvent, resetEventWithDate } from '../actions';
import { ToastProvider } from '@/components/ui/toast';

// Mock the actions
jest.mock('../actions', () => ({
  resetEvent: jest.fn(),
  resetEventWithDate: jest.fn(),
  undoResetEvent: jest.fn()
}));

// Mock the long press hook
jest.mock('../../../lib/hooks/use-long-press', () => ({
  useLongPress: jest.fn(({ onLongPress, onClick, onProgress }) => ({
    onMouseDown: jest.fn(),
    onMouseUp: jest.fn(),
    onMouseLeave: jest.fn(),
    onTouchStart: jest.fn(),
    onTouchEnd: jest.fn(),
    onClick: onClick || jest.fn(),
    isPressed: false,
    'data-testid': 'long-press-button'
  }))
}));

const mockResetEvent = resetEvent as jest.MockedFunction<typeof resetEvent>;
const mockResetEventWithDate = resetEventWithDate as jest.MockedFunction<
  typeof resetEventWithDate
>;

describe('ResetButton', () => {
  const eventId = 123;
  const currentDate = '2024-01-01T00:00:00.000Z';

  const renderWithProvider = (ui: React.ReactElement) =>
    render(<ToastProvider>{ui}</ToastProvider>);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders reset button with correct icon', () => {
    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');

    // Check for the RotateCcw icon (it should be in the DOM)
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');

    const srText = screen.getByText('Reset event (long press for custom date)');
    expect(srText).toHaveClass('sr-only');
  });

  it('applies correct CSS classes for iOS Safari prevention', () => {
    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    const button = screen.getByRole('button');

    // Check that the CSS classes for iOS Safari prevention are applied
    expect(button).toHaveClass('select-none', 'touch-manipulation', 'relative');
  });

  it('calls quick reset on regular click', async () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    // Mock the hook to simulate a quick click
    useLongPress.mockImplementation(({ onClick }) => ({
      onMouseDown: jest.fn(),
      onMouseUp: jest.fn(),
      onMouseLeave: jest.fn(),
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
      onClick: onClick,
      isPressed: false
    }));

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(mockResetEvent).toHaveBeenCalledWith(expect.any(FormData));

    // Check that the FormData contains the correct event ID
    const formDataCall = mockResetEvent.mock.calls[0][0] as FormData;
    expect(formDataCall.get('id')).toBe(eventId.toString());
  });

  it('shows undo toast after quick reset', async () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');
    useLongPress.mockImplementation(({ onClick }) => ({
      onMouseDown: jest.fn(),
      onMouseUp: jest.fn(),
      onMouseLeave: jest.fn(),
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
      onClick,
      isPressed: false
    }));

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    expect(await screen.findByText('Undo')).toBeInTheDocument();
  });

  it('opens modal on long press', async () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    let longPressCallback: () => void;

    // Mock the hook to capture the long press callback
    useLongPress.mockImplementation(({ onLongPress }) => {
      longPressCallback = onLongPress;
      return {
        onMouseDown: jest.fn(),
        onMouseUp: jest.fn(),
        onMouseLeave: jest.fn(),
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
        onClick: jest.fn(),
        isPressed: false
      };
    });

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    // Simulate long press
    longPressCallback!();

    // Check that modal is open
    await waitFor(() => {
      expect(screen.getByText('Reset Event')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Choose the date when this event was last reset/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Reset Date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reset to Date' })
    ).toBeInTheDocument();
  });

  it('sets default date to today when modal opens', async () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    let longPressCallback: () => void;

    useLongPress.mockImplementation(({ onLongPress }) => {
      longPressCallback = onLongPress;
      return {
        onMouseDown: jest.fn(),
        onMouseUp: jest.fn(),
        onMouseLeave: jest.fn(),
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
        onClick: jest.fn(),
        isPressed: false
      };
    });

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    // Simulate long press
    longPressCallback!();

    await waitFor(() => {
      const dateInput = screen.getByLabelText('Reset Date') as HTMLInputElement;
      const today = new Date().toISOString().split('T')[0];
      expect(dateInput.value).toBe(today);
    });
  });

  it('closes modal when cancel is clicked', async () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    let longPressCallback: () => void;

    useLongPress.mockImplementation(({ onLongPress }) => {
      longPressCallback = onLongPress;
      return {
        onMouseDown: jest.fn(),
        onMouseUp: jest.fn(),
        onMouseLeave: jest.fn(),
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
        onClick: jest.fn(),
        isPressed: false
      };
    });

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    // Open modal
    longPressCallback!();

    await waitFor(() => {
      expect(screen.getByText('Reset Event')).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Reset Event')).not.toBeInTheDocument();
    });
  });

  it('calls resetEventWithDate when custom date is submitted', async () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    let longPressCallback: () => void;

    useLongPress.mockImplementation(({ onLongPress }) => {
      longPressCallback = onLongPress;
      return {
        onMouseDown: jest.fn(),
        onMouseUp: jest.fn(),
        onMouseLeave: jest.fn(),
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
        onClick: jest.fn(),
        isPressed: false
      };
    });

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    // Open modal
    longPressCallback!();

    await waitFor(() => {
      expect(screen.getByText('Reset Event')).toBeInTheDocument();
    });

    // Change the date
    const dateInput = screen.getByLabelText('Reset Date');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, '2023-12-25');

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Reset to Date' });
    await userEvent.click(submitButton);

    expect(mockResetEventWithDate).toHaveBeenCalledWith(expect.any(FormData));

    // Check that the FormData contains the correct data
    const formDataCall = mockResetEventWithDate.mock.calls[0][0] as FormData;
    expect(formDataCall.get('id')).toBe(eventId.toString());
    expect(formDataCall.get('resetDate')).toBe('2023-12-25');

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Reset Event')).not.toBeInTheDocument();
    });
  });

  it('disables submit button when no date is selected', async () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    let longPressCallback: () => void;

    useLongPress.mockImplementation(({ onLongPress }) => {
      longPressCallback = onLongPress;
      return {
        onMouseDown: jest.fn(),
        onMouseUp: jest.fn(),
        onMouseLeave: jest.fn(),
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
        onClick: jest.fn(),
        isPressed: false
      };
    });

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    // Open modal
    longPressCallback!();

    await waitFor(() => {
      expect(screen.getByText('Reset Event')).toBeInTheDocument();
    });

    // Clear the date input
    const dateInput = screen.getByLabelText('Reset Date');
    await userEvent.clear(dateInput);

    // Submit button should be disabled
    const submitButton = screen.getByRole('button', { name: 'Reset to Date' });
    expect(submitButton).toBeDisabled();
  });

  it('does not submit when date is empty', async () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    let longPressCallback: () => void;

    useLongPress.mockImplementation(({ onLongPress }) => {
      longPressCallback = onLongPress;
      return {
        onMouseDown: jest.fn(),
        onMouseUp: jest.fn(),
        onMouseLeave: jest.fn(),
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
        onClick: jest.fn(),
        isPressed: false
      };
    });

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    // Open modal
    longPressCallback!();

    await waitFor(() => {
      expect(screen.getByText('Reset Event')).toBeInTheDocument();
    });

    // Clear the date input
    const dateInput = screen.getByLabelText('Reset Date');
    await userEvent.clear(dateInput);

    // Try to submit (button should be disabled, so this shouldn't actually trigger)
    const submitButton = screen.getByRole('button', { name: 'Reset to Date' });

    // The button should be disabled, so this shouldn't actually trigger
    expect(submitButton).toBeDisabled();
    expect(mockResetEventWithDate).not.toHaveBeenCalled();
  });

  it('updates date input value when changed', async () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    let longPressCallback: () => void;

    useLongPress.mockImplementation(({ onLongPress }) => {
      longPressCallback = onLongPress;
      return {
        onMouseDown: jest.fn(),
        onMouseUp: jest.fn(),
        onMouseLeave: jest.fn(),
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
        onClick: jest.fn(),
        isPressed: false
      };
    });

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    // Open modal
    longPressCallback!();

    await waitFor(() => {
      expect(screen.getByText('Reset Event')).toBeInTheDocument();
    });

    // Change the date
    const dateInput = screen.getByLabelText('Reset Date') as HTMLInputElement;
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, '2023-06-15');

    expect(dateInput.value).toBe('2023-06-15');
  });

  it('shows progress circle when isPressed is true', () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    // Mock the hook to return isPressed: true
    useLongPress.mockImplementation(({ onLongPress, onClick }) => ({
      onMouseDown: jest.fn(),
      onMouseUp: jest.fn(),
      onMouseLeave: jest.fn(),
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
      onClick: onClick || jest.fn(),
      isPressed: true
    }));

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    // Should show the progress SVG when pressed
    const button = screen.getByRole('button');
    const progressSvg = button.querySelector('svg:nth-child(2)'); // Second SVG (first is the icon)
    expect(progressSvg).toBeInTheDocument();
    expect(progressSvg).toHaveAttribute('viewBox', '0 0 40 40');
  });

  it('hides progress circle when isPressed is false', () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    // Mock the hook to return isPressed: false
    useLongPress.mockImplementation(({ onLongPress, onClick }) => ({
      onMouseDown: jest.fn(),
      onMouseUp: jest.fn(),
      onMouseLeave: jest.fn(),
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
      onClick: onClick || jest.fn(),
      isPressed: false
    }));

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    // Should not show the progress SVG when not pressed
    const button = screen.getByRole('button');
    const progressSvg = button.querySelector('svg:nth-child(2)'); // Second SVG would be the progress
    expect(progressSvg).not.toBeInTheDocument();
  });

  it('passes onProgress callback to useLongPress hook', () => {
    const { useLongPress } = require('../../../lib/hooks/use-long-press');

    renderWithProvider(<ResetButton eventId={eventId} currentDate={currentDate} />);

    // Check that useLongPress was called with onProgress callback
    expect(useLongPress).toHaveBeenCalledWith(
      expect.objectContaining({
        onProgress: expect.any(Function),
        threshold: 1000
      })
    );
  });
});
