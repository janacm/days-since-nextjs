/* @jest-environment node */
import { createMocks } from 'node-mocks-http';

// Mock SendGrid mail client
jest.mock('@sendgrid/mail', () => {
  const send = jest.fn().mockResolvedValue([{ statusCode: 202 }]);
  const setApiKey = jest.fn();
  return {
    __esModule: true,
    default: { setApiKey, send }
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
import sgMail from '@sendgrid/mail';

describe('Email Reminder Integration Test', () => {
  const originalEnv = process.env;
  let mockSend: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Access mocked sendgrid client
    mockSend = (sgMail as any).send;

    // Set up test environment variables for SendGrid
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-secret',
      SENDGRID_API_KEY: 'test-key',
      SENDGRID_FROM_EMAIL: 'test@example.com',
      SENDGRID_SANDBOX_MODE: 'true'
    };

    // Mock successful email sending
    mockSend.mockResolvedValue([{ statusCode: 202 }]);
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
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'test@example.com',
        to: 'test@example.com',
        subject: 'Days Since reminders: 2 events due'
      })
    );

    // Validate HTML content contains expected elements
    const emailCall = mockSend.mock.calls[0][0];
    expect(emailCall.html).toContain('<strong>Test Event</strong>');
    expect(emailCall.html).toContain('<strong>Another Event</strong>');
    expect(emailCall.html).toContain('Reminder requested after 7 days');
    expect(emailCall.html).toContain('Reminder requested after 3 days');
  });

  it('should handle SMTP errors gracefully', async () => {
    // Mock email sending failure
    mockSend.mockRejectedValue(new Error('SMTP connection failed'));

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
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should validate email format matches expected structure', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-secret'
      }
    });

    await GET(req);

    const emailCall = mockSend.mock.calls[0][0];
    
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

    expect(mockSend).toHaveBeenCalledTimes(1);
    const emailCall = mockSend.mock.calls[0][0];
    expect(emailCall.to).toBe('test@example.com');
    expect(emailCall.subject).toBe('Days Since reminders: 2 events due');
  });
});