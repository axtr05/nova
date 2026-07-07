"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase/firebaseService";
import { NovaUser } from "@/frontend/types/user";

interface AuthContextType {
  user: NovaUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NovaUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const isGoogle = firebaseUser.providerData.some(p => p.providerId === "google.com");
        
        let calendarConfigured: boolean | undefined = undefined;
        let syncMode: any = undefined;
        let lastSyncTime: string | undefined = undefined;
        let firestoreProfile: any = null;

        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            firestoreProfile = data.profile;
            calendarConfigured = data.settings?.calendarConfigured;
            syncMode = data.settings?.syncMode;
            lastSyncTime = data.settings?.lastSyncTime;
          }
        } catch (e) {
          console.error("Failed to fetch user from Firestore", e);
        }

        const novaUser: NovaUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          providerId: isGoogle ? "google.com" : "password",
          calendarConfigured,
          syncMode,
          lastSyncTime
        };
        
        // Remove undefined fields to prevent Firestore crashes
        const sanitizedNovaUser = Object.fromEntries(
          Object.entries(novaUser).filter(([_, v]) => v !== undefined)
        ) as NovaUser;
        
        setUser(sanitizedNovaUser);

        // Self-Healing Profile Sync
        const needsUpdate = !firestoreProfile ||
          firestoreProfile.displayName !== novaUser.displayName ||
          firestoreProfile.photoURL !== novaUser.photoURL ||
          firestoreProfile.email !== novaUser.email ||
          firestoreProfile.providerId !== novaUser.providerId;

        if (needsUpdate) {
          try {
            const userRef = doc(db, "users", firebaseUser.uid);
            // We only merge the profile segment so we don't overwrite settings accidentally
            await setDoc(userRef, { 
              profile: {
                displayName: novaUser.displayName || null,
                photoURL: novaUser.photoURL || null,
                email: novaUser.email || null,
                providerId: novaUser.providerId || null,
                uid: novaUser.uid || null
              }
            }, { merge: true });
          } catch (e) {
            console.error("Failed to sync user to Firestore", e);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
