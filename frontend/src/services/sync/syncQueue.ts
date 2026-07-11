import { CalendarEvent } from "@/types";
import { plannerService } from "../planner/plannerService";
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent, hasValidCalendarToken } from "./googleCalendarSync";
import { format } from "date-fns";

const updateTimeouts: Record<string, NodeJS.Timeout> = {};
const pendingUpdates: Record<string, Partial<CalendarEvent>> = {};

/**
 * Debounced push of local updates to the remote Orchestrator queue.
 */
export const queueSyncUpdate = (
  uid: string,
  localEvent: CalendarEvent,
  delayMs: number = 2000
) => {
  const localId = localEvent.id;

  // Merge pending updates
  pendingUpdates[localId] = {
    ...pendingUpdates[localId],
    ...localEvent,
  };

  if (updateTimeouts[localId]) {
    clearTimeout(updateTimeouts[localId]);
  }
  
  console.log(`[SYNC] Debouncing update for local event ${localId} for ${delayMs}ms`, localEvent);

  updateTimeouts[localId] = setTimeout(async () => {
    const finalEvent = pendingUpdates[localId] as CalendarEvent;
    delete pendingUpdates[localId];
    delete updateTimeouts[localId];

    try {
      if (!hasValidCalendarToken()) {
        console.warn("[SYNC] Skipping sync update: No valid calendar token.");
        return;
      }

      console.log(`[SYNC] Executing queued update for ${localId} to Google Calendar`);

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const formatGDate = (isoString: string) => format(new Date(isoString), "yyyy-MM-dd'T'HH:mm:ssXXX");

      if (finalEvent.googleEventId) {
        const updatedGEvent = await updateGoogleEvent(finalEvent.googleEventId, {
          summary: finalEvent.title,
          description: finalEvent.description,
          start: { dateTime: formatGDate(finalEvent.start), timeZone },
          end: { dateTime: formatGDate(finalEvent.end), timeZone },
        });
        
        console.log(`[SYNC] Successfully updated Google Event ${finalEvent.googleEventId}`);
        
        await plannerService.updateEvent(uid, {
          ...finalEvent,
          lastSyncHash: updatedGEvent.updated
        });
      } else {
        const gEvent = await createGoogleEvent({
          summary: finalEvent.title,
          description: finalEvent.description,
          start: { dateTime: formatGDate(finalEvent.start), timeZone },
          end: { dateTime: formatGDate(finalEvent.end), timeZone },
        });
        
        console.log(`[SYNC] Created new Google Event ${gEvent.id} for local event ${localId}`);

        await plannerService.updateEvent(uid, {
          ...finalEvent,
          googleEventId: gEvent.id,
          source: "Google Calendar",
          lastSyncHash: gEvent.updated
        });
      }
    } catch (e) {
      console.error(`[SYNC] Failed to push event ${localId} via syncQueue:`, e);
    }
  }, delayMs);
};

export const queueSyncDelete = async (googleEventId: string) => {
  try {
    if (!hasValidCalendarToken()) {
      console.warn("[SYNC] Skipping sync delete: No valid calendar token.");
      return;
    }
    console.log(`[SYNC] Executing queued delete for Google Event ${googleEventId}`);
    await deleteGoogleEvent(googleEventId);
    console.log(`[SYNC] Successfully deleted Google Event ${googleEventId}`);
  } catch (e) {
    console.error(`[SYNC] Failed to delete googleEventId ${googleEventId} from syncQueue:`, e);
  }
};
