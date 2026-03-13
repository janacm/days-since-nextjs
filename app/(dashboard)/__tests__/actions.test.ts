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
  const mockDeleteWhere = jest.fn();
  const mockDelete = jest.fn(() => ({ where: mockDeleteWhere }));
  const mockLimit = jest
    .fn()
    .mockResolvedValue([{ id: 1, resettable: true }]);
  const mockSelectWhere = jest.fn(() => ({ limit: mockLimit }));
  const mockSelectFrom = jest.fn(() => ({ where: mockSelectWhere }));
  const mockSelect = jest.fn(() => ({ from: mockSelectFrom }));

  (global as any).dbTestMocks = {
    mockInsert,
    mockValues,
    mockReturning,
    mockUpdate,
    mockSet,
    mockWhere,
    mockDelete,
    mockDeleteWhere,
    mockSelect,
    mockSelectFrom,
    mockSelectWhere,
    mockLimit
  };

  return {
    ...actual,
    db: {
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      select: mockSelect
    },
    events: actual.events
  };
});

import { addEvent, editEvent, resetEvent } from '../actions';
import { events } from '@/lib/db';
const mockAuth = auth as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { email: 'user@example.com' } });
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

  it('throws when event is not owned by user', async () => {
    (global as any).dbTestMocks.mockLimit.mockResolvedValueOnce([]);

    const formData = new FormData();
    formData.append('id', '1');
    formData.append('name', 'Event');
    formData.append('date', '2025-06-01');

    await expect(editEvent(formData)).rejects.toThrow(
      'Event not found or access denied'
    );
    expect((global as any).dbTestMocks.mockUpdate).not.toHaveBeenCalled();
  });
});

describe('resetEvent', () => {
  it('requires an authenticated user', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const formData = new FormData();
    formData.append('id', '1');

    await expect(resetEvent(formData)).rejects.toThrow(
      'You must be logged in to reset an event'
    );
  });

  it('throws when event is not owned by user', async () => {
    (global as any).dbTestMocks.mockLimit.mockResolvedValueOnce([]);

    const formData = new FormData();
    formData.append('id', '1');

    await expect(resetEvent(formData)).rejects.toThrow(
      'Event not found or access denied'
    );
    expect((global as any).dbTestMocks.mockUpdate).not.toHaveBeenCalled();
  });
});
