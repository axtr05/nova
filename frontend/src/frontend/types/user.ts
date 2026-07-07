export type SyncMode = 'none' | 'import_once' | 'google_to_nova' | 'nova_to_google' | 'two_way';

export interface NovaUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
  providerId?: string; // e.g. "google.com" or "password"
  calendarConfigured?: boolean;
  syncMode?: SyncMode;
  lastSyncTime?: string;
}
