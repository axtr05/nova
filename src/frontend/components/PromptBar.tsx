"use client";

import React, { useState } from "react";
import { ArrowUp, Sparkles, Cpu, ChevronDown, Wand2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { PlannerAction } from "@/backend/types/actions";


interface ModelOption {
  id: string;
  name: string;
  badge: string;
  desc: string;
}

const MODELS: ModelOption[] = [
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", badge: "Active", desc: "Next-gen balanced speed and intelligence" },
  { id: "gemini-3.0-ultra", name: "Gemini 3.0 Ultra", badge: "Reasoning", desc: "Deep reasoning and complex scheduling logic" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", badge: "Production", desc: "Advanced reasoning and task management" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", badge: "Fast", desc: "Sub-second response times for edits" },
];

interface PromptBarProps {
  onAction: (action: PlannerAction) => void;
  context: string;
}

export function PromptBar({ onAction, context }: PromptBarProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          context,
          modelId: selectedModel.id
        })
      });
      
      const action = await response.json() as PlannerAction;
      onAction(action);
      setPrompt("");
    } catch (error) {
      console.error("Prompt submit error:", error);
      onAction({ action: "error", message: "Failed to connect to NOVA engine." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 30 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[720px] px-4"
    >
      <form
        onSubmit={handleSubmit}
        className={`glass-card p-3 rounded-3xl flex flex-col gap-3 border transition-all ${
          isFocused 
            ? "border-violet-500/35 shadow-2xl shadow-violet-500/10 scale-[1.01]" 
            : "border-white/8 shadow-xl shadow-black/40"
        }`}
      >
        {/* Glowing background edge for premium feel */}
        {isFocused && (
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-blue-500/10 blur-md pointer-events-none -z-10 animate-pulse" />
        )}

        <div className="flex items-center gap-4 px-3 pt-2">
          {/* Sparkles Icon */}
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300">
            <Sparkles className="h-4 w-4" />
          </div>

          {/* Text Input */}
          <input
            id="ai-prompt-input"
            type="text"
            placeholder="Ask NOVA to reschedule, clear block, or plan your afternoon..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading}
            className="bg-transparent text-base font-medium text-slate-100 placeholder-slate-400 border-0 outline-none flex-1 py-1 focus:ring-0 focus:outline-none disabled:opacity-50"
            aria-label="Ask NOVA"
          />
          
          {/* Send Button */}
          <button
            id="send-prompt-btn"
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all shrink-0 ${
              prompt.trim() && !isLoading
                ? "bg-gradient-nova hover:bg-gradient-nova-hover text-white shadow-md shadow-violet-500/25 cursor-pointer scale-105"
                : "bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/10" />

        {/* Model Selector & Actions Row */}
        <div className="flex items-center justify-between px-1.5 py-0.5">
          {/* Dropdown Menu for Model Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-7 px-2.5 rounded-lg bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/10 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer outline-none"
            >
              <Cpu className="h-3 w-3 text-violet-400" />
              {selectedModel.name}
              <span className="text-[9px] uppercase tracking-wider bg-violet-500/10 px-1 py-0.5 rounded text-violet-300 border border-violet-500/20 font-bold scale-90">
                {selectedModel.badge}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 glass-card border-white/10 text-slate-200 p-1.5 rounded-xl shadow-2xl">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 px-2 py-1.5 flex items-center gap-1">
                <Wand2 className="h-3 w-3 text-violet-400" /> AI Planning Engines
              </div>
              {MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`flex flex-col items-start gap-0.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white ${
                    selectedModel.id === model.id
                      ? "bg-violet-600/20 text-white font-semibold border-l-2 border-violet-500"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold">{model.name}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded text-slate-300">
                      {model.badge}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium line-clamp-1">{model.desc}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Prompt Assist Help Text */}
          <span className="text-[10px] text-slate-500 font-medium tracking-wide pr-1 select-none flex items-center gap-1">
            Press <kbd className="bg-white/5 px-1 py-0.5 rounded border border-white/5 font-mono text-[9px]">Enter</kbd> to prompt
          </span>
        </div>
      </form>
    </motion.div>
  );
}
