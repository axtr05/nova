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
import { db, sanitizeFirestoreData } from "@/services/firebase/firebaseService";
import { toast } from "sonner";
import { Calendar, Settings as SettingsIcon, RefreshCcw, Loader2, AlertTriangle, Cpu, Wand2 } from "lucide-react";
import { syncOrchestrator } from "@/services/sync/syncOrchestrator";
import { hasValidCalendarToken, isPopupActive } from "@/services/sync/googleCalendarSync";
import { SyncMode, AIModelsSettings } from "@/frontend/types/user";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectMode, setDisconnectMode] = useState<"none" | "keep" | "remove">("none");
  const [activeTab, setActiveTab] = useState<"calendar" | "ai">("calendar");

  React.useEffect(() => {
    const handlePopupState = () => setIsConnecting(isPopupActive);
    window.addEventListener("nova:popup-state-change", handlePopupState);
    return () => window.removeEventListener("nova:popup-state-change", handlePopupState);
  }, []);

  if (!user) return null;

  const auth = getAuth();
  const firebaseUser = auth.currentUser;
  const isGoogleUser = firebaseUser?.providerData.some(p => p.providerId === "google.com");
  const isConnected = !!user.googleCalendar?.connected;
  const syncMode = user.googleCalendar?.syncMode || "none";
  const needsReconnect = isConnected && !hasValidCalendarToken();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await syncOrchestrator.connectCalendar();
      await setDoc(doc(db, "users", user.uid), sanitizeFirestoreData({
        settings: {
          googleCalendar: {
            connected: true,
            syncMode: "two_way",
            syncEnabled: true,
            connectedAt: new Date().toISOString()
          }
        }
      }), { merge: true });
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
      await setDoc(doc(db, "users", user.uid), sanitizeFirestoreData({
        settings: {
          googleCalendar: {
            ...user.googleCalendar,
            syncMode: mode
          }
        }
      }), { merge: true });
      toast.success("Sync Mode Updated");
    } catch (e) {
      toast.error("Failed to update sync mode");
    }
  };

  const handleDisconnect = async (action: "keep" | "remove") => {
    try {
      await setDoc(doc(db, "users", user.uid), sanitizeFirestoreData({
        settings: {
          googleCalendar: {
            connected: false,
            syncMode: "none",
            syncEnabled: false
          }
        }
      }), { merge: true });
      
      if (action === "remove") {
        toast.success("Disconnected and queued imported events for removal");
      } else {
        toast.success("Disconnected. Imported events were kept.");
      }
      setDisconnectMode("none");
    } catch (e) {
      toast.error("Failed to disconnect");
    }
  };

  const handleUpdateAIModel = async (feature: keyof AIModelsSettings, value: string) => {
    try {
      const currentModels = user.aiModels || {
        planner: "AUTO",
        analytics: "AUTO",
        memory: "AUTO",
        dailyReview: "AUTO",
        globalOverride: null
      };

      await setDoc(doc(db, "users", user.uid), sanitizeFirestoreData({
        settings: {
          aiModels: {
            ...currentModels,
            [feature]: value === "null" ? null : value
          }
        }
      }), { merge: true });
      toast.success("AI Model Preferences Updated");
    } catch (e) {
      toast.error("Failed to update AI preferences");
    }
  };

  const aiSettings = user.aiModels || {
    planner: "AUTO",
    analytics: "AUTO",
    memory: "AUTO",
    dailyReview: "AUTO",
    globalOverride: null
  };

  const availableModels = [
    { id: "AUTO", label: "AUTO (Recommended)" },
    { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] glass-card text-slate-100 border-white/10 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-slate-400" /> Settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 border-b border-white/10 pb-4 mt-2">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "calendar" 
                ? "bg-white text-slate-900" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            Google Calendar
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "ai" 
                ? "bg-white text-slate-900" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            AI Models
          </button>
        </div>

        <div className="space-y-6 mt-4">
          {activeTab === "calendar" && (
            <section className="space-y-4">
            
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
                <div className="flex justify-center w-full mt-4">
                  <Button onClick={handleConnect} disabled={isConnecting} className="h-8 px-6 bg-gradient-nova hover:bg-gradient-nova-hover text-white shadow-lg shadow-violet-500/20">
                    {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                    Reconnect
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
                          syncMode === mode.id
                            ? "bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 gap-3 border-t border-white/5">
                  <p className="text-[11px] text-slate-500 font-medium">
                    Last Sync: {user.googleCalendar?.lastSuccessfulSync ? new Date(user.googleCalendar.lastSuccessfulSync).toLocaleString() : "Never"}
                  </p>
                  <div className="flex justify-end gap-3 w-full sm:w-auto">
                    <Button onClick={() => {
                      toast.info("Syncing with Google Calendar...");
                      window.dispatchEvent(new Event("nova:manual-sync"));
                    }} variant="outline" className="h-8 px-4 text-xs bg-white/5 border-white/10 text-slate-300 hover:text-white">
                      <RefreshCcw className="h-3 w-3 mr-1.5" /> Sync Now
                    </Button>
                    <Button onClick={() => setDisconnectMode("remove")} variant="destructive" className="h-8 px-4 text-xs bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/60">
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </section>
          )}

          {activeTab === "ai" && (
            <section className="space-y-4">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-300">Global Override</h4>
                    <p className="text-xs text-indigo-200/70 mt-1">Force all features to use a specific model.</p>
                  </div>
                  <select
                    value={aiSettings.globalOverride || "null"}
                    onChange={(e) => handleUpdateAIModel("globalOverride", e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="null">None (Use Feature Settings)</option>
                    {availableModels.filter(m => m.id !== "AUTO").map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: "planner", label: "Planner & AI Assistant", icon: <Wand2 className="h-4 w-4" /> },
                  { key: "analytics", label: "Weekly Analytics", icon: <Cpu className="h-4 w-4" /> },
                  { key: "memory", label: "Memory Extraction", icon: <Cpu className="h-4 w-4" /> },
                  { key: "dailyReview", label: "Daily Review", icon: <Cpu className="h-4 w-4" /> }
                ].map(feature => (
                  <div key={feature.key} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-lg text-slate-400">
                        {feature.icon}
                      </div>
                      <p className="text-sm font-medium text-slate-200">{feature.label}</p>
                    </div>
                    <select
                      value={aiSettings[feature.key as keyof AIModelsSettings] || "AUTO"}
                      onChange={(e) => handleUpdateAIModel(feature.key as keyof AIModelsSettings, e.target.value)}
                      disabled={!!aiSettings.globalOverride}
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {availableModels.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>
          )}
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
