import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase/firebaseService";
import { CalendarEvent } from "@/types";

export const plannerService = {
  getEventsCollection(uid: string) {
    return collection(db, "events", uid, "userEvents");
  },

  getEventDoc(uid: string, eventId: string) {
    return doc(db, "events", uid, "userEvents", eventId);
  },

  async createEvent(uid: string, event: CalendarEvent): Promise<void> {
    const eventRef = this.getEventDoc(uid, event.id);
    const sanitizedEvent = Object.fromEntries(Object.entries(event).filter(([_, v]) => v !== undefined));
    await setDoc(eventRef, {
      ...sanitizedEvent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async updateEvent(uid: string, event: CalendarEvent): Promise<void> {
    const eventRef = this.getEventDoc(uid, event.id);
    const sanitizedEvent = Object.fromEntries(Object.entries(event).filter(([_, v]) => v !== undefined));
    await updateDoc(eventRef, {
      ...sanitizedEvent,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteEvent(uid: string, eventId: string): Promise<void> {
    const eventRef = this.getEventDoc(uid, eventId);
    await deleteDoc(eventRef);
  },

  subscribeToEvents(uid: string, onUpdate: (events: CalendarEvent[]) => void, onError: (err: Error) => void) {
    const eventsQuery = query(this.getEventsCollection(uid));
    
    return onSnapshot(
      eventsQuery, 
      (snapshot) => {
        const events: CalendarEvent[] = [];
        snapshot.forEach((docSnap) => {
          events.push(docSnap.data() as CalendarEvent);
        });
        onUpdate(events);
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        onError(error);
      }
    );
  },

  async migrateEvents(uid: string, localEvents: CalendarEvent[]): Promise<void> {
    const batch = writeBatch(db);
    for (const event of localEvents) {
      const eventRef = this.getEventDoc(uid, event.id);
      batch.set(eventRef, {
        ...event,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
};
