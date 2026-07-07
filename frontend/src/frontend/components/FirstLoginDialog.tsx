"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { getAuth } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase/firebaseService";
import { syncOrchestrator } from "@/services/sync/syncOrchestrator";
import { toast } from "sonner";
import { Calendar, RefreshCcw, Loader2 } from "lucide-react";

export function FirstLoginDialog() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    const isGoogleUser = firebaseUser?.providerData.some(p => p.providerId === "google.com");

    if (user && isGoogleUser && user.calendarConfigured !== true) {
      setIsOpen(true);
    }
  }, [user]);

  const handleSkip = async () => {
    if (!user) return;
    try {
      setIsOpen(false);
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        settings: {
          calendarConfigured: true,
          syncMode: "none"
        }
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    setIsConnecting(true);
    try {
      await syncOrchestrator.connectCalendar();
      
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        settings: {
          calendarConfigured: true,
          syncMode: "two_way" // default when they click connect initially
        }
      }, { merge: true });
      
      toast.success("Calendar Connected!", { description: "You can change sync settings in your profile." });
      // Resume background sync immediately
      window.dispatchEvent(new Event("nova:manual-sync"));
      setIsOpen(false);
    } catch (error: any) {
      toast.error("Connection Failed", { description: error.message });
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-[425px] glass-card text-slate-100 border-white/10 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-violet-400" /> Connect Google Calendar?
          </DialogTitle>
          <DialogDescription className="text-slate-400 mt-2 text-sm">
            Import your Google Calendar into NOVA and optionally keep both calendars synchronized.
            <br/><br/>
            You can disable this anytime in Settings.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isConnecting}
            className="text-sm text-slate-400 hover:text-white hover:bg-white/5"
          >
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
            className="text-sm font-medium bg-gradient-nova hover:bg-gradient-nova-hover text-white shadow-lg shadow-violet-500/20"
          >
            {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
            Connect Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
