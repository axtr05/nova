"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/frontend/components/ui/dialog";
import { Memory, MemoryCategory } from "@/types";
import { Brain, Search, Pin, X, Clock, Target, Dumbbell, BookOpen, Star, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";

interface MemoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  onTogglePin: (memory: Memory) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES: { name: MemoryCategory; icon: React.ReactNode }[] = [
  { name: "Goal", icon: <Target className="h-3 w-3" /> },
  { name: "Habit", icon: <Clock className="h-3 w-3" /> },
  { name: "Health", icon: <Dumbbell className="h-3 w-3" /> },
  { name: "Study", icon: <BookOpen className="h-3 w-3" /> },
  { name: "Lesson", icon: <Star className="h-3 w-3" /> },
  { name: "Reminder", icon: <Clock className="h-3 w-3" /> },
  { name: "Preference", icon: <Star className="h-3 w-3" /> },
  { name: "Project", icon: <Target className="h-3 w-3" /> },
  { name: "Deadline", icon: <Clock className="h-3 w-3" /> },
  { name: "General", icon: <Brain className="h-3 w-3" /> },
];

export function MemoryViewer({ isOpen, onClose, memories, onTogglePin, onDelete }: MemoryViewerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | null>(null);

  const filteredMemories = useMemo(() => {
    let filtered = memories;
    
    if (selectedCategory) {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }
    
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(q) || 
        m.content.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [memories, search, selectedCategory]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col overflow-hidden glass-card text-slate-100 border-white/10 shadow-2xl p-0 rounded-2xl">
        
        {/* Header & Search */}
        <div className="flex flex-col border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center justify-between p-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-nova rounded-xl shadow-lg shadow-violet-500/20">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">AI Brain & Memory</h2>
                <p className="text-xs font-medium text-slate-400">{memories.length} memories stored</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 pb-4 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search memories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === null 
                    ? "bg-white text-black border-white" 
                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200"
                }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.name 
                      ? "bg-violet-500 text-white border-violet-400 shadow-md shadow-violet-500/20" 
                      : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200"
                  }`}
                >
                  {cat.icon}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-black/20 custom-scrollbar">
          {filteredMemories.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
              <Brain className="h-10 w-10 opacity-20" />
              <p className="text-sm font-medium">No memories found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredMemories.map(memory => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={memory.id}
                    className={`p-4 rounded-2xl border flex flex-col gap-3 group relative transition-colors ${
                      memory.isPinned 
                        ? "bg-violet-900/10 border-violet-500/30" 
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${
                            memory.isPinned ? "bg-violet-500 text-white" : "bg-white/10 text-slate-300"
                          }`}>
                            {memory.category}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Score: {memory.importance}/10
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-200 leading-tight pr-6">{memory.title}</h3>
                      </div>
                      <button
                        onClick={() => onTogglePin(memory)}
                        className={`absolute top-4 right-4 p-1.5 rounded-md transition-colors ${
                          memory.isPinned 
                            ? "text-violet-400 bg-violet-500/10 hover:bg-violet-500/20" 
                            : "text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5" fill={memory.isPinned ? "currentColor" : "none"} />
                      </button>
                    </div>
                    
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {memory.content}
                    </p>
                    
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/5">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {memory.source || format(parseISO(memory.createdAt), "MMM d, yyyy")}
                      </span>
                      <button
                        onClick={() => onDelete(memory.id)}
                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
