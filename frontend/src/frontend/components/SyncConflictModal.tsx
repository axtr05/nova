"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConflictEvent {
  id: string;
  localTitle: string;
  googleTitle: string;
  googleEventId: string;
}

interface SyncConflictModalProps {
  conflicts: ConflictEvent[];
  onResolve: (resolutions: Record<string, "local" | "google">) => void;
  isOpen: boolean;
}

export function SyncConflictModal({ conflicts, onResolve, isOpen }: SyncConflictModalProps) {
  const handleResolveAllLocal = () => {
    const res: Record<string, "local" | "google"> = {};
    conflicts.forEach(c => res[c.id] = "local");
    onResolve(res);
  };

  const handleResolveAllGoogle = () => {
    const res: Record<string, "local" | "google"> = {};
    conflicts.forEach(c => res[c.id] = "google");
    onResolve(res);
  };

  if (!isOpen || conflicts.length === 0) return null;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[500px] glass-card text-slate-100 border-amber-500/30 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Sync Conflicts Detected
          </DialogTitle>
          <DialogDescription className="text-amber-200/70 mt-2 text-sm">
            {conflicts.length} event(s) were modified in both NOVA and Google Calendar. How would you like to resolve this?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[300px] overflow-y-auto mt-4 pr-2 custom-scrollbar">
          {conflicts.map((conflict, i) => (
            <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase">
                <span>NOVA Version</span>
                <span>Google Version</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-200 line-clamp-1 flex-1">{conflict.localTitle}</span>
                <span className="text-slate-500 mx-2">vs</span>
                <span className="text-violet-300 line-clamp-1 flex-1 text-right">{conflict.googleTitle}</span>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6 pt-4 border-t border-white/5 flex gap-2">
          <Button type="button" onClick={handleResolveAllLocal} variant="outline" className="bg-white/5 border-white/10 text-slate-300 hover:text-white">
            Keep NOVA Changes
          </Button>
          <Button type="button" onClick={handleResolveAllGoogle} className="bg-gradient-nova text-white hover:bg-gradient-nova-hover">
            Keep Google Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
