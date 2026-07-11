import { GoogleAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export let isPopupActive = false;

const setPopupActive = (active: boolean) => {
  isPopupActive = active;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event('nova:popup-state-change'));
  }
};

const TOKEN_KEY = "nova_google_calendar_token";
const EXPIRES_KEY = "nova_google_calendar_expires";

const setLocalToken = (token: string, expiresInMs: number = 3500 * 1000) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_KEY, (Date.now() + expiresInMs).toString());
};

export const connectCalendarProvider = async (forcePrompt: boolean = true) => {
  if (isPopupActive) {
    throw new Error("Calendar connection is already in progress.");
  }
  setPopupActive(true);
  
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
    
    // Tokens are persisted securely in localStorage with expiration.
    setLocalToken(accessToken);
    
    return { accessToken, user: result.user };
  } catch (error) {
    console.error("Failed to connect Google Calendar:", error);
    throw error;
  } finally {
    setPopupActive(false);
  }
};

export const getCalendarAccessToken = async (isUserInteraction = false): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = localStorage.getItem(EXPIRES_KEY);
  if (!token || !expires) return null;
  
  if (Date.now() > parseInt(expires, 10)) {
    try {
      // Attempt silent re-auth. Will only work if triggered by user interaction
      // otherwise the browser will throw a popup-blocked error.
      const result = await connectCalendarProvider(false);
      return result.accessToken;
    } catch (e: any) {
      console.warn("[SYNC] Silent re-authorization failed:", e);
      if (e?.code === 'auth/popup-blocked' || e?.message?.includes('popup') || !isUserInteraction) {
        // Just return null, pausing sync without forcing a full disconnect
        return null;
      }
      clearCalendarAccessToken();
      return null;
    }
  }
  return token;
};

export const hasValidCalendarToken = (): boolean => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = localStorage.getItem(EXPIRES_KEY);
  if (!token || !expires) return false;
  return Date.now() < parseInt(expires, 10);
};

export const clearCalendarAccessToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
};

export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  status: string;
  updated?: string;
  iCalUID?: string;
  htmlLink?: string;
}

export const fetchGoogleEvents = async (timeMin: string, timeMax: string, isUserInteraction = false): Promise<GoogleEvent[]> => {
  const token = await getCalendarAccessToken(isUserInteraction);
  if (!token) throw new Error("No Google Calendar access token found.");

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.append('timeMin', timeMin);
  url.searchParams.append('timeMax', timeMax);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('showDeleted', 'true');
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

export const createGoogleEvent = async (event: Partial<GoogleEvent>, isUserInteraction = true): Promise<GoogleEvent> => {
  const token = await getCalendarAccessToken(isUserInteraction);
  if (!token) throw new Error("No Google Calendar access token found.");

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!res.ok) {
    let errorBody = "";
    try {
      errorBody = await res.text();
    } catch(e) {}
    console.error("[NOVA→GOOGLE] Failed to create event", {
      status: res.status,
      body: errorBody,
      payload: event
    });
    if (res.status === 401) {
      clearCalendarAccessToken();
      throw new Error("Calendar access token expired. Please reconnect.");
    }
    throw new Error(`Failed to create Google Calendar event. Status: ${res.status}. Body: ${errorBody}`);
  }
  
  const createdEvent = await res.json();
  console.log("[NOVA→GOOGLE] Successfully created event", {
    status: res.status,
    eventId: createdEvent.id,
    payload: event
  });
  return createdEvent;
};

export const updateGoogleEvent = async (eventId: string, event: Partial<GoogleEvent>, isUserInteraction = true): Promise<GoogleEvent> => {
  const token = await getCalendarAccessToken(isUserInteraction);
  if (!token) throw new Error("No Google Calendar access token found.");

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!res.ok) {
    let errorBody = "";
    try {
      errorBody = await res.text();
    } catch(e) {}
    console.error("[NOVA→GOOGLE] Failed to update event", {
      status: res.status,
      body: errorBody,
      eventId: eventId,
      payload: event
    });
    if (res.status === 401) {
      clearCalendarAccessToken();
      throw new Error("Calendar access token expired. Please reconnect.");
    }
    throw new Error(`Failed to update Google Calendar event. Status: ${res.status}. Body: ${errorBody}`);
  }
  
  const updatedEvent = await res.json();
  console.log("[NOVA→GOOGLE] Successfully updated event", {
    status: res.status,
    eventId: updatedEvent.id,
    payload: event
  });
  return updatedEvent;
};

export const deleteGoogleEvent = async (eventId: string, isUserInteraction = true): Promise<void> => {
  const token = await getCalendarAccessToken(isUserInteraction);
  if (!token) throw new Error("No Google Calendar access token found.");

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 410) { 
    let errorBody = "";
    try {
      errorBody = await res.text();
    } catch(e) {}
    console.error("[NOVA→GOOGLE] Failed to delete event", {
      status: res.status,
      body: errorBody,
      eventId: eventId
    });
    if (res.status === 401) {
      clearCalendarAccessToken();
      throw new Error("Calendar access token expired. Please reconnect.");
    }
    throw new Error(`Failed to delete Google Calendar event. Status: ${res.status}. Body: ${errorBody}`);
  }
  
  console.log("[NOVA→GOOGLE] Successfully deleted event", {
    status: res.status,
    eventId: eventId
  });
};
