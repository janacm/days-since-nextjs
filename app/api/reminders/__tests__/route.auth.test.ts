/* @jest-environment node */

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

jest.mock('@/lib/db', () => ({
  db: {},
  events: {}
}));

import { POST } from '../route';
import nodemailer from 'nodemailer';

describe('POST /api/reminders authorization', () => {
  const originalEnv = process.env;
  let mockSendMail: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockTransporter = (nodemailer.createTransport as jest.Mock)();
    mockSendMail = mockTransporter.sendMail;
    process.env = {
      ...originalEnv
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 401 when authorization header is invalid', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const request = new Request('http://localhost/api/reminders', {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-secret'
      }
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('returns 500 when CRON_SECRET is missing', async () => {
    delete process.env.CRON_SECRET;

    const request = new Request('http://localhost/api/reminders', {
      method: 'POST'
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('CRON_SECRET is not configured');
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
