/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestNotification from '../TestNotification';

jest.mock('@/lib/notifications', () => ({
  sendNotification: jest.fn()
}));

const { sendNotification } = require('@/lib/notifications');

describe('TestNotification', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Default userAgent and matchMedia
    Object.defineProperty(navigator, 'userAgent', {
      value: 'iPhone OS 17_0',
      configurable: true
    });
    window.matchMedia = jest.fn().mockImplementation(() => ({ matches: true }));
  });

  it('renders the test notification button', () => {
    render(<TestNotification />);
    expect(
      screen.getByRole('button', { name: /send test notification/i })
    ).toBeInTheDocument();
  });

  it('logs error if not installed as PWA on iOS', async () => {
    // Simulate not installed
    window.matchMedia = jest
      .fn()
      .mockImplementation(() => ({ matches: false }));
    render(<TestNotification />);
    const button = screen.getByRole('button', {
      name: /send test notification/i
    });
    await userEvent.click(button);
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '🔔 TestNotification: App not installed as PWA on iOS. Please add to home screen for the best experience.'
      );
    });
  });

  it('disables button and shows message for legacy iOS', () => {
    // Simulate legacy iOS
    Object.defineProperty(navigator, 'userAgent', {
      value: 'iPhone OS 15_0',
      configurable: true
    });
    render(<TestNotification />);
    const button = screen.getByRole('button', {
      name: /send test notification/i
    });
    expect(button).toBeDisabled();
    expect(
      screen.getByText('Push notifications require iOS 16.4 or later')
    ).toBeInTheDocument();
  });

  it('logs error if notification fails', async () => {
    sendNotification.mockResolvedValue(false);
    render(<TestNotification />);
    const button = screen.getByRole('button', {
      name: /send test notification/i
    });
    await userEvent.click(button);
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '🔔 TestNotification: sendNotification reported FAILURE. Check device/browser notification settings.'
      );
    });
  });

  it('logs error if sendNotification throws', async () => {
    const testError = new Error('fail');
    sendNotification.mockRejectedValue(testError);
    render(<TestNotification />);
    const button = screen.getByRole('button', {
      name: /send test notification/i
    });
    await userEvent.click(button);
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        '🔔 TestNotification: EXCEPTION during sendNotification:',
        testError
      );
    });
  });
});
