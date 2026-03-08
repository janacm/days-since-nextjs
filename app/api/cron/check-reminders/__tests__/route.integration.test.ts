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
      userId: 'test@example.com'
    },
    {
      id: 2,
      name: 'Another Event',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      reminderDays: 3,
      reminderSent: false,
      lastReminderSentAt: null,
      userId: 'test@example.com'
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
import { GET } from '../route';
import nodemailer from 'nodemailer';

describe('Email Reminder Integration Test', () => {
  const originalEnv = process.env;
  let mockSendMail: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mock function from the mocked nodemailer
    const mockTransporter = (nodemailer.createTransport as jest.Mock)();
    mockSendMail = mockTransporter.sendMail;
    
    // Set up test environment variables for Mailtrap
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-secret',
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
  });

  it('should send reminder email when event reminder date is reached', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-secret'
      }
    });

    const response = await GET(req);
    const data = await response.json();

    // Verify successful response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Sent 1 reminder emails');
    expect(data.checkedEvents).toBe(2);
    expect(data.notifiedUsers).toBe(1);

    // Verify email was sent with correct content
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'test@example.com',
        to: 'test@example.com',
        subject: 'Days Since reminders: 2 events due'
      })
    );

    // Verify HTML content contains expected elements
    const emailCall = mockSendMail.mock.calls[0][0];
    expect(emailCall.html).toContain('<strong>Test Event</strong>');
    expect(emailCall.html).toContain('<strong>Another Event</strong>');
    expect(emailCall.html).toContain('Reminder requested after 7 days');
    expect(emailCall.html).toContain('Reminder requested after 3 days');
  });

  it('should handle SMTP errors gracefully', async () => {
    // Mock email sending failure
    mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-secret'
      }
    });

    const response = await GET(req);
    const data = await response.json();

    // Should still return success but with 0 sent reminders
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Sent 0 reminder emails');
    expect(data.checkedEvents).toBe(2);
  });

  it('should reject unauthorized requests', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer wrong-secret'
      }
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should fail closed when CRON_SECRET is missing', async () => {
    delete process.env.CRON_SECRET;

    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer undefined'
      }
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('CRON_SECRET is not configured');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should validate email format matches expected structure', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-secret'
      }
    });

    await GET(req);

    const emailCall = mockSendMail.mock.calls[0][0];
    
    // Validate email structure
    expect(emailCall.from).toBe('test@example.com');
    expect(emailCall.to).toBe('test@example.com');
    expect(emailCall.subject).toBe('Days Since reminders: 2 events due');

    // Validate HTML structure
    expect(emailCall.html).toContain('<h2>Days Since Reminder</h2>');
    expect(emailCall.html).toContain('<ul>');
    expect(emailCall.html).toContain('<strong>Test Event</strong>');
    expect(emailCall.html).toContain('<strong>Another Event</strong>');
    expect(emailCall.html).toContain('Visit your dashboard to update');
  });

  it('groups reminders by user and only sends one email per user', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-secret'
      }
    });

    await GET(req);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const emailCall = mockSendMail.mock.calls[0][0];
    expect(emailCall.to).toBe('test@example.com');
    expect(emailCall.subject).toBe('Days Since reminders: 2 events due');
  });
});