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
import { sanitizeFirestoreData } from "../firebase/firebaseService";

export const plannerService = {
  getEventsCollection(uid: string) {
    return collection(db, "events", uid, "userEvents");
  },

  getEventDoc(uid: string, eventId: string) {
    return doc(db, "events", uid, "userEvents", eventId);
  },

  async createEvent(uid: string, event: CalendarEvent): Promise<void> {
    const eventRef = this.getEventDoc(uid, event.id);
    const sanitizedEvent = sanitizeFirestoreData(event);
    await setDoc(eventRef, {
      ...sanitizedEvent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async updateEvent(uid: string, event: CalendarEvent): Promise<void> {
    const eventRef = this.getEventDoc(uid, event.id);
    const sanitizedEvent = sanitizeFirestoreData(event);
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
      const sanitizedEvent = sanitizeFirestoreData(event);
      batch.set(eventRef, {
        ...sanitizedEvent,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  },

  async batchUpsertEvents(uid: string, events: CalendarEvent[]): Promise<void> {
    const batch = writeBatch(db);
    for (const event of events) {
      const eventRef = this.getEventDoc(uid, event.id);
      const sanitizedEvent = sanitizeFirestoreData(event);
      batch.set(eventRef, {
        ...sanitizedEvent,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
  }
};
