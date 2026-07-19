"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/frontend/lib/firebase/config";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { Memory } from "@/types";
import { memoryService } from "@/services/memory/memoryService";

export function useMemories() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setMemories([]);
      setIsLoaded(true);
      return;
    }

    const memoriesRef = collection(db, "users", user.uid, "memory");
    
    const unsubscribe = onSnapshot(
      memoriesRef,
      (snapshot) => {
        const fetchedMemories = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Memory[];
        
        // Sort memories: Pinned first, then by importance descending, then by newest
        fetchedMemories.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          if (a.importance !== b.importance) return b.importance - a.importance;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setMemories(fetchedMemories);
        setIsLoaded(true);
      },
      (error) => {
        console.error("Error fetching memories:", error);
        setIsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addMemory = async (memoryData: Omit<Memory, "id"> & { id?: string }) => {
    if (!user) return;
    const newMemory: Memory = {
      ...memoryData,
      id: memoryData.id || crypto.randomUUID()
    };
    await memoryService.addMemory(user.uid, newMemory);
  };

  const updateMemory = async (memoryData: Memory) => {
    if (!user) return;
    await memoryService.updateMemory(user.uid, memoryData.id, memoryData);
  };

  const deleteMemory = async (id: string) => {
    if (!user) return;
    await memoryService.deleteMemory(user.uid, id);
  };

  const deleteMultipleMemories = async (ids: string[]) => {
    if (!user) return;
    await Promise.all(ids.map(id => memoryService.deleteMemory(user.uid, id)));
  };

  const clearAllMemories = async () => {
    if (!user) return;
    await Promise.all(memories.map(m => memoryService.deleteMemory(user.uid, m.id)));
  };

  const togglePin = async (memory: Memory) => {
    if (!user) return;
    await memoryService.updateMemory(user.uid, memory.id, { isPinned: !memory.isPinned });
  };

  return {
    memories,
    isLoaded,
    addMemory,
    updateMemory,
    deleteMemory,
    deleteMultipleMemories,
    clearAllMemories,
    togglePin
  };
}
