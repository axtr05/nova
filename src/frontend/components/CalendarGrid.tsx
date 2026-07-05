"use client";

import React, { useRef, useEffect, useState } from "react";
import { CalendarEvent, ViewType } from "@/types";
import { Clock, Grab } from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  parseISO,
  differenceInMinutes,
  getHours,
  getMinutes,
  isSameDay,
} from "date-fns";

interface CalendarGridProps {
  view: ViewType;
  currentDate: Date;
  events: CalendarEvent[];
  onUpdateEvent: (event: CalendarEvent) => void;
  onAddEventClick: (defaultStartISO: string) => void;
  onEditEventClick: (event: CalendarEvent) => void;
}

const ROW_HEIGHT = 68; // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarGrid({
  view,
  currentDate,
  events,
  onUpdateEvent,
  onAddEventClick,
  onEditEventClick,
}: CalendarGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridColumnsContainerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  // Drag and resize active states
  const [activeDrag, setActiveDrag] = useState<{
    eventId: string;
    initialStartMs: number;
    initialEndMs: number;
    initialClientY: number;
    initialClientX: number;
    initialColIndex: number;
  } | null>(null);

  const [activeResize, setActiveResize] = useState<{
    eventId: string;
    initialEndMs: number;
    initialClientY: number;
  } | null>(null);

  // Update current time indicator
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to 8:00 AM on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 7.5 * ROW_HEIGHT;
    }
  }, [view]);

  // Get Monday of current week
  const startOfSelectedWeek = startOfWeek(currentDate, { weekStartsOn: 1 });

  // Get column dates based on view
  const columns: Date[] = [];
  if (view === "day") {
    columns.push(currentDate);
  } else {
    for (let i = 0; i < 7; i++) {
      columns.push(addDays(startOfSelectedWeek, i));
    }
  }

  // Handle Drag Start
  const handleDragStart = (
    e: React.MouseEvent,
    event: CalendarEvent,
    colIndex: number
  ) => {
    e.stopPropagation();
    e.preventDefault();

    setActiveDrag({
      eventId: event.id,
      initialStartMs: parseISO(event.start).getTime(),
      initialEndMs: parseISO(event.end).getTime(),
      initialClientY: e.clientY,
      initialClientX: e.clientX,
      initialColIndex: colIndex,
    });
  };

  // Handle Resize Start
  const handleResizeStart = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setActiveResize({
      eventId: event.id,
      initialEndMs: parseISO(event.end).getTime(),
      initialClientY: e.clientY,
    });
  };

  // Handle Grid Empty Cell Click
  const handleGridClick = (e: React.MouseEvent, date: Date) => {
    if (activeDrag || activeResize) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickedHour = clickY / ROW_HEIGHT;
    
    // Snap to nearest 30 mins
    const snappedHour = Math.floor(clickedHour * 2) / 2;
    const hours = Math.floor(snappedHour);
    const minutes = (snappedHour % 1) * 60;

    const clickedDate = new Date(date);
    clickedDate.setHours(hours, minutes, 0, 0);

    onAddEventClick(clickedDate.toISOString());
  };

  // Attach global mousemove/mouseup listeners for resilient dragging/resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeDrag) {
        const deltaY = e.clientY - activeDrag.initialClientY;
        const deltaHours = deltaY / ROW_HEIGHT;
        // Snap to nearest 15 mins (0.25h)
        const snappedDeltaHours = Math.round(deltaHours * 4) / 4;
        const deltaMs = snappedDeltaHours * 60 * 60 * 1000;

        let dayShiftMs = 0;
        if (view === "week" && gridColumnsContainerRef.current) {
          const containerRect = gridColumnsContainerRef.current.getBoundingClientRect();
          const colWidth = containerRect.width / 7;
          const deltaX = e.clientX - activeDrag.initialClientX;
          const colShift = Math.round(deltaX / colWidth);
          
          // Clamp column shift to remain in bounds
          const targetColIndex = Math.max(0, Math.min(6, activeDrag.initialColIndex + colShift));
          const actualColShift = targetColIndex - activeDrag.initialColIndex;
          dayShiftMs = actualColShift * 24 * 60 * 60 * 1000;
        }

        const newStart = new Date(activeDrag.initialStartMs + deltaMs + dayShiftMs);
        const newEnd = new Date(activeDrag.initialEndMs + deltaMs + dayShiftMs);

        // Update local event visually in parent state in real time
        const eventToUpdate = events.find((evt) => evt.id === activeDrag.eventId);
        if (eventToUpdate) {
          onUpdateEvent({
            ...eventToUpdate,
            start: newStart.toISOString(),
            end: newEnd.toISOString(),
          });
        }
      }

      if (activeResize) {
        const deltaY = e.clientY - activeResize.initialClientY;
        const deltaHours = deltaY / ROW_HEIGHT;
        // Snap to nearest 15 mins (0.25h)
        const snappedDeltaHours = Math.round(deltaHours * 4) / 4;
        const deltaMs = snappedDeltaHours * 60 * 60 * 1000;

        const eventToResize = events.find((evt) => evt.id === activeResize.eventId);
        if (eventToResize) {
          const startMs = parseISO(eventToResize.start).getTime();
          let newEndMs = activeResize.initialEndMs + deltaMs;

          // Enforce minimum 15 minute duration
          if (newEndMs - startMs < 15 * 60 * 1000) {
            newEndMs = startMs + 15 * 60 * 1000;
          }

          onUpdateEvent({
            ...eventToResize,
            end: new Date(newEndMs).toISOString(),
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (activeDrag) setActiveDrag(null);
      if (activeResize) setActiveResize(null);
    };

    if (activeDrag || activeResize) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeDrag, activeResize, events, view, onUpdateEvent]);

  // Color classes helper
  const getEventColorClasses = (color?: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500/15 border-blue-500/35 text-blue-200 border-l-[3px] border-l-blue-500 hover:bg-blue-500/20";
      case "emerald":
        return "bg-emerald-500/15 border-emerald-500/35 text-emerald-200 border-l-[3px] border-l-emerald-500 hover:bg-emerald-500/20";
      case "pink":
        return "bg-pink-500/15 border-pink-500/35 text-pink-200 border-l-[3px] border-l-pink-500 hover:bg-pink-500/20";
      case "amber":
        return "bg-amber-500/15 border-amber-500/35 text-amber-200 border-l-[3px] border-l-amber-500 hover:bg-amber-500/20";
      default: // violet
        return "bg-violet-500/15 border-violet-500/35 text-violet-200 border-l-[3px] border-l-violet-500 hover:bg-violet-500/20";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950/20">
      {/* Calendar Header Column Labels */}
      <div className="flex border-b border-white/10 bg-slate-950/50 backdrop-blur-md pl-20">
        {columns.map((date, i) => {
          const isTodayDate = isSameDay(date, now);
          return (
            <div
              key={i}
              className={`flex-1 py-4 text-center border-r border-white/10 flex flex-col items-center justify-center gap-1 ${
                isTodayDate ? "bg-violet-500/3" : ""
              }`}
            >
              <span className={`text-xs uppercase font-extrabold tracking-widest ${
                isTodayDate ? "text-violet-400" : "text-slate-400"
              }`}>
                {view === "week" ? DAYS_OF_WEEK[i] : format(date, "EEEE")}
              </span>
              <span className={`flex items-center justify-center h-9 w-9 rounded-full text-lg font-bold font-mono mt-1 ${
                isTodayDate 
                  ? "bg-gradient-nova text-white shadow-lg shadow-violet-500/20" 
                  : "text-slate-200"
              }`}>
                {format(date, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Grid Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative min-h-0 select-none"
      >
        <div className="flex relative" style={{ height: `${24 * ROW_HEIGHT}px` }}>
          {/* Time Labels Column */}
          <div className="w-20 flex-shrink-0 sticky left-0 z-20 bg-slate-950 border-r border-white/10 text-right pr-4 select-none">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="text-sm font-bold text-slate-300 font-mono flex items-center justify-end"
                style={{ height: `${ROW_HEIGHT}px`, transform: "translateY(-50%)" }}
              >
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? "12 PM"
                  : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Grid Columns Area */}
          <div
            ref={gridColumnsContainerRef}
            className="flex-1 flex relative"
          >
            {/* Horizontal Hour Lines */}
            <div className="absolute inset-0 pointer-events-none flex flex-col">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-white/10 flex-shrink-0"
                  style={{ height: `${ROW_HEIGHT}px` }}
                />
              ))}
            </div>

            {/* Render Column Areas */}
            {columns.map((colDate, colIndex) => {
              const dayEvents = events.filter((evt) => isSameDay(parseISO(evt.start), colDate));
              const isColToday = isSameDay(colDate, now);

              // Calculate current time line y coordinate
              const currentHour = getHours(now);
              const currentMin = getMinutes(now);
              const timeIndicatorY = (currentHour + currentMin / 60) * ROW_HEIGHT;

              return (
                <div
                  key={colIndex}
                  onClick={(e) => handleGridClick(e, colDate)}
                  className={`flex-1 relative border-r border-white/10 h-full cursor-cell hover:bg-white/5 transition-colors ${
                    isColToday ? "bg-violet-500/1" : ""
                  }`}
                >
                  {/* Current Time Indicator Line */}
                  {isColToday && (
                    <div
                      className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                      style={{ top: `${timeIndicatorY}px` }}
                    >
                      <div className="h-2 w-2 rounded-full bg-violet-400 absolute -left-1 shadow-lg shadow-violet-400/50 animate-ping" />
                      <div className="h-1.5 w-1.5 rounded-full bg-violet-400 absolute -left-[3px] shadow-md shadow-violet-400" />
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-violet-400 via-violet-400/80 to-transparent" />
                    </div>
                  )}

                  {/* Render Events within this Column */}
                  {dayEvents.map((evt) => {
                    const start = parseISO(evt.start);
                    const end = parseISO(evt.end);
                    const durationMins = differenceInMinutes(end, start);

                    const startHour = getHours(start);
                    const startMin = getMinutes(start);
                    const top = (startHour + startMin / 60) * ROW_HEIGHT;
                    const height = (durationMins / 60) * ROW_HEIGHT;

                    // Calculate readable start and end times for card
                    const timeRangeStr = `${format(start, "h:mm")} – ${format(end, "h:mm a")}`;

                    const isBeingDragged = activeDrag?.eventId === evt.id;

                    return (
                      <div
                        key={evt.id}
                        onMouseDown={(e) => handleDragStart(e, evt, colIndex)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEventClick(evt);
                        }}
                        className={`absolute left-1.5 right-2.5 px-2.5 py-1.5 rounded-xl border flex flex-col overflow-hidden shadow-md backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl group cursor-grab active:cursor-grabbing ${
                          isBeingDragged ? "opacity-45 scale-[0.98] shadow-2xl z-30" : "z-10"
                        } ${getEventColorClasses(evt.color)}`}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                        }}
                      >
                        {/* Event Card Content */}
                        <div className="min-w-0 flex-1 flex flex-col gap-1">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[15px] font-bold leading-tight truncate select-none block text-white drop-shadow-sm">
                              {evt.title}
                            </span>
                            <Grab className="h-4 w-4 opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0 text-white mix-blend-overlay" />
                          </div>
                          
                          {/* Clock / Time Label */}
                          {height >= ROW_HEIGHT * 0.5 && (
                            <div className="text-[11px] font-semibold tracking-wide opacity-100 mt-0.5 flex items-center gap-1.5 text-slate-100 drop-shadow-sm">
                              <Clock className="h-3 w-3" />
                              <span className="truncate">{timeRangeStr}</span>
                            </div>
                          )}

                          {/* Description */}
                          {evt.description && height >= ROW_HEIGHT * 1.1 && (
                            <p className="text-xs font-medium leading-relaxed opacity-90 mt-1 select-none line-clamp-2 text-slate-100 drop-shadow-sm">
                              {evt.description}
                            </p>
                          )}
                        </div>

                        {/* Resize Handle at bottom edge */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, evt)}
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize group-hover:bg-white/10 transition-colors"
                          title="Drag to resize duration"
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
