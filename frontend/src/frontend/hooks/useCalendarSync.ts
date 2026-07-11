  import { useEffect, useRef, useState } from "react";
  import { useAuth } from "@/frontend/contexts/AuthContext";
  import { CalendarEvent } from "@/types";
  import { toast } from "sonner";
  import { syncOrchestrator } from "@/services/sync/syncOrchestrator";
  import { getCalendarAccessToken } from "@/services/sync/googleCalendarSync";
  import { ConflictEvent } from "@/services/sync/conflictResolver";

  export function useCalendarSync(localEvents: CalendarEvent[]) {
    const { user } = useAuth();
    const hasSynced = useRef(false);
    const localEventsRef = useRef(localEvents);
    const [conflicts, setConflicts] = useState<ConflictEvent[]>([]);

    useEffect(() => {
      localEventsRef.current = localEvents;
    }, [localEvents]);

    const syncGoogleToNova = async (isUserInteraction = false) => {
      if (!user) return;
      hasSynced.current = true;

      try {
        const { missingEvents, updatedEvents, deletedEvents, conflicts: newConflicts } = await syncOrchestrator.syncGoogleToNova(user.uid, localEventsRef.current, isUserInteraction);
        
        if (newConflicts.length > 0) {
          setConflicts(newConflicts);
        }

        if (missingEvents.length > 0 || updatedEvents.length > 0 || deletedEvents.length > 0) {
          toast.success(`Synced ${missingEvents.length + updatedEvents.length} events from Google. Removed ${deletedEvents.length}.`);
        }
      } catch (e: any) {
        console.error("Background sync failed", e);
      }
    };

    useEffect(() => {
      let isMounted = true;
      const initSync = async () => {
        if (!user || hasSynced.current) return;
        if (!user.googleCalendar?.connected) return;

        const syncMode = user.googleCalendar.syncMode;
        if (syncMode === "google_to_nova" || syncMode === "two_way") {
          if (isMounted) await syncGoogleToNova();
        }
      };
      
      initSync();

      let syncInterval: NodeJS.Timeout | null = null;
      if (user?.googleCalendar?.connected) {
        const syncMode = user.googleCalendar.syncMode;
        if (syncMode === "google_to_nova" || syncMode === "two_way") {
          syncInterval = setInterval(() => {
            if (isMounted) syncGoogleToNova();
          }, 60000); // Poll every 60 seconds
        }
      }

      const handleManualSync = () => {
        hasSynced.current = false;
        syncGoogleToNova(true);
      };
      window.addEventListener("nova:manual-sync", handleManualSync);
      
      return () => {
        isMounted = false;
        if (syncInterval) clearInterval(syncInterval);
        window.removeEventListener("nova:manual-sync", handleManualSync);
      };
    }, [user]);

    const resolveConflicts = async (resolutions: Record<string, "local" | "google">) => {
      if (!user) return;
      await syncOrchestrator.resolveConflicts(user.uid, conflicts, resolutions);
      setConflicts([]);
    };

    return { syncGoogleToNova, conflicts, resolveConflicts };
  }
