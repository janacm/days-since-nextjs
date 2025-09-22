/* @jest-environment node */
import { createMocks } from 'node-mocks-http';

// Mock nodemailer with a proper setup
jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn();
  const mockCreateTransport = jest.fn(() => ({
    sendMail: mockSendMail
  }));

  return {
    default: mockCreateTransport,
    createTransport: mockCreateTransport
  };
});

// Mock database
jest.mock('@/lib/db', () => {
  const mockEvents = [
    {
      id: 1,
      name: 'Test Event',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      reminderDays: 7,
      reminderSent: false,
      lastReminderSentAt: null,
      userId: 'test@example.com',
      createdAt: new Date(),
      resetCount: 0,
      isPrivate: false,
      resettable: true
    },
    {
      id: 2,
      name: 'Another Event',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      reminderDays: 3,
      reminderSent: false,
      lastReminderSentAt: null,
      userId: 'another@example.com',
      createdAt: new Date(),
      resetCount: 0,
      isPrivate: false,
      resettable: true
    }
  ];

  return {
    db: {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve(mockEvents))
        }))
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve())
        }))
      }))
    },
    events: {}
  };
});

// Import after mocks
import { POST } from '../route';
import nodemailer from 'nodemailer';

describe('/api/reminders POST endpoint', () => {
  const originalEnv = process.env;
  let mockSendMail: jest.MockedFunction<any>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Get the mock function from the mocked nodemailer
    const mockTransporter = (nodemailer.createTransport as jest.Mock)();
    mockSendMail = mockTransporter.sendMail;

    // Set up test environment variables
    process.env = {
      ...originalEnv,
      SMTP_HOST: 'sandbox.smtp.mailtrap.io',
      SMTP_PORT: '2525',
      SMTP_USER: 'test-user',
      SMTP_PASS: 'test-pass',
      SMTP_FROM: 'test@example.com'
    };

    // Mock successful email sending
    mockSendMail.mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
      rejected: []
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should send reminder emails for all eligible events', async () => {
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processedCount).toBe(2);

    // Should send one email per user (2 users in mock data)
    expect(mockSendMail).toHaveBeenCalledTimes(2);

    // Verify console logging
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '📧 Reminders API: Request received'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '📧 Reminders API: Querying for events needing reminders'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '📧 Reminders API: Found events needing reminders',
      {
        count: 2,
        eventIds: [1, 2]
      }
    );
  });

  it('should group events by user and send one email per user', async () => {
    await POST();

    expect(mockSendMail).toHaveBeenCalledTimes(2);

    const firstCall = mockSendMail.mock.calls[0][0];
    const secondCall = mockSendMail.mock.calls[1][0];

    expect(firstCall.to).toBe('test@example.com');
    expect(secondCall.to).toBe('another@example.com');

    // First user should have 1 event in their email
    expect(firstCall.subject).toBe('Days Since reminders: 1 event due');
    expect(firstCall.html).toContain('<strong>Test Event</strong>');

    // Second user should have 1 event in their email
    expect(secondCall.subject).toBe('Days Since reminders: 1 event due');
    expect(secondCall.html).toContain('<strong>Another Event</strong>');
  });

  it('should handle missing SMTP configuration', async () => {
    // Remove SMTP configuration
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Email service is not configured');
    expect(mockSendMail).not.toHaveBeenCalled();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '📧 Reminders API: SMTP config is not configured'
    );
  });

  it('should handle email sending errors gracefully', async () => {
    // Mock email sending failure
    mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

    const response = await POST();
    const data = await response.json();

    // Individual email failures should still return success (graceful handling)
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processedCount).toBe(2);

    // Should still attempt to send emails
    expect(mockSendMail).toHaveBeenCalled();

    // Should log the error for each user
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '📧 Reminders API: Error processing reminders for user',
      expect.objectContaining({
        userId: 'test@example.com',
        error: 'SMTP connection failed'
      })
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '📧 Reminders API: Error processing reminders for user',
      expect.objectContaining({
        userId: 'another@example.com',
        error: 'SMTP connection failed'
      })
    );
  });

  it('should validate email content format', async () => {
    await POST();

    const emailCall = mockSendMail.mock.calls[0][0];

    // Validate email structure
    expect(emailCall.from).toBe('test@example.com');
    expect(emailCall.to).toBe('test@example.com');
    expect(emailCall.subject).toBe('Days Since reminders: 1 event due');

    // Validate HTML structure
    expect(emailCall.html).toContain('<h2>Days Since Reminder</h2>');
    expect(emailCall.html).toContain('<ul>');
    expect(emailCall.html).toContain('<strong>Test Event</strong>');
    expect(emailCall.html).toContain('Visit your dashboard to update');
    expect(emailCall.html).toContain('8 days since'); // Based on mock data
    expect(emailCall.html).toContain('Reminder requested after 7 days');
  });

  it('should log successful email sending with correct data', async () => {
    await POST();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '📧 Reminders API: Email sent successfully',
      {
        info: {
          messageId: 'test-message-id',
          accepted: ['test@example.com'],
          rejected: []
        },
        userId: 'test@example.com'
      }
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '📧 Reminders API: Reminder marked as sent',
      {
        userId: 'test@example.com',
        eventIds: [1]
      }
    );
  });

  it('should configure Mailtrap transporter with correct settings', async () => {
    await POST();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '📧 Reminders API: Mailtrap transporter configured',
      {
        host: 'sandbox.smtp.mailtrap.io',
        port: '2525'
      }
    );
  });

  it('should handle partial email sending failures', async () => {
    // Mock one success and one failure
    mockSendMail
      .mockResolvedValueOnce({
        messageId: 'success-message-id',
        accepted: ['test@example.com'],
        rejected: []
      })
      .mockRejectedValueOnce(new Error('Second email failed'));

    const response = await POST();
    const data = await response.json();

    // Should still return success even with partial failures (graceful handling)
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.processedCount).toBe(2);

    // Should have attempted both emails
    expect(mockSendMail).toHaveBeenCalledTimes(2);

    // Should log success for first user
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '📧 Reminders API: Email sent successfully',
      expect.objectContaining({
        userId: 'test@example.com'
      })
    );

    // Should log error for second user
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '📧 Reminders API: Error processing reminders for user',
      expect.objectContaining({
        userId: 'another@example.com',
        error: 'Second email failed'
      })
    );
  });

  it('should pass Date objects (not strings) to database for lastReminderSentAt field', async () => {
    const { db } = await import('@/lib/db');

    await POST();

    // Verify that the database update was called with a Date object
    expect(db.update).toHaveBeenCalled();
    const updateCall = (db.update as jest.Mock).mock.results[0].value;
    expect(updateCall.set).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderSent: true,
        lastReminderSentAt: expect.any(Date)
      })
    );

    // Ensure it's NOT a string (which was the original bug)
    const setCall = updateCall.set.mock.calls[0][0];
    expect(typeof setCall.lastReminderSentAt).toBe('object');
    expect(setCall.lastReminderSentAt).toBeInstanceOf(Date);
    expect(typeof setCall.lastReminderSentAt).not.toBe('string');
  });
});
