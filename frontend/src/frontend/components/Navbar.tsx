"use client";

import React from "react";
import { Settings, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { format, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { ViewType } from "@/types";
import { motion } from "framer-motion";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { logoutUser } from "@/frontend/lib/firebase/auth";
import { LogOut, Brain, BarChart3 } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  view: ViewType;
  setView: (view: ViewType) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  onOpenMemory: () => void;
  onOpenSettings: () => void;
  onOpenReview: () => void;
}

export function Navbar({
  view,
  setView,
  currentDate,
  setCurrentDate,
  onOpenMemory,
  onOpenSettings,
  onOpenReview,
}: NavbarProps) {
  const { user } = useAuth();
  const [imgError, setImgError] = React.useState(false);

  const getInitials = (name?: string | null, email?: string | null) => {
    const text = name || email || "User";
    const parts = text.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const handlePrev = () => {
    if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDateDisplayString = () => {
    if (view === "day") {
      return format(currentDate, "MMMM d, yyyy");
    } else {
      // Find start of week (Monday) and end of week (Sunday)
      const dayOfWeek = currentDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() + diffToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      if (monday.getMonth() === sunday.getMonth()) {
        return `${format(monday, "MMMM d")} – ${format(sunday, "d, yyyy")}`;
      } else if (monday.getFullYear() === sunday.getFullYear()) {
        return `${format(monday, "MMM d")} – ${format(sunday, "MMM d, yyyy")}`;
      } else {
        return `${format(monday, "MMM d, yyyy")} – ${format(sunday, "MMM d, yyyy")}`;
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-6 py-3.5 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-nova shadow-lg shadow-violet-500/25">
          <Sparkles className="h-5 w-5 text-white" />
          <span className="absolute -inset-1.5 rounded-xl border border-violet-500/25 blur-sm -z-10 animate-pulse" />
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight text-white font-sans flex items-center gap-1.5">
            NOVA
            <span className="text-[11px] uppercase font-bold bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded-md text-violet-300">
              v1.0
            </span>
          </span>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={handleToday}
          className="h-9 px-4 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 text-sm font-semibold transition"
        >
          Today
        </button>
        <button
          onClick={handleNext}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Next"
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </button>
        
        <h1 className="text-base font-bold text-slate-200 ml-3 tracking-wide font-mono select-none">
          {getDateDisplayString()}
        </h1>
      </div>

      {/* View Toggle & Action */}
      <div className="flex items-center gap-4">
        {/* Sliding View Toggle */}
        <div className="relative flex p-0.5 rounded-xl bg-white/5 border border-white/5">
          {(["day", "week"] as const).map((v) => {
            const isActive = view === v;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`relative px-4 py-1.5 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors z-10 ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-view-pill"
                    className="absolute inset-0 bg-violet-600/30 border border-violet-500/25 shadow-inner shadow-violet-500/10 rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {v}
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenReview}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:text-white hover:bg-orange-500/20 transition-colors"
          title="Daily Review"
        >
          <Sparkles className="h-4.5 w-4.5" />
        </button>

        <Link
          href="/memories"
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:text-white hover:bg-violet-500/20 transition-colors"
          title="Memory Manager"
        >
          <Brain className="h-4.5 w-4.5" />
        </Link>

        <Link
          href="/insights"
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:text-white hover:bg-blue-500/20 transition-colors"
          title="Insights Dashboard"
        >
          <BarChart3 className="h-4.5 w-4.5" />
        </Link>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-2.5 border-l border-white/10">
            {user.photoURL && !imgError ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="h-7 w-7 rounded-full border border-white/10 object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-nova border border-violet-400/50 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-violet-500/20">
                {getInitials(user.displayName, user.email)}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors cursor-pointer"
              aria-label="Log Out"
              title="Log Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
