"use client";

import React from "react";
import { AIAnalysisResult, PlannerAction } from "@/server/types/actions";
import { 
  AlertTriangle, 
  Check, 
  X, 
  Calendar, 
  Activity, 
  Info,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface AnalysisPanelProps {
  result: AIAnalysisResult | null;
  onClose: () => void;
  onAccept: (changes: PlannerAction[]) => void;
}

export function AnalysisPanel({ result, onClose, onAccept }: AnalysisPanelProps) {
  if (!result) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-24 right-8 w-[450px] max-h-[70vh] overflow-hidden flex flex-col glass-card border border-white/10 rounded-2xl shadow-2xl z-50 bg-slate-950/80 backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-nova rounded-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-white tracking-tight">AI Schedule Analysis</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Summary */}
          {result.summary && (
            <div className="space-y-2">
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {result.summary}
              </p>
            </div>
          )}

          {/* Warnings & Conflicts */}
          {(result.warnings?.length > 0 || result.conflicts?.length > 0) && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-amber-500" /> Attention Needed
              </h4>
              <div className="flex flex-col gap-2">
                {result.conflicts?.map((conflict, i) => (
                  <div key={`conflict-${i}`} className="text-xs text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                    {conflict}
                  </div>
                ))}
                {result.warnings?.map((warning, i) => (
                  <div key={`warning-${i}`} className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Free Time */}
          {result.free_time?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-emerald-500" /> Opportunities
              </h4>
              <div className="flex flex-col gap-2">
                {result.free_time.map((time, i) => (
                  <div key={`time-${i}`} className="text-xs text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {time}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-blue-500" /> Suggested Action Plan
              </h4>
              
              {result.suggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-3 bg-white/5 border-b border-white/5">
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      {suggestion.reasoning}
                    </p>
                  </div>
                  
                  {/* Preview Changes */}
                  <div className="p-3 bg-black/20 space-y-2">
                    {suggestion.proposed_changes.map((change, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                        {change.action === "create_event" && <span className="text-emerald-400 font-medium">Create:</span>}
                        {change.action === "update_event" && <span className="text-blue-400 font-medium">Move:</span>}
                        {change.action === "delete_event" && <span className="text-red-400 font-medium">Delete:</span>}
                        <span className="truncate text-slate-300">
                          {change.action === "create_event" ? change.title : 
                           change.action === "update_event" ? change.originalTitle : 
                           change.action === "delete_event" ? change.title : 
                           "Modify event"}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 p-2 bg-black/40">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      className="flex-1 h-8 text-xs text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      <X className="h-3 w-3 mr-1" /> Reject
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        onAccept(suggestion.proposed_changes);
                        onClose();
                      }}
                      className="flex-1 h-8 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                    >
                      <Check className="h-3 w-3 mr-1" /> Accept Changes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
