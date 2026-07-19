"use client";

import React, { useState, useMemo } from "react";
import { ProtectedRoute } from "@/frontend/components/ProtectedRoute";
import { useMemories } from "@/frontend/hooks/useMemories";
import { Memory, MemoryCategory } from "@/types";
import { Brain, Search, Pin, Trash2, ArrowLeft, Target, Clock, Dumbbell, BookOpen, Star, AlertTriangle, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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

export default function MemoriesPage() {
  const { memories, isLoaded, deleteMemory, deleteMultipleMemories, clearAllMemories, togglePin } = useMemories();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMemories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMemories.map(m => m.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} memories?`)) {
      await deleteMultipleMemories(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear ALL memories? This cannot be undone.")) {
      await clearAllMemories();
      setSelectedIds(new Set());
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 flex-col gap-4 text-slate-300">
        <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-nova animate-pulse">
          <span className="h-6 w-6 rounded-full bg-white/20 animate-ping" />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase text-slate-500 font-mono">
          Loading Memories...
        </span>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950/60 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="absolute top-0 right-1/4 h-[400px] w-[500px] bg-violet-900/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-0 h-[300px] w-[400px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Brain className="h-6 w-6 text-violet-400" />
                  Memory Manager
                </h1>
                <p className="text-sm font-medium text-slate-400 mt-1">
                  Manage the AI's long-term understanding of your preferences and goals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl font-medium text-sm transition flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedIds.size})
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 rounded-xl font-medium text-sm transition flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Clear All Memories
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search memories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
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

          {/* Grid */}
          {filteredMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3 glass-card rounded-2xl border border-white/5 mt-4">
              <Brain className="h-10 w-10 opacity-20" />
              <p className="text-sm font-medium">No memories found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pl-2 cursor-pointer w-fit" onClick={toggleSelectAll}>
                {selectedIds.size === filteredMemories.length && filteredMemories.length > 0 ? (
                  <CheckSquare className="h-5 w-5 text-violet-400" />
                ) : (
                  <Square className="h-5 w-5 text-slate-500" />
                )}
                <span className="text-sm font-medium text-slate-400">Select All</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMemories.map(memory => {
                  const isSelected = selectedIds.has(memory.id);
                  
                  return (
                    <div
                      key={memory.id}
                      onClick={() => toggleSelect(memory.id)}
                      className={`p-4 rounded-2xl border flex flex-col gap-3 group relative transition-colors cursor-pointer ${
                        isSelected ? "bg-violet-900/20 border-violet-500/50" :
                        memory.isPinned 
                          ? "bg-violet-900/10 border-violet-500/30 hover:border-violet-500/50" 
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-violet-400 shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          )}
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${
                              memory.isPinned ? "bg-violet-500 text-white" : "bg-white/10 text-slate-300"
                            }`}>
                              {memory.category}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Score: {memory.importance}/10
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePin(memory); }}
                            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                              memory.isPinned ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMemory(memory.id); }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-bold text-slate-200 leading-tight pr-2">{memory.title}</h3>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed line-clamp-3">
                        {memory.content}
                      </p>
                      
                      <div className="mt-auto pt-2 flex items-center justify-between border-t border-white/5">
                        <span className="text-[10px] font-medium text-slate-500">
                          {format(new Date(memory.createdAt), "MMM d, yyyy")}
                        </span>
                        <span className="text-[10px] font-medium text-slate-600 truncate max-w-[120px]">
                          Source: {memory.source}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
