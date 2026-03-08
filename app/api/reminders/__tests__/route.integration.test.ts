/* @jest-environment node */
import { createMocks } from 'node-mocks-http';

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

jest.mock('@/lib/db', () => {
  const mockEvents = [
    {
      id: 1,
      name: 'Security Test Event',
      date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      reminderDays: 7,
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

import { POST } from '../route';
import nodemailer from 'nodemailer';

describe('Reminders API auth integration test', () => {
  const originalEnv = process.env;
  let mockSendMail: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockTransporter = (nodemailer.createTransport as jest.Mock)();
    mockSendMail = mockTransporter.sendMail;

    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-secret',
      SMTP_HOST: 'sandbox.smtp.mailtrap.io',
      SMTP_PORT: '2525',
      SMTP_USER: 'test-user',
      SMTP_PASS: 'test-pass',
      SMTP_FROM: 'test@example.com'
    };

    mockSendMail.mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
      rejected: []
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects unauthorized requests', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-secret'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('fails closed when CRON_SECRET is missing', async () => {
    delete process.env.CRON_SECRET;

    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer undefined'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('CRON_SECRET is not configured');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sends reminders when request is authorized', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer test-secret'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });
});
