"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 flex-col gap-4 text-slate-300">
        <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-nova animate-pulse">
          <span className="h-6 w-6 rounded-full bg-white/20 animate-ping" />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase text-slate-500 font-mono">
          Authenticating Session...
        </span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
