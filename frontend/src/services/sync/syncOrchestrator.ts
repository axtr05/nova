import { CalendarEvent } from "@/types";
import { fetchGoogleEvents, connectCalendarProvider } from "./googleCalendarSync";
import { queueSyncUpdate, queueSyncDelete } from "./syncQueue";
import { detectConflicts, ConflictEvent } from "./conflictResolver";
import { plannerService } from "../planner/plannerService";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { hasValidCalendarToken } from "./googleCalendarSync";

export const syncOrchestrator = {
  async connectCalendar(forcePrompt: boolean = true) {
    return connectCalendarProvider(forcePrompt);
  },

  async syncGoogleToNova(uid: string, localEvents: CalendarEvent[]): Promise<{
    missingEvents: CalendarEvent[];
    updatedEvents: CalendarEvent[];
    conflicts: ConflictEvent[];
  }> {
    const now = new Date();
    const timeMin = startOfMonth(subMonths(now, 1)).toISOString();
    const timeMax = endOfMonth(addMonths(now, 1)).toISOString();

    if (!hasValidCalendarToken()) {
      return { missingEvents: [], updatedEvents: [], conflicts: [] };
    }

    const googleEvents = await fetchGoogleEvents(timeMin, timeMax);
    
    const { missingEvents, updatedEvents, newConflicts } = detectConflicts(localEvents, googleEvents);

    if (missingEvents.length > 0 || updatedEvents.length > 0) {
      await plannerService.batchUpsertEvents(uid, [...missingEvents, ...updatedEvents]);
    }

    return { missingEvents, updatedEvents, conflicts: newConflicts };
  },

  async resolveConflicts(uid: string, conflicts: ConflictEvent[], resolutions: Record<string, "local" | "google">) {
    const resolvedLocalUpdates: CalendarEvent[] = [];
    const localMatchesToPush: CalendarEvent[] = [];

    conflicts.forEach(c => {
      const decision = resolutions[c.id];
      if (decision === "google") {
        const start = c.googleEvent.start?.dateTime || c.googleEvent.start?.date;
        const end = c.googleEvent.end?.dateTime || c.googleEvent.end?.date;
        resolvedLocalUpdates.push({
          ...c.localMatch,
          title: c.googleEvent.summary || c.localMatch.title,
          description: c.googleEvent.description || c.localMatch.description,
          start: start as string,
          end: end as string
        });
      } else if (decision === "local") {
        localMatchesToPush.push(c.localMatch);
      }
    });

    if (resolvedLocalUpdates.length > 0) {
       await plannerService.batchUpsertEvents(uid, resolvedLocalUpdates);
    }

    if (localMatchesToPush.length > 0) {
       for (const ev of localMatchesToPush) {
         queueSyncUpdate(uid, ev, 0);
       }
    }
  },

  pushLocalUpdate(uid: string, event: CalendarEvent, delayMs: number = 2000) {
    queueSyncUpdate(uid, event, delayMs);
  },

  pushLocalDelete(googleEventId: string) {
    queueSyncDelete(googleEventId);
  }
};
