export type ActionType = 
  | "create_event" 
  | "update_event" 
  | "delete_event" 
  | "mark_complete" 
  | "fetch_schedule"
  | "error";

export interface BaseAction {
  action: ActionType;
  message?: string; // Optional UI feedback message to display in toasts
}

export interface CreateEventAction extends BaseAction {
  action: "create_event";
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM (24-hour)
  end: string; // HH:MM (24-hour)
  description?: string;
  color?: "violet" | "blue" | "emerald" | "pink" | "amber";
}

export interface UpdateEventAction extends BaseAction {
  action: "update_event";
  originalTitle: string; // Used by planner engine to locate the event
  newTitle?: string;
  newDate?: string;
  newStart?: string;
  newEnd?: string;
  newDescription?: string;
  newColor?: "violet" | "blue" | "emerald" | "pink" | "amber";
  newPriority?: "low" | "medium" | "high" | "do_it_now";
  newNote?: string;
  newChecklistItem?: string;
}

export interface DeleteEventAction extends BaseAction {
  action: "delete_event";
  title: string; // Used to identify which event to delete
}

export interface MarkCompleteAction extends BaseAction {
  action: "mark_complete";
  title: string;
}

export interface FetchScheduleAction extends BaseAction {
  action: "fetch_schedule";
  targetDate: string; // YYYY-MM-DD
}

export interface ErrorAction extends BaseAction {
  action: "error";
  message: string;
}

export type PlannerAction = 
  | CreateEventAction 
  | UpdateEventAction 
  | DeleteEventAction 
  | MarkCompleteAction 
  | FetchScheduleAction
  | ErrorAction;

export interface AISuggestion {
  reasoning: string;
  proposed_changes: PlannerAction[];
}

export interface AIAnalysisResult {
  summary: string;
  warnings: string[];
  conflicts: string[];
  free_time: string[];
  suggestions: AISuggestion[];
  requires_confirmation?: boolean;
  clarification_request?: {
    question: string;
    type: "selection" | "input";
    options?: string[];
  };
  isError?: boolean;
  errorMessage?: string;
}
