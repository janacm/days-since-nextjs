import { createSubEvent, resetEventCascade, events, eventResets, db } from '../db';
import { SQL } from 'drizzle-orm';

// Helper to extract column and value from Drizzle eq() condition
function parseCond(cond: SQL<any>): { column: string; value: number } {
  const column = (cond as any).queryChunks[1].name;
  const valObj = (cond as any).queryChunks.find((q: any) => typeof q.value === 'number');
  return { column, value: valObj.value };
}

function setupDbMocks() {
  const eventsData: any[] = [];
  const resetsData: any[] = [];

  (db as any).select = jest.fn(() => ({
    from: (table: any) => ({
      where: async (cond: any) => {
        const { column, value } = parseCond(cond);
        if (table === events) {
          if (column === 'id') return eventsData.filter(e => e.id === value);
          if (column === 'parent_id') return eventsData.filter(e => e.parentId === value);
        }
        if (table === eventResets && column === 'event_id') {
          return resetsData.filter(r => r.eventId === value);
        }
        return [];
      }
    })
  }));

  (db as any).update = jest.fn(() => ({
    set: (vals: any) => ({
      where: async (cond: any) => {
        const { value } = parseCond(cond);
        const ev = eventsData.find(e => e.id === value);
        if (ev) {
          if (vals.date) ev.date = vals.date;
          ev.resetCount = (ev.resetCount || 0) + 1;
        }
        return [ev];
      }
    })
  }));

  (db as any).insert = jest.fn((table: any) => ({
    values: (vals: any) => {
      if (table === events) {
        const newEvent = { id: eventsData.length + 1, ...vals };
        eventsData.push(newEvent);
        return { returning: async () => [newEvent] };
      } else if (table === eventResets) {
        const newReset = { id: resetsData.length + 1, ...vals };
        resetsData.push(newReset);
        return Promise.resolve([newReset]);
      }
      return { returning: async () => [] };
    }
  }));

  return { eventsData, resetsData };
}

describe('sub-event utilities', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates sub-event with parent relationship', async () => {
    const { eventsData } = setupDbMocks();
    const date = new Date('2024-05-01T00:00:00Z');
    const event = await createSubEvent('u1', 1, 'Child', date, true, false);
    expect(event.parentId).toBe(1);
    expect(event.resetParentOnSubReset).toBe(true);
    expect(event.resetChildrenOnParentReset).toBe(false);
    expect(eventsData[0]).toEqual(event);
  });

  it('cascades reset from child to parent when configured', async () => {
    const { eventsData, resetsData } = setupDbMocks();
    eventsData.push({ id: 1, userId: 'u1', name: 'Parent', date: '2024-01-01T00:00:00.000Z', resetCount: 0, resetChildrenOnParentReset: false });
    eventsData.push({ id: 2, userId: 'u1', name: 'Child', date: '2024-02-01T00:00:00.000Z', resetCount: 0, parentId: 1, resetParentOnSubReset: true });

    const resetDate = new Date('2024-03-01T00:00:00Z');
    await resetEventCascade(2, resetDate);

    expect(eventsData[0].date).toBe(resetDate.toISOString());
    expect(eventsData[0].resetCount).toBe(1);
    expect(eventsData[1].date).toBe(resetDate.toISOString());
    expect(eventsData[1].resetCount).toBe(1);
    expect(resetsData.filter(r => r.eventId === 1)).toHaveLength(1);
    expect(resetsData.filter(r => r.eventId === 2)).toHaveLength(1);
  });

  it('cascades reset from parent to children when configured', async () => {
    const { eventsData, resetsData } = setupDbMocks();
    eventsData.push({ id: 1, userId: 'u1', name: 'Parent', date: '2024-01-01T00:00:00.000Z', resetCount: 0, resetChildrenOnParentReset: true });
    eventsData.push({ id: 2, userId: 'u1', name: 'Child1', date: '2024-02-01T00:00:00.000Z', resetCount: 0, parentId: 1 });
    eventsData.push({ id: 3, userId: 'u1', name: 'Child2', date: '2024-02-10T00:00:00.000Z', resetCount: 0, parentId: 1 });

    const resetDate = new Date('2024-04-01T00:00:00Z');
    await resetEventCascade(1, resetDate);

    for (const ev of eventsData) {
      expect(ev.date).toBe(resetDate.toISOString());
      expect(ev.resetCount).toBe(1);
    }
    expect(resetsData).toHaveLength(3);
  });
});

