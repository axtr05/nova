import { useState, useEffect } from "react";
import { CalendarEvent } from "@/types";
import { startOfWeek, addDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";

const LOCAL_STORAGE_KEY = "nova-calendar-events";

function getRelativePreseededEvents(): CalendarEvent[] {
  // Get Monday of current week
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });

  const createEventDate = (daysFromMonday: number, hours: number, minutes: number = 0) => {
    let date = addDays(monday, daysFromMonday);
    date = setHours(date, hours);
    date = setMinutes(date, minutes);
    date = setSeconds(date, 0);
    date = setMilliseconds(date, 0);
    return date.toISOString();
  };

  return [
    {
      id: "1",
      title: "Weekly Product Sync",
      description: "Align on weekly priorities, engineering deliverables, and feedback loops.",
      start: createEventDate(0, 9, 30), // Mon 9:30 AM
      end: createEventDate(0, 10, 30), // Mon 10:30 AM
      color: "violet",
    },
    {
      id: "2",
      title: "NOVA Design System Review",
      description: "Review glassmorphism panels, CSS transition cubic-beziers, and calendar grid alignment.",
      start: createEventDate(0, 13, 0), // Mon 1:00 PM
      end: createEventDate(0, 14, 30), // Mon 2:30 PM
      color: "blue",
    },
    {
      id: "3",
      title: "AI Integration Brainstorm",
      description: "Map out AI custom actions, prompt expansion mechanics, and Gemini model selectors.",
      start: createEventDate(1, 11, 0), // Tue 11:00 AM
      end: createEventDate(1, 12, 0), // Tue 12:00 PM
      color: "emerald",
    },
    {
      id: "4",
      title: "Product Strategy & Roadmap",
      description: "Establish core roadmap priorities and align on next milestones.",
      start: createEventDate(3, 10, 0), // Thu 10:00 AM
      end: createEventDate(3, 11, 30), // Thu 11:30 AM
      color: "violet",
    },
    {
      id: "5",
      title: "Weekly Retro & Demo",
      description: "Demonstrate drag-and-drop calendar features and gather team feedback.",
      start: createEventDate(4, 16, 0), // Fri 4:00 PM
      end: createEventDate(4, 17, 0), // Fri 5:00 PM
      color: "pink",
    }
  ];
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      let initialEvents: CalendarEvent[];
      if (stored) {
        try {
          initialEvents = JSON.parse(stored);
        } catch (e) {
          console.error("Error parsing stored events:", e);
          initialEvents = getRelativePreseededEvents();
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialEvents));
        }
      } else {
        initialEvents = getRelativePreseededEvents();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialEvents));
      }
      
      // Delay state updates to avoid synchronous state changes inside useEffect body
      const timer = setTimeout(() => {
        setEvents(initialEvents);
        setIsLoaded(true);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, []);

  const saveEvents = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newEvents));
    }
  };

  const addEvent = (eventData: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: typeof crypto !== "undefined" && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 9),
    };
    const updated = [...events, newEvent];
    saveEvents(updated);
    return newEvent;
  };

  const updateEvent = (updatedEvent: CalendarEvent) => {
    const updated = events.map((evt) =>
      evt.id === updatedEvent.id ? updatedEvent : evt
    );
    saveEvents(updated);
  };

  const deleteEvent = (id: string) => {
    const updated = events.filter((evt) => evt.id !== id);
    saveEvents(updated);
  };

  return {
    events,
    isLoaded,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
