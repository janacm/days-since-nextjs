/* @jest-environment node */

jest.mock('nodemailer', () => {
  const sendMail = jest.fn();
  const createTransport = jest.fn(() => ({
    sendMail
  }));

  return {
    __esModule: true,
    default: {
      createTransport
    },
    createTransport
  };
});

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn()
  },
  events: {
    id: 'id',
    date: 'date',
    reminderDays: 'reminderDays',
    lastReminderSentAt: 'lastReminderSentAt'
  }
}));

import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { POST } from '../route';

describe('POST /api/reminders', () => {
  const originalEnv = process.env;
  let mockSendMail: jest.Mock;
  let mockWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockSelect: jest.Mock;
  let mockUpdate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    process.env = {
      ...originalEnv,
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'smtp-user@example.com',
      SMTP_PASS: 'smtp-pass',
      SMTP_FROM: 'reminders@example.com'
    };

    const createTransport = nodemailer.createTransport as jest.Mock;
    mockSendMail = createTransport().sendMail;
    mockSendMail.mockResolvedValue({ messageId: 'ok' });

    mockSelect = db.select as jest.Mock;
    mockUpdate = db.update as jest.Mock;
    mockWhere = jest.fn().mockResolvedValue([]);

    mockSelect.mockReturnValue({
      from: jest.fn(() => ({
        where: mockWhere
      }))
    });

    mockUpdateSet = jest.fn(() => ({
      where: jest.fn(() => Promise.resolve())
    }));
    mockUpdate.mockReturnValue({
      set: mockUpdateSet
    });

    mockWhere.mockResolvedValue([]);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns 500 when SMTP configuration is missing', async () => {
    process.env = {
      ...process.env,
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASS: ''
    };

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Email service is not configured' });
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sends one aggregated email per user and marks reminders as sent', async () => {
    mockWhere.mockResolvedValue([
      {
        id: 1,
        name: 'Server Launch',
        date: '2026-02-15T00:00:00.000Z',
        reminderDays: 7,
        userId: 'alice@example.com'
      },
      {
        id: 2,
        name: 'Billing Review',
        date: '2026-02-10T00:00:00.000Z',
        reminderDays: 14,
        userId: 'alice@example.com'
      },
      {
        id: 3,
        name: 'Audit Prep',
        date: '2026-02-12T00:00:00.000Z',
        reminderDays: 10,
        userId: 'bob@example.com'
      }
    ]);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, processedCount: 3 });
    expect(mockSendMail).toHaveBeenCalledTimes(2);

    expect(mockSendMail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        from: 'reminders@example.com',
        to: 'alice@example.com',
        subject: 'Days Since reminders: 2 events due'
      })
    );
    expect(mockSendMail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        from: 'reminders@example.com',
        to: 'bob@example.com',
        subject: 'Days Since reminders: 1 event due'
      })
    );

    const firstEmail = mockSendMail.mock.calls[0][0];
    expect(firstEmail.html).toContain('<strong>Server Launch</strong>');
    expect(firstEmail.html).toContain('<strong>Billing Review</strong>');

    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdateSet).toHaveBeenCalledTimes(2);
    expect(mockUpdateSet).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        reminderSent: true,
        lastReminderSentAt: expect.any(Date)
      })
    );
  });

  it('continues processing other users when one send fails', async () => {
    mockWhere.mockResolvedValue([
      {
        id: 10,
        name: 'First User Event',
        date: '2026-02-10T00:00:00.000Z',
        reminderDays: 3,
        userId: 'first@example.com'
      },
      {
        id: 11,
        name: 'Second User Event',
        date: '2026-02-11T00:00:00.000Z',
        reminderDays: 3,
        userId: 'second@example.com'
      }
    ]);

    mockSendMail
      .mockRejectedValueOnce(new Error('SMTP timeout'))
      .mockResolvedValueOnce({ messageId: 'ok-second' });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, processedCount: 2 });
    expect(mockSendMail).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderSent: true,
        lastReminderSentAt: expect.any(Date)
      })
    );
  });
});
