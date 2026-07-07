"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "@/frontend/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Brain, Check, X, ArrowRight } from "lucide-react";
import { DailyReviewInput } from "@/types";
import { DailyReviewResult } from "@/server/ai/memoryGemini";
import { useMemories } from "@/frontend/hooks/useMemories";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: string;
}

export function DailyReviewModal({ isOpen, onClose, context }: DailyReviewModalProps) {
  const { addMemory } = useMemories();
  
  const [step, setStep] = useState<"input" | "processing" | "result">("input");
  const [form, setForm] = useState<DailyReviewInput>({
    wentWell: "",
    didNotGoWell: "",
    energy: 5,
    mood: 5,
    rememberTomorrow: "",
    additionalNotes: ""
  });
  
  const [result, setResult] = useState<DailyReviewResult | null>(null);

  const handleSubmit = async () => {
    if (!form.wentWell.trim() && !form.didNotGoWell.trim()) {
      toast.error("Review incomplete", { description: "Please answer at least one question." });
      return;
    }

    setStep("processing");

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: form, context })
      });

      if (!response.ok) throw new Error("Failed to process review");

      const data = (await response.json()) as DailyReviewResult;
      setResult(data);

      // Save memories
      if (data.memories && data.memories.length > 0) {
        for (const m of data.memories) {
          await addMemory({
            title: m.title,
            content: m.content,
            category: m.category,
            importance: m.importance,
            createdAt: new Date().toISOString(),
            source: m.source || `Daily Review ${format(new Date(), "yyyy-MM-dd")}`,
            isPinned: false
          });
        }
      }

      setStep("result");
    } catch (error) {
      console.error(error);
      toast.error("Processing failed", { description: "Could not generate daily review." });
      setStep("input");
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after close animation
    setTimeout(() => {
      setStep("input");
      setResult(null);
      setForm({
        wentWell: "",
        didNotGoWell: "",
        energy: 5,
        mood: 5,
        rememberTomorrow: "",
        additionalNotes: ""
      });
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto overflow-x-hidden glass-card text-slate-100 border-white/10 shadow-2xl p-0 rounded-2xl custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-nova rounded-lg">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Daily Review</h2>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{format(new Date(), "EEEE, MMM d, yyyy")}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-8 relative min-h-[450px]">
          <AnimatePresence mode="wait">
            
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block">What went well today?</label>
                    <textarea 
                      value={form.wentWell}
                      onChange={(e) => setForm({...form, wentWell: e.target.value})}
                      placeholder="Finished the marketing presentation..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 min-h-[100px] custom-scrollbar resize-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block">What didn't go well?</label>
                    <textarea 
                      value={form.didNotGoWell}
                      onChange={(e) => setForm({...form, didNotGoWell: e.target.value})}
                      placeholder="Got distracted during afternoon..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 min-h-[100px] custom-scrollbar resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center justify-between">
                        Energy Level
                        <span className="text-violet-400 text-sm">{form.energy}</span>
                      </label>
                      <input 
                        type="range" min="1" max="10" 
                        value={form.energy}
                        onChange={(e) => setForm({...form, energy: parseInt(e.target.value)})}
                        className="w-full accent-violet-500"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center justify-between">
                        Mood
                        <span className="text-violet-400 text-sm">{form.mood}</span>
                      </label>
                      <input 
                        type="range" min="1" max="10" 
                        value={form.mood}
                        onChange={(e) => setForm({...form, mood: parseInt(e.target.value)})}
                        className="w-full accent-violet-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest block">Remember for tomorrow</label>
                    <input 
                      type="text"
                      value={form.rememberTomorrow}
                      onChange={(e) => setForm({...form, rememberTomorrow: e.target.value})}
                      placeholder="Follow up with Sarah..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <Button 
                    onClick={handleSubmit}
                    className="bg-gradient-nova hover:bg-gradient-nova-hover text-white rounded-xl px-6"
                  >
                    Generate AI Memory <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-nova animate-pulse">
                  <Brain className="h-8 w-8 text-white animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Synthesizing Memories...</h3>
                  <p className="text-xs text-slate-400">Extracting lessons and updating your AI brain.</p>
                </div>
              </motion.div>
            )}

            {step === "result" && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                  <p className="text-sm font-medium text-violet-200 leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Check className="h-3 w-3" /> Achievements
                    </h4>
                    <ul className="space-y-1.5">
                      {result.achievements.map((a, i) => (
                        <li key={i} className="text-xs text-slate-300 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">{a}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Brain className="h-3 w-3" /> Lessons
                    </h4>
                    <ul className="space-y-1.5">
                      {result.lessons.map((l, i) => (
                        <li key={i} className="text-xs text-slate-300 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {result.memories.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      New Memories Stored
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.memories.map((m, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-medium">
                          <span className="text-[10px] uppercase text-violet-400 bg-violet-500/10 px-1 rounded">{m.category}</span>
                          {m.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleClose}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-xl"
                  >
                    Finish Day <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
