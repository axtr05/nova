"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { PromptBar } from "@/frontend/components/PromptBar";
import { CalendarGrid } from "@/frontend/components/CalendarGrid";
import { EventModal } from "@/frontend/components/EventModal";
import { useEvents } from "@/frontend/hooks/useEvents";
import { CalendarEvent, ViewType } from "@/types";
import { PlannerAction } from "@/backend/types/actions";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ProtectedRoute } from "@/frontend/components/ProtectedRoute";

const COMPLETED_EVENTS_STORAGE_KEY = "nova-completed-events-ids";

export default function Home() {
  const { events, isLoaded, addEvent, updateEvent, deleteEvent } = useEvents();
  const [view, setView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Completed checklist event state
  const [completedEventIds, setCompletedEventIds] = useState<string[]>([]);

  // Modal control state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    event: CalendarEvent | null;
    defaultStart?: string;
  }>({
    isOpen: false,
    event: null,
  });

  // Load completed events on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(COMPLETED_EVENTS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const timer = setTimeout(() => setCompletedEventIds(parsed), 0);
          return () => clearTimeout(timer);
        } catch (e) {
          console.error("Error loading completed event IDs:", e);
        }
      }
    }
  }, []);

  // Save completed events to localstorage on change
  const toggleCompleteEvent = (id: string) => {
    const updated = completedEventIds.includes(id)
      ? completedEventIds.filter((item) => item !== id)
      : [...completedEventIds, id];
    
    setCompletedEventIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(COMPLETED_EVENTS_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const handleOpenAddModal = (defaultStartISO: string) => {
    setModalState({
      isOpen: true,
      event: null,
      defaultStart: defaultStartISO,
    });
  };

  const handleOpenEditModal = (event: CalendarEvent) => {
    setModalState({
      isOpen: true,
      event,
    });
  };

  const handleSaveEvent = (eventData: Omit<CalendarEvent, "id"> & { id?: string }) => {
    if (eventData.id) {
      updateEvent(eventData as CalendarEvent);
    } else {
      addEvent(eventData);
    }
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    // Remove from completed IDs if present
    if (completedEventIds.includes(id)) {
      const updated = completedEventIds.filter((item) => item !== id);
      setCompletedEventIds(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(COMPLETED_EVENTS_STORAGE_KEY, JSON.stringify(updated));
      }
    }
  };

  const handlePlannerAction = (action: PlannerAction) => {
    switch (action.action) {
      case "error":
        toast.error("Action Failed", { description: action.message });
        break;
      
      case "create_event":
        addEvent({
          title: action.title,
          start: `${action.date}T${action.start}:00`,
          end: `${action.date}T${action.end}:00`,
          description: action.description,
          color: action.color || "violet"
        });
        toast.success("Event Created", { description: action.message || `Added ${action.title}` });
        break;

      case "update_event":
        // Match by title
        const targetEvent = events.find(e => e.title.toLowerCase().includes(action.originalTitle.toLowerCase()));
        if (!targetEvent) {
          toast.error("Event Not Found", { description: `Could not find an event matching "${action.originalTitle}"` });
          break;
        }

        const updatedEvent = { ...targetEvent };
        if (action.newTitle) updatedEvent.title = action.newTitle;
        if (action.newDescription) updatedEvent.description = action.newDescription;
        if (action.newColor) updatedEvent.color = action.newColor;

        if (action.newDate || action.newStart || action.newEnd) {
          const oldStartDate = targetEvent.start.split('T')[0];
          const oldStartTime = targetEvent.start.split('T')[1].substring(0, 5);
          const oldEndDate = targetEvent.end.split('T')[0];
          const oldEndTime = targetEvent.end.split('T')[1].substring(0, 5);

          const finalDate = action.newDate || oldStartDate;
          const finalStart = action.newStart || oldStartTime;
          const finalEnd = action.newEnd || oldEndTime;
          const finalEndDate = action.newDate || oldEndDate; // Gemini might not specify end date, assume same day

          updatedEvent.start = `${finalDate}T${finalStart}:00`;
          updatedEvent.end = `${finalEndDate}T${finalEnd}:00`;
        }

        updateEvent(updatedEvent);
        toast.success("Event Updated", { description: action.message || `Updated ${updatedEvent.title}` });
        break;

      case "delete_event":
        const eventToDelete = events.find(e => e.title.toLowerCase().includes(action.title.toLowerCase()));
        if (!eventToDelete) {
          toast.error("Event Not Found", { description: `Could not find an event matching "${action.title}"` });
          break;
        }
        handleDeleteEvent(eventToDelete.id);
        toast.success("Event Deleted", { description: action.message || `Deleted ${action.title}` });
        break;

      case "mark_complete":
        const eventToComplete = events.find(e => e.title.toLowerCase().includes(action.title.toLowerCase()));
        if (!eventToComplete) {
          toast.error("Event Not Found", { description: `Could not find an event matching "${action.title}"` });
          break;
        }
        if (!completedEventIds.includes(eventToComplete.id)) {
          toggleCompleteEvent(eventToComplete.id);
        }
        toast.success("Marked Complete", { description: action.message || `${eventToComplete.title} marked as done!` });
        break;

      case "fetch_schedule":
        try {
          const target = parseISO(action.targetDate);
          setCurrentDate(target);
          setView("day");
          toast.success("Schedule Updated", { description: action.message || `Showing schedule for ${action.targetDate}` });
        } catch {
          toast.error("Invalid Date", { description: "The requested date was invalid." });
        }
        break;
    }
  };

  const aiContext = JSON.stringify({
    currentTime: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    events: events.map(e => ({
      title: e.title,
      start: e.start,
      end: e.end,
      isCompleted: completedEventIds.includes(e.id)
    }))
  });

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 flex-col gap-4 text-slate-300">
        <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-nova animate-pulse">
          <span className="h-6 w-6 rounded-full bg-white/20 animate-ping" />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase text-slate-500 font-mono">
          Booting NOVA Workspace...
        </span>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-slate-950/60 overflow-hidden relative">
        {/* Dynamic glow overlays behind main content panels */}
        <div className="absolute top-0 left-1/4 h-[300px] w-[500px] bg-violet-900/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-1/4 h-[400px] w-[600px] bg-indigo-900/5 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Main Top Header */}
        <Navbar
          view={view}
          setView={setView}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
        />

        {/* Central Content Area */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Calendar Grid Section */}
          <CalendarGrid
            view={view}
            currentDate={currentDate}
            events={events}
            onUpdateEvent={updateEvent}
            onAddEventClick={handleOpenAddModal}
            onEditEventClick={handleOpenEditModal}
          />

          {/* Right analytics Sidebar */}
          <Sidebar
            events={events}
            completedEventIds={completedEventIds}
            toggleCompleteEvent={toggleCompleteEvent}
            currentDate={currentDate}
          />
        </div>

        {/* Signature Floating AI Prompt Bar */}
        <PromptBar onAction={handlePlannerAction} context={aiContext} />

        {/* Event Details Creation / Editing Dialog */}
        <EventModal
          key={modalState.event ? modalState.event.id : `new-${modalState.defaultStart}`}
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, event: null })}
          event={modalState.event}
          defaultStart={modalState.defaultStart}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      </div>
    </ProtectedRoute>
  );
}
