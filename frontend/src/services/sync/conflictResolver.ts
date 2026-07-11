import { CalendarEvent } from "@/types";
import { GoogleEvent } from "./googleCalendarSync";
import { getCategoryAndColor } from "@/frontend/utils/colors";

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
  const deletedEvents: CalendarEvent[] = [];
  const newConflicts: ConflictEvent[] = [];

  googleEvents.forEach(gEvent => {
    let localMatch = localEvents.find(e => e.googleEventId === gEvent.id);
    
    const start = gEvent.start.dateTime || gEvent.start.date;
    const end = gEvent.end.dateTime || gEvent.end.date;
    
    if (!start || !end) return;

    if (!localMatch) {
      // 1. Match by googleEventId (already done above)
      // 2. Match by External ID (iCalUID)
      if (gEvent.iCalUID) {
        localMatch = localEvents.find(e => e.externalId === gEvent.iCalUID);
      }
      
      // 3. Match by Hash of title + start + end (Robust)
      if (!localMatch) {
        localMatch = localEvents.find(e => {
          if (e.googleEventId) return false;
          const eTitle = e.title.trim().toLowerCase();
          const gTitle = (gEvent.summary || "Untitled Event").trim().toLowerCase();
          const eStartMin = Math.floor(new Date(e.start).getTime() / 60000);
          const gStartMin = Math.floor(new Date(start).getTime() / 60000);
          const eEndMin = Math.floor(new Date(e.end).getTime() / 60000);
          const gEndMin = Math.floor(new Date(end).getTime() / 60000);
          return eTitle === gTitle && eStartMin === gStartMin && eEndMin === gEndMin;
        });
      }
    }

    if (!localMatch) {
      if (gEvent.status === "cancelled") return; // Nothing to delete locally
      
      const t = (gEvent.summary || "").toLowerCase();
      let color = getCategoryAndColor(gEvent.summary || "Untitled Event").color;

      missingEvents.push({
        id: typeof crypto !== "undefined" && crypto.randomUUID 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2, 9),
        title: gEvent.summary || "Untitled Event",
        description: gEvent.description || "",
        start,
        end,
        color,
        source: "Google Calendar",
        googleEventId: gEvent.id,
        externalId: gEvent.iCalUID,
        lastSyncHash: gEvent.updated
      });
    } else {
      if (gEvent.status === "cancelled") {
        deletedEvents.push(localMatch);
      } else if (gEvent.updated && localMatch.lastSyncHash !== gEvent.updated) {
        // Google event changed. Check if local differs.
        const eTitle = localMatch.title.trim().toLowerCase();
        const gTitle = (gEvent.summary || "Untitled Event").trim().toLowerCase();
        const titleDiffers = eTitle !== gTitle;
        const startDiffers = Math.floor(new Date(localMatch.start).getTime() / 60000) !== Math.floor(new Date(start).getTime() / 60000);
        const endDiffers = Math.floor(new Date(localMatch.end).getTime() / 60000) !== Math.floor(new Date(end).getTime() / 60000);

        if (titleDiffers || startDiffers || endDiffers) {
          // Both changed or differ significantly. Ask the user.
          newConflicts.push({
            id: localMatch.id,
            localTitle: localMatch.title,
            googleTitle: gEvent.summary || "Untitled Event",
            googleEventId: gEvent.id,
            localMatch,
            googleEvent: gEvent
          });
        } else {
          // Overwrite silently if only description or metadata changed
          updatedEvents.push({
            ...localMatch,
            title: gEvent.summary || "Untitled Event",
            description: gEvent.description || "",
            start,
            end,
            lastSyncHash: gEvent.updated,
            googleEventId: gEvent.id,
            externalId: gEvent.iCalUID,
            color: localMatch.isManualColor ? localMatch.color : getCategoryAndColor(gEvent.summary || "Untitled Event").color
          });
        }
      } else if (
         localMatch.title.trim().toLowerCase() !== (gEvent.summary || "Untitled Event").trim().toLowerCase() ||
         Math.floor(new Date(localMatch.start).getTime() / 60000) !== Math.floor(new Date(start).getTime() / 60000) ||
         Math.floor(new Date(localMatch.end).getTime() / 60000) !== Math.floor(new Date(end).getTime() / 60000)
      ) {
         // Fallback if no hash exists but data differs (e.g., legacy events)
         newConflicts.push({
            id: localMatch.id,
            localTitle: localMatch.title,
            googleTitle: gEvent.summary || "Untitled Event",
            googleEventId: gEvent.id,
            localMatch,
            googleEvent: gEvent
         });
      }
    }
  });

  return { missingEvents, updatedEvents, deletedEvents, newConflicts };
};
