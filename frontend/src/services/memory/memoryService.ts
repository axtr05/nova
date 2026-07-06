import { db } from "@/frontend/lib/firebase/config";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
import { Memory } from "@/types";

export const memoryService = {
  // We don't need a getMemories array return function here because useMemories will use onSnapshot
  // But we provide the CRUD mutation methods.

  async addMemory(userId: string, memory: Memory): Promise<void> {
    if (!userId) throw new Error("User ID is required to add a memory.");
    const memoryRef = doc(db, "users", userId, "memory", memory.id);
    
    // Clean undefined fields to avoid Firestore errors
    const cleanedMemory = Object.fromEntries(
      Object.entries(memory).filter(([_, v]) => v !== undefined)
    );

    await setDoc(memoryRef, cleanedMemory);
  },

  async updateMemory(userId: string, memoryId: string, updates: Partial<Memory>): Promise<void> {
    if (!userId) throw new Error("User ID is required to update a memory.");
    const memoryRef = doc(db, "users", userId, "memory", memoryId);
    
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await updateDoc(memoryRef, cleanedUpdates);
  },

  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    if (!userId) throw new Error("User ID is required to delete a memory.");
    const memoryRef = doc(db, "users", userId, "memory", memoryId);
    await deleteDoc(memoryRef);
  }
};
