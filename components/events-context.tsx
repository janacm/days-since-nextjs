'use client';

import { createContext, useContext, useState } from 'react';
import type { Event } from '@/lib/db';

interface EventsContextValue {
  events: Event[];
  addEvent: (event: Event) => void;
  updateEvent: (event: Event) => void;
  removeEvent: (id: number) => void;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

export function EventsProvider({
  children,
  initialEvents
}: {
  children: React.ReactNode;
  initialEvents: Event[];
}) {
  const [events, setEvents] = useState<Event[]>(initialEvents);

  const addEvent = (event: Event) => {
    setEvents((prev) => [...prev, event]);
  };

  const updateEvent = (updated: Event) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
    );
  };

  const removeEvent = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <EventsContext.Provider value={{ events, addEvent, updateEvent, removeEvent }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) {
    throw new Error('useEvents must be used within EventsProvider');
  }
  return ctx;
}
