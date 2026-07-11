export type SyncMode = 'none' | 'import_once' | 'google_to_nova' | 'nova_to_google' | 'two_way';

export interface AIModelsSettings {
  planner: "AUTO" | string;
  analytics: "AUTO" | string;
  memory: "AUTO" | string;
  dailyReview: "AUTO" | string;
  globalOverride: string | null;
}

export interface GoogleCalendarConnection {
  connected: boolean;
  googleEmail?: string;
  syncMode: SyncMode;
  connectedAt?: string;
  lastSuccessfulSync?: string;
  syncEnabled: boolean;
}

export interface NovaUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
  providerId?: string; // e.g. "google.com" or "password"
  googleCalendar?: GoogleCalendarConnection;
  aiModels?: AIModelsSettings;
  
  // Legacy fields to be migrated/removed
  calendarConfigured?: boolean;
  syncMode?: SyncMode;
  lastSyncTime?: string;
}
