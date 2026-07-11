"use client";

import React from "react";
import { CalendarEvent } from "@/types";
import { CheckCircle2, Circle, Clock, Award, BookOpen, Smile, Globe } from "lucide-react";
import { format, parseISO, isAfter } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { resolveColor, getColorClass } from "@/frontend/utils/colors";

interface SidebarProps {
  events: CalendarEvent[];
  toggleCompleteEvent: (event: CalendarEvent) => void;
  currentDate: Date;
  onEndDay: () => void;
}

export function Sidebar({
  events,
  toggleCompleteEvent,
  currentDate,
  onEndDay,
}: SidebarProps) {
  // Priority Sorting Logic
  const getPriorityWeight = (p?: string) => {
    if (p === 'do_it_now') return 4;
    if (p === 'high') return 3;
    if (p === 'medium') return 2;
    if (p === 'low') return 1;
    return 0;
  };

  const prioritySort = (a: CalendarEvent, b: CalendarEvent) => {
    const pA = getPriorityWeight(a.priority);
    const pB = getPriorityWeight(b.priority);
    if (pA !== pB) return pB - pA;
    return a.start.localeCompare(b.start);
  };

  // Filter events for the current selected date
  const todayEvents = events.filter((evt) => {
    const start = parseISO(evt.start);
    return (
      start.getDate() === currentDate.getDate() &&
      start.getMonth() === currentDate.getMonth() &&
      start.getFullYear() === currentDate.getFullYear()
    );
  }).sort(prioritySort);

  // Filter upcoming events (strictly tomorrow, uncompleted, sorted by priority)
  const tomorrow = new Date(currentDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcomingEvents = events.filter((evt) => {
    if (evt.completed) return false;
    const start = parseISO(evt.start);
    return (
      start.getDate() === tomorrow.getDate() &&
      start.getMonth() === tomorrow.getMonth() &&
      start.getFullYear() === tomorrow.getFullYear()
    );
  }).sort(prioritySort).slice(0, 3);

  // Statistics calculations
  const totalTasksToday = todayEvents.length;
  const completedTasksToday = todayEvents.filter((evt) => evt.completed).length;

  const completionPercentage = totalTasksToday > 0 
    ? Math.round((completedTasksToday / totalTasksToday) * 100) 
    : 0;

  // Calculate free hours today (24 hours minus total scheduled hours)
  const totalScheduledMs = todayEvents.reduce((acc, evt) => {
    const start = parseISO(evt.start).getTime();
    const end = parseISO(evt.end).getTime();
    return acc + (end - start);
  }, 0);
  
  const totalScheduledHours = totalScheduledMs / (1000 * 60 * 60);
  const freeHours = Math.max(0, Math.round((24 - totalScheduledHours) * 10) / 10);

  return (
    <aside className="w-[360px] h-full flex flex-col gap-8 p-8 border-l border-white/5 bg-slate-950/40 backdrop-blur-xl">
      {/* Quick Statistics Card */}
      <section className="glass-card p-6 rounded-2xl flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-24 w-24 bg-violet-600/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <Award className="h-4 w-4 text-violet-400" /> Focus Analytics
        </h2>
        
        <div className="grid grid-cols-3 gap-3 mt-1">
          <div className="flex flex-col gap-1.5 bg-white/5 border border-white/5 rounded-xl p-3 items-center justify-center">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{totalTasksToday}</span>
            <span className="text-xs font-medium text-slate-400 text-center tracking-wide">Tasks Today</span>
          </div>
          <div className="flex flex-col gap-1.5 bg-white/5 border border-white/5 rounded-xl p-3 items-center justify-center">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{completionPercentage}%</span>
            <span className="text-xs font-medium text-slate-400 text-center tracking-wide">Completed</span>
          </div>
          <div className="flex flex-col gap-1.5 bg-white/5 border border-white/5 rounded-xl p-3 items-center justify-center">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">{freeHours}h</span>
            <span className="text-xs font-medium text-slate-400 text-center tracking-wide">Free Hours</span>
          </div>
        </div>

        {/* Dynamic visual rings or encouragement bar */}
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-1.5 border border-white/5">
          <motion.div 
            className="bg-gradient-nova h-full rounded-full" 
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <button 
          onClick={onEndDay}
          className="w-full mt-2 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 hover:border-violet-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Award className="h-3.5 w-3.5 text-violet-400" /> Complete Daily Review
        </button>
      </section>

      {/* Today's Schedule / Checklist */}
      <section className="flex-1 flex flex-col gap-4 min-h-[300px]">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 px-1">
          <CheckCircle2 className="h-4 w-4 text-violet-400" /> Today&apos;s Focus
        </h2>
        
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
          <AnimatePresence initial={false}>
            {todayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-white/3 border border-dashed border-white/5 rounded-2xl py-10 gap-3">
                <Smile className="h-8 w-8 text-slate-500 stroke-[1.5]" />
                <p className="text-xs text-slate-400 font-medium">No tasks scheduled for today. Double-click the grid to plan.</p>
              </div>
            ) : (
              <>
                {todayEvents.slice(0, 5).map((evt) => {
                  const isCompleted = evt.completed === true;
                  const startTimeStr = format(parseISO(evt.start), "h:mm a");
                  return (
                    <motion.div
                      key={evt.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      onClick={() => toggleCompleteEvent(evt)}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                        isCompleted 
                          ? "bg-slate-900/40 border-white/5 opacity-60 hover:opacity-80" 
                          : "bg-white/5 hover:bg-white/8 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <button className="mt-0.5 text-slate-400 hover:text-white transition-colors">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-violet-400 fill-violet-500/10" />
                        ) : (
                          <Circle className="h-4.5 w-4.5 text-slate-500 hover:text-slate-300" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-bold truncate transition-all flex items-center gap-2 text-slate-200 ${
                          isCompleted ? "line-through text-slate-500 decoration-slate-600" : ""
                        }`}>
                          {evt.title}
                          {evt.source === "Google Calendar" && <Globe className="h-3.5 w-3.5 opacity-50" />}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-1.5 font-mono">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {startTimeStr}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
                {todayEvents.length > 5 && (
                  <div className="flex items-center justify-center p-3 rounded-xl bg-white/3 border border-white/5 text-xs text-slate-400 font-bold tracking-wider">
                    +{todayEvents.length - 5} more tasks
                  </div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 px-1">
          <BookOpen className="h-4 w-4 text-violet-400" /> Next in Agenda
        </h2>
        
        <div className="flex flex-col gap-3">
          {upcomingEvents.length === 0 ? (
            <div className="text-center p-4 bg-white/3 border border-white/5 rounded-xl text-xs text-slate-500 font-medium">
              No important tasks tomorrow.
            </div>
          ) : (
            upcomingEvents.map((evt) => {
              const startDateTime = parseISO(evt.start);
              const dateStr = format(startDateTime, "MMM d");
              const timeStr = format(startDateTime, "h:mm a");
              
              return (
                <div
                  key={evt.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1 pr-4">
                    <span className="text-sm font-bold text-slate-200 truncate flex items-center gap-2">
                      {evt.title}
                      {evt.source === "Google Calendar" && <Globe className="h-3.5 w-3.5 opacity-50" />}
                      {evt.priority === 'do_it_now' && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                          Urgent
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{timeStr}</span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-extrabold shrink-0 ${getColorClass(resolveColor(evt))}`}>
                    {dateStr}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </aside>
  );
}
