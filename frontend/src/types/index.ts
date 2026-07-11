export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type Priority = 'low' | 'medium' | 'high' | 'do_it_now';
export type EventSource = 'NOVA' | 'Google Calendar' | 'Imported' | 'AI Generated';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO String format
  end: string;   // ISO String format
  color?: string;
  isManualColor?: boolean;
  completed?: boolean;
  notes?: string;
  checklist?: ChecklistItem[];
  priority?: Priority;
  tags?: string[];
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    downloadURL: string;
    storagePath: string;
    uploadedAt: string;
  }[];
  aiSummary?: string;
  source?: EventSource;
  googleEventId?: string;
  externalId?: string;
  lastSyncHash?: string;
  updatedAt?: any; // Firestore Timestamp or string
}

export type ViewType = "week" | "day";

export type MemoryCategory = 
  | "Goal" 
  | "Habit" 
  | "Reminder" 
  | "Lesson" 
  | "Preference" 
  | "Project" 
  | "Deadline" 
  | "Health" 
  | "Study" 
  | "General";

export interface Memory {
  id: string;
  title: string;
  content: string;
  category: MemoryCategory;
  importance: number; // 1 to 10
  createdAt: string; // ISO String
  relatedEventIds?: string[];
  source?: string; // e.g., "Daily Review 2026-07-06"
  isPinned: boolean;
}

export interface DailyReviewInput {
  wentWell: string;
  didNotGoWell: string;
  energy: number; // 1 to 10
  mood: number; // 1 to 10
  rememberTomorrow: string;
  additionalNotes: string;
}

export interface AnalyticsSummary {
  completedEvents: number;
  pendingEvents: number;
  completionRate: number;
  totalFocusHours: number;
  workoutHours: number;
  studyHours: number;
  freeTimeHours: number;
  aiProductivityScore: number;
}

export interface ChartDataPoint {
  date: string;
  completed: number;
  pending: number;
  focus: number;
  mood?: number;
  energy?: number;
}

export interface AIWeeklyReport {
  weeklySummary: string;
  biggestAchievement: string;
  biggestWeakness: string;
  suggestedImprovements: string[];
  recommendedFocus: string;
  burnoutRisk: "Low" | "Medium" | "High";
  recoveryScore: number; // 1-100
  studyAnalysis: string;
  workoutAnalysis: string;
  smartInsights: string[];
}
