"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db, sanitizeFirestoreData } from "@/services/firebase/firebaseService";
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
    let innerUnsubscribe: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (innerUnsubscribe) innerUnsubscribe();
      
      if (firebaseUser) {
        const isGoogle = firebaseUser.providerData.some(p => p.providerId === "google.com");
        let unsubscribeSnapshot: () => void = () => {};

        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          unsubscribeSnapshot = onSnapshot(userRef, (userSnap) => {
            let googleCalendar: any = undefined;
            let calendarConfigured: boolean | undefined = undefined;
            let syncMode: any = undefined;
            let lastSyncTime: string | undefined = undefined;
            let aiModels: any = undefined;
            let firestoreProfile: any = null;

            if (userSnap.exists()) {
              const data = userSnap.data();
              firestoreProfile = data.profile;
              googleCalendar = data.settings?.googleCalendar;
              calendarConfigured = data.settings?.calendarConfigured;
              syncMode = data.settings?.syncMode;
              lastSyncTime = data.settings?.lastSyncTime;
              aiModels = data.settings?.aiModels;
            }

            const novaUser: NovaUser = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
              providerId: isGoogle ? "google.com" : "password",
              googleCalendar,
              calendarConfigured,
              syncMode,
              lastSyncTime,
              aiModels
            };
            
            const sanitizedNovaUser = Object.fromEntries(
              Object.entries(novaUser).filter(([_, v]) => v !== undefined)
            ) as NovaUser;
            
            setUser(sanitizedNovaUser);

            const needsUpdate = !firestoreProfile ||
              firestoreProfile.displayName !== novaUser.displayName ||
              firestoreProfile.photoURL !== novaUser.photoURL ||
              firestoreProfile.email !== novaUser.email ||
              firestoreProfile.providerId !== novaUser.providerId;

            if (needsUpdate) {
              setDoc(userRef, sanitizeFirestoreData({ 
                profile: {
                  displayName: novaUser.displayName || null,
                  photoURL: novaUser.photoURL || null,
                  email: novaUser.email || null,
                  providerId: novaUser.providerId || null,
                  uid: novaUser.uid || null
                }
              }), { merge: true }).catch(e => console.error("Failed to sync user profile", e));
            }
            setLoading(false);
          });
          innerUnsubscribe = unsubscribeSnapshot;
        } catch (e) {
          console.error("Failed to setup user snapshot", e);
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      if (innerUnsubscribe) innerUnsubscribe();
      unsubscribe();
    };
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
