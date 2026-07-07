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
    const [conflicts, setConflicts] = useState<ConflictEvent[]>([]);

    const syncGoogleToNova = async () => {
      if (!user) return;
      hasSynced.current = true;

      try {
        const { missingEvents, updatedEvents, conflicts: newConflicts } = await syncOrchestrator.syncGoogleToNova(user.uid, localEvents);
        
        if (newConflicts.length > 0) {
          setConflicts(newConflicts);
        }

        if (missingEvents.length > 0 || updatedEvents.length > 0) {
          toast.success(`Synced ${missingEvents.length + updatedEvents.length} events from Google.`);
        }
      } catch (e: any) {
        console.error("Background sync failed", e);
      }
    };

    useEffect(() => {
      let isMounted = true;
      const initSync = async () => {
        if (!user || hasSynced.current) return;
        const token = await getCalendarAccessToken();
        if (!token) return;

        if (user.syncMode === "google_to_nova" || user.syncMode === "two_way") {
          if (isMounted) await syncGoogleToNova();
        }
      };
      
      initSync();

      const handleManualSync = () => {
        hasSynced.current = false;
        syncGoogleToNova();
      };
      window.addEventListener("nova:manual-sync", handleManualSync);
      
      return () => {
        isMounted = false;
        window.removeEventListener("nova:manual-sync", handleManualSync);
      };
    }, [user, localEvents]);

    const resolveConflicts = async (resolutions: Record<string, "local" | "google">) => {
      if (!user) return;
      await syncOrchestrator.resolveConflicts(user.uid, conflicts, resolutions);
      setConflicts([]);
    };

    return { syncGoogleToNova, conflicts, resolveConflicts };
  }
