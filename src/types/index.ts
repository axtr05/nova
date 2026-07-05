export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO String format (e.g., "2026-07-05T09:00:00.000Z")
  end: string;   // ISO String format (e.g., "2026-07-05T10:30:00.000Z")
  color?: string; // Predefined color keys for tailwind (e.g., 'violet', 'blue', 'pink', 'emerald')
}

export type ViewType = "week" | "day";
