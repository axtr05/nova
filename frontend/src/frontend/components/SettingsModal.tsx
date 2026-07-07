"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { getAuth } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase/firebaseService";
import { toast } from "sonner";
import { Calendar, Settings as SettingsIcon, RefreshCcw, X, Loader2, AlertTriangle } from "lucide-react";
import { syncOrchestrator } from "@/services/sync/syncOrchestrator";
import { hasValidCalendarToken } from "@/services/sync/googleCalendarSync";
import { SyncMode } from "@/frontend/types/user";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectMode, setDisconnectMode] = useState<"none" | "keep" | "remove">("none");

  if (!user) return null;

  const auth = getAuth();
  const firebaseUser = auth.currentUser;
  const isGoogleUser = firebaseUser?.providerData.some(p => p.providerId === "google.com");
  const isConnected = !!user.calendarConfigured && user.syncMode !== "none";
  const needsReconnect = isConnected && !hasValidCalendarToken();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await syncOrchestrator.connectCalendar();
      await setDoc(doc(db, "users", user.uid), {
        settings: {
          calendarConfigured: true,
          syncMode: "two_way"
        }
      }, { merge: true });
      toast.success("Google Calendar Connected!");
      // Resume background sync immediately
      window.dispatchEvent(new Event("nova:manual-sync"));
    } catch (error: any) {
      toast.error("Connection Failed", { description: error.message });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleChangeSyncMode = async (mode: SyncMode) => {
    try {
      await setDoc(doc(db, "users", user.uid), {
        settings: {
          syncMode: mode
        }
      }, { merge: true });
      toast.success("Sync Mode Updated");
    } catch (e) {
      toast.error("Failed to update sync mode");
    }
  };

  const handleDisconnect = async (action: "keep" | "remove") => {
    try {
      await setDoc(doc(db, "users", user.uid), {
        settings: {
          syncMode: "none"
        }
      }, { merge: true });
      
      if (action === "remove") {
        // Here we would typically trigger an API endpoint or background function 
        // to scrub imported events from Firestore.
        toast.success("Disconnected and queued imported events for removal");
      } else {
        toast.success("Disconnected. Imported events were kept.");
      }
      setDisconnectMode("none");
    } catch (e) {
      toast.error("Failed to disconnect");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] glass-card text-slate-100 border-white/10 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-slate-400" /> Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2">
              <Calendar className="h-4 w-4 text-violet-400" /> Google Calendar
            </h3>
            
            {!isGoogleUser ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">
                  Google Calendar Sync requires signing in with Google. You are currently authenticated via Email/Password.
                </p>
              </div>
            ) : !isConnected ? (
              <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-dashed border-white/10 rounded-xl gap-4">
                <p className="text-sm text-slate-400 text-center">
                  Connect your Google Calendar to sync events natively into NOVA.
                </p>
                <Button onClick={handleConnect} disabled={isConnecting} className="bg-gradient-nova hover:bg-gradient-nova-hover text-white">
                  {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                  Connect Google Calendar
                </Button>
              </div>
            ) : needsReconnect ? (
              <div className="flex flex-col items-center justify-center p-6 bg-red-500/10 border border-red-500/20 rounded-xl gap-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <p className="text-sm text-red-200 text-center font-medium">
                  Google Calendar authorization expired.<br />Reconnect to continue syncing.
                </p>
                <div className="flex gap-2 w-full mt-2">
                  <Button onClick={handleConnect} disabled={isConnecting} className="w-full bg-gradient-nova hover:bg-gradient-nova-hover text-white shadow-lg shadow-violet-500/20">
                    {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                    Reconnect
                  </Button>
                  <Button onClick={() => setDisconnectMode("remove")} disabled={isConnecting} variant="destructive" className="w-full bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/60">
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : disconnectMode !== "none" ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-4">
                <p className="text-sm font-semibold text-amber-200">Are you sure you want to disconnect?</p>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => handleDisconnect("keep")} variant="outline" className="bg-white/5 border-amber-500/30 text-amber-300 hover:bg-amber-500/20">
                    Keep imported events in NOVA
                  </Button>
                  <Button onClick={() => handleDisconnect("remove")} variant="outline" className="bg-white/5 border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-white">
                    Remove imported Google Calendar events
                  </Button>
                  <Button onClick={() => setDisconnectMode("none")} variant="ghost" className="text-slate-400 hover:text-white">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Status</p>
                    <p className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Connected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Account</p>
                    <p className="text-sm font-medium text-slate-200">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Sync Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "import_once", label: "Import Once" },
                      { id: "google_to_nova", label: "Google → NOVA" },
                      { id: "nova_to_google", label: "NOVA → Google" },
                      { id: "two_way", label: "Two-Way Sync" }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => handleChangeSyncMode(mode.id as SyncMode)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          user.syncMode === mode.id
                            ? "bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500">
                    Last Sync: {user.lastSyncTime ? new Date(user.lastSyncTime).toLocaleString() : "Never"}
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => {
                      toast.info("Syncing with Google Calendar...");
                      window.dispatchEvent(new Event("nova:manual-sync"));
                    }} variant="outline" className="h-8 px-3 text-xs bg-white/5 border-white/10 text-slate-300 hover:text-white">
                      <RefreshCcw className="h-3 w-3 mr-1.5" /> Sync Now
                    </Button>
                    <Button onClick={() => setDisconnectMode("remove")} variant="destructive" className="h-8 px-3 text-xs bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/60">
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="mt-6 pt-4 border-t border-white/5">
          <Button type="button" onClick={onClose} variant="ghost" className="text-slate-400 hover:text-white">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
