import { CalendarEvent } from "@/types";
import { fetchGoogleEvents, connectCalendarProvider } from "./googleCalendarSync";
import { queueSyncUpdate, queueSyncDelete } from "./syncQueue";
import { detectConflicts, ConflictEvent } from "./conflictResolver";
import { plannerService } from "../planner/plannerService";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { hasValidCalendarToken } from "./googleCalendarSync";
import { getCategoryAndColor } from "@/frontend/utils/colors";

export const syncOrchestrator = {
  async connectCalendar(forcePrompt: boolean = true) {
    try {
      return await connectCalendarProvider(forcePrompt);
    } catch (error) {
      console.error("[SYNC] Connect calendar failed:", error);
      throw error;
    }
  },

  async syncGoogleToNova(uid: string, localEvents: CalendarEvent[], isUserInteraction = false): Promise<{
    missingEvents: CalendarEvent[];
    updatedEvents: CalendarEvent[];
    deletedEvents: CalendarEvent[];
    conflicts: ConflictEvent[];
  }> {
    console.log(`[SYNC] Starting Google -> NOVA sync for user: ${uid}`);
    const now = new Date();
    const timeMin = startOfMonth(subMonths(now, 1)).toISOString();
    const timeMax = endOfMonth(addMonths(now, 1)).toISOString();

    if (!hasValidCalendarToken()) {
      console.log("[SYNC] No valid Google Calendar token. Skipping syncGoogleToNova.");
      return { missingEvents: [], updatedEvents: [], deletedEvents: [], conflicts: [] };
    }

    let googleEvents = [];
    try {
      googleEvents = await fetchGoogleEvents(timeMin, timeMax, isUserInteraction);
    } catch (e) {
      console.warn("Skipping sync update: Failed to fetch Google Calendar events.", e);
      return { missingEvents: [], updatedEvents: [], deletedEvents: [], conflicts: [] };
    }
    
    const { missingEvents, updatedEvents, deletedEvents, newConflicts } = detectConflicts(localEvents, googleEvents);

    console.log(`[SYNC] Google -> NOVA Analysis:`);
    console.log(`[SYNC] Missing (to create): ${missingEvents.length}`);
    console.log(`[SYNC] Updated (to overwrite): ${updatedEvents.length}`);
    console.log(`[SYNC] Deleted (to remove): ${deletedEvents.length}`);
    console.log(`[CONFLICT] Detected Conflicts: ${newConflicts.length}`);

    if (missingEvents.length > 0 || updatedEvents.length > 0) {
      await plannerService.batchUpsertEvents(uid, [...missingEvents, ...updatedEvents]);
    }

    if (deletedEvents.length > 0) {
      for (const ev of deletedEvents) {
        await plannerService.deleteEvent(uid, ev.id);
      }
    }

    return { missingEvents, updatedEvents, deletedEvents, conflicts: newConflicts };
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
          end: end as string,
          color: c.localMatch.isManualColor ? c.localMatch.color : getCategoryAndColor(c.googleEvent.summary || c.localMatch.title).color
        });
      } else if (decision === "local") {
        console.log(`[CONFLICT] Resolution: Kept local version for event ${c.id}`);
        localMatchesToPush.push(c.localMatch);
      }
    });

    try {
      if (resolvedLocalUpdates.length > 0) {
        await plannerService.batchUpsertEvents(uid, resolvedLocalUpdates);
      }

      if (localMatchesToPush.length > 0) {
        for (const evt of localMatchesToPush) {
          console.log(`[SYNC] Pushing resolved local event ${evt.id} back to Google`);
          this.pushLocalUpdate(uid, evt);
        }
      }
      console.log(`[SYNC] Google -> NOVA sync completed successfully.`);
    } catch (error) {
      console.error("[SYNC] Google -> NOVA sync failed:", error);
    }
  },

  pushLocalUpdate(uid: string, event: CalendarEvent, delayMs: number = 2000) {
    console.log(`[SYNC] Queueing local update for event ${event.id}`);
    queueSyncUpdate(uid, event, delayMs);
  },

  pushLocalDelete(googleEventId: string) {
    console.log(`[SYNC] Queueing local deletion for googleEventId ${googleEventId}`);
    queueSyncDelete(googleEventId);
  }
};
