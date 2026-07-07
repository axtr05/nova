import { CalendarEvent } from "@/types";
import { GoogleEvent } from "./googleCalendarSync";

export interface ConflictEvent {
  id: string;
  localTitle: string;
  googleTitle: string;
  googleEventId: string;
  localMatch: CalendarEvent;
  googleEvent: GoogleEvent;
}

export const detectConflicts = (localEvents: CalendarEvent[], googleEvents: GoogleEvent[]) => {
  const missingEvents: CalendarEvent[] = [];
  const updatedEvents: CalendarEvent[] = [];
  const newConflicts: ConflictEvent[] = [];

  googleEvents.forEach(gEvent => {
    const localMatch = localEvents.find(e => e.googleEventId === gEvent.id);
    
    const start = gEvent.start.dateTime || gEvent.start.date;
    const end = gEvent.end.dateTime || gEvent.end.date;
    
    if (!start || !end) return;

    if (!localMatch) {
      missingEvents.push({
        id: typeof crypto !== "undefined" && crypto.randomUUID 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2, 9),
        title: gEvent.summary || "Untitled Event",
        description: gEvent.description || "",
        start,
        end,
        color: "blue",
        source: "Google Calendar",
        googleEventId: gEvent.id
      });
    } else {
      if (
         localMatch.title !== gEvent.summary ||
         localMatch.start !== start ||
         localMatch.end !== end
      ) {
        newConflicts.push({
          id: localMatch.id,
          localTitle: localMatch.title,
          googleTitle: gEvent.summary || "Untitled",
          googleEventId: gEvent.id,
          localMatch,
          googleEvent: gEvent
        });
      }
    }
  });

  return { missingEvents, updatedEvents, newConflicts };
};
