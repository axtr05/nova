import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

let isPopupActive = false;
let inMemoryToken: string | null = null;

export const connectCalendarProvider = async (forcePrompt: boolean = true) => {
  if (isPopupActive) {
    throw new Error("Calendar connection is already in progress.");
  }
  isPopupActive = true;
  
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope(CALENDAR_SCOPE);
  
  const customParams: Record<string, string> = {};
  
  if (forcePrompt) {
    customParams.prompt = 'consent';
  }
  
  if (auth.currentUser?.email) {
    customParams.login_hint = auth.currentUser.email;
  }
  
  provider.setCustomParameters(customParams);

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    
    if (!accessToken) {
      throw new Error("Failed to retrieve Google Access Token.");
    }
    
    // Tokens are kept strictly in memory for security per requirements.
    inMemoryToken = accessToken;
    
    return { accessToken, user: result.user };
  } catch (error) {
    console.error("Failed to connect Google Calendar:", error);
    throw error;
  } finally {
    isPopupActive = false;
  }
};

export const getCalendarAccessToken = async (): Promise<string | null> => {
  return inMemoryToken;
};

export const hasValidCalendarToken = (): boolean => {
  return inMemoryToken !== null;
};

export const clearCalendarAccessToken = () => {
  inMemoryToken = null;
};

export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status: string;
  updated?: string;
}

export const fetchGoogleEvents = async (timeMin: string, timeMax: string): Promise<GoogleEvent[]> => {
  const token = await getCalendarAccessToken();
  if (!token) throw new Error("No Google Calendar access token found.");

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.append('timeMin', timeMin);
  url.searchParams.append('timeMax', timeMax);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearCalendarAccessToken();
      throw new Error("Calendar access token expired. Please reconnect.");
    }
    throw new Error("Failed to fetch Google Calendar events.");
  }

  const data = await res.json();
  return data.items || [];
};

export const createGoogleEvent = async (event: Partial<GoogleEvent>): Promise<GoogleEvent> => {
  const token = await getCalendarAccessToken();
  if (!token) throw new Error("No Google Calendar access token found.");

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!res.ok) throw new Error("Failed to create Google Calendar event.");
  return res.json();
};

export const updateGoogleEvent = async (eventId: string, event: Partial<GoogleEvent>): Promise<GoogleEvent> => {
  const token = await getCalendarAccessToken();
  if (!token) throw new Error("No Google Calendar access token found.");

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!res.ok) throw new Error("Failed to update Google Calendar event.");
  return res.json();
};

export const deleteGoogleEvent = async (eventId: string): Promise<void> => {
  const token = await getCalendarAccessToken();
  if (!token) throw new Error("No Google Calendar access token found.");

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 410) { 
    throw new Error("Failed to delete Google Calendar event.");
  }
};
