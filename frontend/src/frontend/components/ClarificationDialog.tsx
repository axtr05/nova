"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/frontend/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronRight, CornerDownLeft } from "lucide-react";

interface ClarificationDialogProps {
  isOpen: boolean;
  question: string;
  type: "selection" | "input";
  options?: string[];
  onResolve: (answer: string) => void;
  onCancel: () => void;
}

export function ClarificationDialog({ isOpen, question, type, options, onResolve, onCancel }: ClarificationDialogProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputValue.trim()) {
      onResolve(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px] glass-card text-slate-100 border-indigo-500/30 shadow-2xl p-6 rounded-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <HelpCircle className="h-5 w-5" />
            </div>
            Clarification Needed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-300 font-medium">
            {question}
          </p>

          {type === "selection" && options && options.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
              {options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => onResolve(opt)}
                  className="flex items-center justify-between text-left p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all text-sm text-slate-200 font-medium group"
                >
                  <span className="truncate">{opt}</span>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Type your answer..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
              <Button 
                type="submit" 
                disabled={!inputValue.trim()}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 h-10"
              >
                Submit <CornerDownLeft className="h-4 w-4 ml-2" />
              </Button>
            </form>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
