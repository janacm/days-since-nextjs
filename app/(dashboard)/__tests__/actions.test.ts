/* @jest-environment node */
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

process.env.POSTGRES_URL =
  process.env.POSTGRES_URL || 'postgres://user:pass@localhost:5432/dummy';

// Expose mocks via global to avoid hoisting issues

jest.mock('@/lib/auth', () => ({
  auth: jest.fn()
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

jest.mock('@/lib/db', () => {
  process.env.POSTGRES_URL =
    process.env.POSTGRES_URL || 'postgres://user:pass@localhost:5432/dummy';
  const actual = jest.requireActual('@/lib/db');
  const mockReturning = jest.fn().mockResolvedValue([{ id: 1 }]);
  const mockValues = jest.fn(() => ({ returning: mockReturning }));
  const mockInsert = jest.fn(() => ({ values: mockValues }));
  const mockWhere = jest.fn(() => ({ returning: mockReturning }));
  const mockSet = jest.fn(() => ({ where: mockWhere }));
  const mockUpdate = jest.fn(() => ({ set: mockSet }));
  const mockCheckEventNameExists = jest.fn().mockResolvedValue(false);

  (global as any).dbTestMocks = {
    mockCheckEventNameExists,
    mockInsert,
    mockValues,
    mockReturning,
    mockUpdate,
    mockSet,
    mockWhere
  };

  return {
    ...actual,
    db: { insert: mockInsert, update: mockUpdate },
    events: actual.events,
    checkEventNameExists: mockCheckEventNameExists
  };
});

import { addEvent, editEvent } from '../actions';
import { events } from '@/lib/db';
const mockAuth = auth as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { email: 'user@example.com' } });
  (global as any).dbTestMocks.mockCheckEventNameExists.mockResolvedValue(false);
});

describe('addEvent', () => {
  it('creates event with reminderDays when provided', async () => {
    const formData = new FormData();
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');
    formData.append('reminderDays', '10');

    await addEvent(formData);

    expect((global as any).dbTestMocks.mockInsert).toHaveBeenCalledWith(events);
    expect((global as any).dbTestMocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ reminderDays: 10 })
    );
    expect(redirect).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('creates event with null reminderDays when not provided', async () => {
    const formData = new FormData();
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');

    await addEvent(formData);

    expect((global as any).dbTestMocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ reminderDays: null })
    );
  });

  it('throws error for invalid reminderDays', async () => {
    const formData = new FormData();
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');
    formData.append('reminderDays', '0');

    await expect(addEvent(formData)).rejects.toThrow(
      'Please specify a valid number of days for the reminder'
    );
    expect((global as any).dbTestMocks.mockInsert).not.toHaveBeenCalled();
  });

  it('creates event with isPrivate=true when checkbox is set', async () => {
    const formData = new FormData();
    formData.append('name', 'Private Event');
    formData.append('date', '2025-06-01');
    formData.append('isPrivate', 'on');

    await addEvent(formData);

    expect((global as any).dbTestMocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ isPrivate: true })
    );
  });

  it('creates event with isPrivate=false when checkbox is not set', async () => {
    const formData = new FormData();
    formData.append('name', 'Public Event');
    formData.append('date', '2025-06-01');

    await addEvent(formData);

    expect((global as any).dbTestMocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ isPrivate: false })
    );
  });
});

describe('addEvent duplicate names', () => {
  it('checks the name against the current user before inserting', async () => {
    const formData = new FormData();
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');

    await addEvent(formData);

    expect(
      (global as any).dbTestMocks.mockCheckEventNameExists
    ).toHaveBeenCalledWith('user@example.com', 'Event');
  });

  it('returns an error and does not insert when the name is taken', async () => {
    (global as any).dbTestMocks.mockCheckEventNameExists.mockResolvedValue(
      true
    );
    const formData = new FormData();
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');
    formData.append('reminderDays', '10');

    const result = await addEvent(formData);

    expect(result).toEqual({
      error: expect.stringContaining('already have an event with this name')
    });
    expect((global as any).dbTestMocks.mockInsert).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('editEvent', () => {
  it('updates event with reminderDays when provided', async () => {
    const formData = new FormData();
    formData.append('id', '1');
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');
    formData.append('reminderDays', '5');

    await editEvent(formData);

    expect((global as any).dbTestMocks.mockUpdate).toHaveBeenCalledWith(events);
    expect((global as any).dbTestMocks.mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ reminderDays: 5 })
    );
    expect(redirect).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('sets reminderDays to null when not provided', async () => {
    const formData = new FormData();
    formData.append('id', '1');
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');

    await editEvent(formData);

    expect((global as any).dbTestMocks.mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ reminderDays: null })
    );
  });

  it('updates event with isPrivate=true when provided', async () => {
    const formData = new FormData();
    formData.append('id', '1');
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');
    formData.append('isPrivate', 'on');

    await editEvent(formData);

    expect((global as any).dbTestMocks.mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ isPrivate: true })
    );
  });

  it('updates event with isPrivate=false when not provided', async () => {
    const formData = new FormData();
    formData.append('id', '1');
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');

    await editEvent(formData);

    expect((global as any).dbTestMocks.mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ isPrivate: false })
    );
  });
});

describe('editEvent duplicate names', () => {
  it('excludes the edited event from the name check', async () => {
    const formData = new FormData();
    formData.append('id', '7');
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');

    await editEvent(formData);

    expect(
      (global as any).dbTestMocks.mockCheckEventNameExists
    ).toHaveBeenCalledWith('user@example.com', 'Event', 7);
  });

  it('returns an error and does not update when the name is taken', async () => {
    (global as any).dbTestMocks.mockCheckEventNameExists.mockResolvedValue(
      true
    );
    const formData = new FormData();
    formData.append('id', '1');
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');

    const result = await editEvent(formData);

    expect(result).toEqual({
      error: expect.stringContaining('already have an event with this name')
    });
    expect((global as any).dbTestMocks.mockUpdate).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('editEvent ownership and input', () => {
  it('limits the update to events owned by the current user', async () => {
    const formData = new FormData();
    formData.append('id', '1');
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');

    await editEvent(formData);

    const { and, eq } = jest.requireActual('drizzle-orm');
    expect((global as any).dbTestMocks.mockWhere).toHaveBeenCalledWith(
      and(eq(events.id, 1), eq(events.userId, 'user@example.com'))
    );
  });

  it('rejects a non-numeric id', async () => {
    const formData = new FormData();
    formData.append('id', 'abc');
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');

    await expect(editEvent(formData)).rejects.toThrow('Invalid event id');
    expect((global as any).dbTestMocks.mockUpdate).not.toHaveBeenCalled();
  });
});

describe('event name trimming', () => {
  it('trims the name before checking and saving', async () => {
    const formData = new FormData();
    formData.append('name', '  Dentist  ');
    formData.append('date', '2025-06-01');

    await addEvent(formData);

    expect(
      (global as any).dbTestMocks.mockCheckEventNameExists
    ).toHaveBeenCalledWith('user@example.com', 'Dentist');
    expect((global as any).dbTestMocks.mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dentist' })
    );
  });
});
