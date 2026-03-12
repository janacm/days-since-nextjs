/* @jest-environment node */

jest.mock('nodemailer', () => {
  const mockSendMail = jest.fn();
  const mockCreateTransport = jest.fn(() => ({
    sendMail: mockSendMail
  }));

  return {
    __esModule: true,
    default: {
      createTransport: mockCreateTransport
    },
    createTransport: mockCreateTransport
  };
});

jest.mock('drizzle-orm', () => {
  const mockAnd = jest.fn(() => ({ kind: 'and' }));
  const mockOr = jest.fn(() => ({ kind: 'or' }));
  const mockSql = jest.fn(() => ({ kind: 'sql' }));
  const mockInArray = jest.fn((column, values) => ({ column, values }));

  return {
    and: mockAnd,
    or: mockOr,
    sql: mockSql,
    inArray: mockInArray,
    __mocks: {
      mockInArray
    }
  };
});

jest.mock('@/lib/db', () => {
  const mockSelectWhere = jest.fn();
  const mockSelectFrom = jest.fn(() => ({
    where: mockSelectWhere
  }));
  const mockSelect = jest.fn(() => ({
    from: mockSelectFrom
  }));

  const mockUpdateWhere = jest.fn();
  const mockUpdateSet = jest.fn(() => ({
    where: mockUpdateWhere
  }));
  const mockUpdate = jest.fn(() => ({
    set: mockUpdateSet
  }));

  return {
    db: {
      select: mockSelect,
      update: mockUpdate
    },
    events: {
      id: 'id',
      reminderDays: 'reminderDays',
      date: 'date',
      lastReminderSentAt: 'lastReminderSentAt'
    },
    __mocks: {
      mockSelectWhere,
      mockUpdateSet,
      mockUpdateWhere
    }
  };
});

import nodemailer from 'nodemailer';
import { POST } from '../route';

describe('POST /api/reminders', () => {
  const dbMockModule = jest.requireMock('@/lib/db');
  const drizzleMockModule = jest.requireMock('drizzle-orm');
  const originalEnv = process.env;
  const fixedNow = new Date('2026-01-15T10:00:00.000Z');
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers().setSystemTime(fixedNow);

    process.env = {
      ...originalEnv,
      SMTP_HOST: 'smtp.test.local',
      SMTP_PORT: '2525',
      SMTP_USER: 'mailer@test.local',
      SMTP_PASS: 'password',
      SMTP_FROM: 'noreply@test.local'
    };

    const mockTransporter = (nodemailer.createTransport as jest.Mock)();
    mockSendMail = mockTransporter.sendMail;
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
    dbMockModule.__mocks.mockUpdateWhere.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  it('returns 500 when SMTP configuration is missing', async () => {
    delete process.env.SMTP_HOST;

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Email service is not configured' });
    expect(dbMockModule.__mocks.mockSelectWhere).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('groups reminders per user and persists Date values for sent reminders', async () => {
    dbMockModule.__mocks.mockSelectWhere.mockResolvedValue([
      {
        id: 1,
        userId: 'alice@example.com',
        name: 'Anniversary',
        date: '2026-01-01T00:00:00.000Z',
        reminderDays: 7
      },
      {
        id: 2,
        userId: 'alice@example.com',
        name: 'Trip',
        date: '2025-12-20T00:00:00.000Z',
        reminderDays: 14
      },
      {
        id: 3,
        userId: 'bob@example.com',
        name: 'Project Launch',
        date: '2025-12-25T00:00:00.000Z',
        reminderDays: 10
      }
    ]);

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, processedCount: 3 });

    expect(mockSendMail).toHaveBeenCalledTimes(2);
    const recipients = mockSendMail.mock.calls.map(([mail]) => mail.to).sort();
    expect(recipients).toEqual(['alice@example.com', 'bob@example.com']);

    const aliceEmail = mockSendMail.mock.calls.find(
      ([mail]) => mail.to === 'alice@example.com'
    )?.[0];
    const bobEmail = mockSendMail.mock.calls.find(
      ([mail]) => mail.to === 'bob@example.com'
    )?.[0];

    expect(aliceEmail?.subject).toBe('Days Since reminders: 2 events due');
    expect(bobEmail?.subject).toBe('Days Since reminders: 1 event due');

    expect(dbMockModule.__mocks.mockUpdateSet).toHaveBeenCalledTimes(2);
    for (const [payload] of dbMockModule.__mocks.mockUpdateSet.mock.calls) {
      expect(payload.reminderSent).toBe(true);
      expect(payload.lastReminderSentAt).toEqual(expect.any(Date));
    }
  });

  it('continues processing other users when one email send fails', async () => {
    dbMockModule.__mocks.mockSelectWhere.mockResolvedValue([
      {
        id: 11,
        userId: 'broken@example.com',
        name: 'Broken User Event',
        date: '2025-12-20T00:00:00.000Z',
        reminderDays: 7
      },
      {
        id: 12,
        userId: 'healthy@example.com',
        name: 'Healthy User Event',
        date: '2025-12-15T00:00:00.000Z',
        reminderDays: 7
      }
    ]);

    mockSendMail
      .mockRejectedValueOnce(new Error('SMTP unavailable'))
      .mockResolvedValueOnce({ messageId: 'healthy-message-id' });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, processedCount: 2 });
    expect(mockSendMail).toHaveBeenCalledTimes(2);

    // Only successful sends should be marked as delivered.
    expect(dbMockModule.__mocks.mockUpdateSet).toHaveBeenCalledTimes(1);
    expect(drizzleMockModule.__mocks.mockInArray).toHaveBeenCalledTimes(1);
    expect(drizzleMockModule.__mocks.mockInArray).toHaveBeenCalledWith('id', [12]);
  });
});
