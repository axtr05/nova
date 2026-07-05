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
import { Input } from "@/components/ui/input";
import { CalendarEvent } from "@/types";
import { Trash2, Clock, AlignLeft, Tag, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null; // Null means create new
  defaultStart?: string; // Preselected ISO start time
  onSave: (event: Omit<CalendarEvent, "id"> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}

const COLORS = [
  { key: "violet", name: "Violet", bg: "bg-violet-500/20 text-violet-300 border-violet-500/30", dot: "bg-violet-400" },
  { key: "blue", name: "Blue", bg: "bg-blue-500/20 text-blue-300 border-blue-500/30", dot: "bg-blue-400" },
  { key: "emerald", name: "Emerald", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  { key: "pink", name: "Pink", bg: "bg-pink-500/20 text-pink-300 border-pink-500/30", dot: "bg-pink-400" },
  { key: "amber", name: "Amber", bg: "bg-amber-500/20 text-amber-300 border-amber-500/30", dot: "bg-amber-400" },
];

export function EventModal({
  isOpen,
  onClose,
  event,
  defaultStart,
  onSave,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState(event ? event.title : "");
  const [description, setDescription] = useState(event ? event.description || "" : "");
  const [date, setDate] = useState(() => {
    const defaultDate = event ? parseISO(event.start) : (defaultStart ? parseISO(defaultStart) : new Date());
    return format(defaultDate, "yyyy-MM-dd");
  });
  const [startTime, setStartTime] = useState(() => {
    const defaultDate = event ? parseISO(event.start) : (defaultStart ? parseISO(defaultStart) : new Date());
    return format(defaultDate, "HH:mm");
  });
  const [endTime, setEndTime] = useState(() => {
    if (event) {
      return format(parseISO(event.end), "HH:mm");
    } else {
      const defaultDate = defaultStart ? parseISO(defaultStart) : new Date();
      const defaultEnd = new Date(defaultDate.getTime() + 60 * 60 * 1000);
      return format(defaultEnd, "HH:mm");
    }
  });
  const [color, setColor] = useState(event ? event.color || "violet" : "violet");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const startISO = new Date(`${date}T${startTime}:00`).toISOString();
    const endISO = new Date(`${date}T${endTime}:00`).toISOString();

    onSave({
      id: event?.id,
      title,
      description,
      start: startISO,
      end: endISO,
      color,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] glass-card text-slate-100 border-white/10 shadow-2xl p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gradient-nova animate-pulse" />
            {event ? "Edit Workspace Event" : "Create Workspace Event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Title</label>
            <Input
              id="title"
              type="text"
              placeholder="e.g. Weekly Product Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input h-10 w-full rounded-xl bg-white/5 border-white/10 px-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/40"
              required
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <AlignLeft className="h-3 w-3" /> Description
            </label>
            <textarea
              id="description"
              placeholder="Add details, notes, or agenda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="glass-input w-full rounded-xl bg-white/5 border-white/10 p-3 text-sm text-white placeholder-slate-500 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/40 resize-none min-h-[80px]"
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label htmlFor="date" className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" /> Date
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input h-10 w-full rounded-xl bg-white/5 border-white/10 px-3 text-sm text-white focus:border-violet-500/40"
              required
            />
          </div>

          {/* Times Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="startTime" className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3" /> Start Time
              </label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="glass-input h-10 w-full rounded-xl bg-white/5 border-white/10 px-3 text-sm text-white focus:border-violet-500/40"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="endTime" className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3" /> End Time
              </label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="glass-input h-10 w-full rounded-xl bg-white/5 border-white/10 px-3 text-sm text-white focus:border-violet-500/40"
                required
              />
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Tag className="h-3 w-3" /> Color Tag
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    color === c.key
                      ? "bg-white/15 text-white border-white/35 scale-105"
                      : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between mt-6 pt-4 border-t border-white/5">
            {event && onDelete ? (
              <Button
                id="delete-event-btn"
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
                className="h-10 rounded-xl px-4 text-sm font-medium bg-red-950/60 text-red-300 border border-red-500/30 hover:bg-red-950/90"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="h-10 rounded-xl px-4 text-sm text-slate-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-xl px-4 text-sm font-medium bg-gradient-nova hover:bg-gradient-nova-hover text-white shadow-lg shadow-violet-500/20"
              >
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
