import { CalendarEvent } from "@/types";
import { plannerService } from "../planner/plannerService";
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent, hasValidCalendarToken } from "./googleCalendarSync";

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

  updateTimeouts[localId] = setTimeout(async () => {
    const finalEvent = pendingUpdates[localId] as CalendarEvent;
    delete pendingUpdates[localId];
    delete updateTimeouts[localId];

    try {
      if (!hasValidCalendarToken()) {
        console.warn("Skipping sync update: No valid calendar token.");
        return;
      }

      if (finalEvent.googleEventId) {
        await updateGoogleEvent(finalEvent.googleEventId, {
          summary: finalEvent.title,
          description: finalEvent.description,
          start: { dateTime: finalEvent.start },
          end: { dateTime: finalEvent.end },
        });
      } else {
        const gEvent = await createGoogleEvent({
          summary: finalEvent.title,
          description: finalEvent.description,
          start: { dateTime: finalEvent.start },
          end: { dateTime: finalEvent.end },
        });

        await plannerService.updateEvent(uid, {
          ...finalEvent,
          googleEventId: gEvent.id,
          source: "Google Calendar",
        });
      }
    } catch (e) {
      console.error("Failed to push event via syncQueue", e);
    }
  }, delayMs);
};

export const queueSyncDelete = async (googleEventId: string) => {
  try {
    if (!hasValidCalendarToken()) {
      console.warn("Skipping sync delete: No valid calendar token.");
      return;
    }
    await deleteGoogleEvent(googleEventId);
  } catch (e) {
    console.error("Failed to delete from syncQueue", e);
  }
};
