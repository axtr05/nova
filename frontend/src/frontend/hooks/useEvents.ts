import { useState, useEffect } from "react";
import { CalendarEvent } from "@/types";
import { plannerService } from "@/services/planner/plannerService";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { toast } from "sonner";
import { startOfWeek, addDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import { syncOrchestrator } from "@/services/sync/syncOrchestrator";
import { useCalendarSync } from "./useCalendarSync";

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
      start: createEventDate(0, 9, 30),
      end: createEventDate(0, 10, 30),
      color: "violet",
    },
    {
      id: "2",
      title: "NOVA Design System Review",
      description: "Review glassmorphism panels, CSS transition cubic-beziers, and calendar grid alignment.",
      start: createEventDate(0, 13, 0),
      end: createEventDate(0, 14, 30),
      color: "blue",
    },
  ];
}

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { syncGoogleToNova, conflicts, resolveConflicts } = useCalendarSync(events);

  useEffect(() => {
    const handlePushConflict = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (user && (user.googleCalendar?.syncMode === "two_way" || user.googleCalendar?.syncMode === "nova_to_google")) {
         syncOrchestrator.pushLocalUpdate(user.uid, customEvent.detail, 0);
      }
    };
    window.addEventListener("nova:push-local-conflict", handlePushConflict);
    return () => window.removeEventListener("nova:push-local-conflict", handlePushConflict);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);

    // Migration Check
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const localEvents = JSON.parse(stored) as CalendarEvent[];
          if (localEvents.length > 0) {
            toast.promise(
              plannerService.migrateEvents(user.uid, localEvents),
              {
                loading: 'Migrating legacy events to Cloud...',
                success: () => {
                  localStorage.removeItem(LOCAL_STORAGE_KEY);
                  return 'Migration complete!';
                },
                error: 'Failed to migrate events.'
              }
            );
          } else {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        } catch (e) {
          console.error("Migration error", e);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    }

    // Subscribe to Firestore Real-Time
    const unsubscribe = plannerService.subscribeToEvents(
      user.uid,
      (fetchedEvents) => {
        // Deduplicate events by googleEventId, externalId, hash, and id to prevent rendering duplicates
        const deduplicated = fetchedEvents.reduce((acc, current) => {
          const isDuplicate = acc.find(
            (item) =>
              (item.id === current.id) ||
              (item.googleEventId && current.googleEventId && item.googleEventId === current.googleEventId) ||
              (item.externalId && current.externalId && item.externalId === current.externalId) ||
              (!item.googleEventId && !current.googleEventId && item.title === current.title && new Date(item.start).getTime() === new Date(current.start).getTime() && new Date(item.end).getTime() === new Date(current.end).getTime())
          );
          if (!isDuplicate) {
            acc.push(current);
          }
          return acc;
        }, [] as CalendarEvent[]);
        
        setEvents(deduplicated);
        setIsLoaded(true);
      },
      (error: any) => {
        if (error.code === 'permission-denied') {
          toast.error("Permission Denied", { description: "You don't have access to this workspace." });
        } else if (error.code === 'unavailable') {
          toast.error("Offline Mode", { description: "You are currently offline. Changes will sync when reconnected." });
        } else {
          toast.error("Database Error", { description: "Failed to synchronize events." });
        }
        setIsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addEvent = async (eventData: Omit<CalendarEvent, "id">) => {
    if (!user) {
      toast.error("Authentication required");
      return;
    }
    const newEvent: CalendarEvent = {
      ...eventData,
      id: typeof crypto !== "undefined" && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 9),
    };
    
    // Optimistic UI handled natively by Firestore snapshot cache, 
    // but we can fire and forget the mutation
    try {
      await plannerService.createEvent(user.uid, newEvent);
      if (user.googleCalendar?.syncMode === "two_way" || user.googleCalendar?.syncMode === "nova_to_google") {
        syncOrchestrator.pushLocalUpdate(user.uid, newEvent, 0); // No debounce on create
      }
    } catch (err: any) {
      toast.error("Failed to create event", { description: err.message });
      throw err;
    }
    return newEvent;
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    if (!user) return;
    try {
      await plannerService.updateEvent(user.uid, updatedEvent);
      if (user.googleCalendar?.syncMode === "two_way" || user.googleCalendar?.syncMode === "nova_to_google") {
        syncOrchestrator.pushLocalUpdate(user.uid, updatedEvent);
      }
    } catch (err: any) {
      toast.error("Failed to update event", { description: err.message });
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;
    try {
      const eventToDelete = events.find(e => e.id === id);
      await plannerService.deleteEvent(user.uid, id);
      if (eventToDelete?.googleEventId && (user.googleCalendar?.syncMode === "two_way" || user.googleCalendar?.syncMode === "nova_to_google")) {
        syncOrchestrator.pushLocalDelete(eventToDelete.googleEventId);
      }
    } catch (err: any) {
      toast.error("Failed to delete event", { description: err.message });
      throw err;
    }
  };

  return {
    events,
    isLoaded,
    addEvent,
    updateEvent,
    deleteEvent,
    conflicts,
    resolveConflicts
  };
}
