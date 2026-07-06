"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { loginWithGoogle, loginWithEmail, signUpWithEmail } from "@/frontend/lib/firebase/auth";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, User, Globe, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const [authLoading, setAuthLoading] = useState(false);

  // Skip login screen if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Welcome to NOVA", { description: "Signed in successfully with Google." });
      router.push("/");
    } catch (err: any) {
      if (err.code === "auth/popup-blocked") {
        toast.error("Popup Blocked", { description: "Please enable popups for this site to sign in with Google." });
      } else if (err.code === "auth/cancelled-popup-request" || err.code === "auth/popup-closed-by-user") {
        toast.error("Login Cancelled", { description: "Google sign-in popup was closed before completion." });
      } else {
        toast.error("Authentication Error", { description: err.message || "Failed to authenticate." });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Missing Fields", { description: "Please enter both email and password." });
      return;
    }
    if (isSignUp && !name.trim()) {
      toast.error("Missing Field", { description: "Please enter your name." });
      return;
    }

    setAuthLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        toast.success("Account Created", { description: "Your NOVA account has been registered." });
      } else {
        await loginWithEmail(email, password);
        toast.success("Welcome back", { description: "Successfully logged in." });
      }
      router.push("/");
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        toast.error("Invalid Credentials", { description: "The email or password you entered is incorrect." });
      } else if (err.code === "auth/email-already-in-use") {
        toast.error("Account Exists", { description: "This email address is already registered." });
      } else if (err.code === "auth/weak-password") {
        toast.error("Weak Password", { description: "Password should be at least 6 characters long." });
      } else {
        toast.error("Login Failed", { description: err.message || "An authentication error occurred." });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 flex-col gap-4 text-slate-300">
        <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-nova animate-pulse">
          <span className="h-6 w-6 rounded-full bg-white/20 animate-ping" />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase text-slate-500 font-mono">
          Redirecting to workspace...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 relative overflow-hidden px-4">
      {/* Background glow effects matching main page layout */}
      <div className="absolute top-10 left-1/4 h-[350px] w-[550px] bg-violet-900/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 h-[400px] w-[600px] bg-indigo-900/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[450px] z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-nova flex items-center justify-center shadow-lg shadow-violet-500/15 mb-3 border border-white/10">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            NOVA
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1.5">
            Your Premium AI-Powered Planning Workspace
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8 rounded-3xl border border-white/8 shadow-2xl shadow-black/80 flex flex-col gap-6">
          
          {/* Primary Action: Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/15 text-slate-200 hover:text-white text-sm font-bold transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4 text-violet-400" />
            )}
            Continue with Google
          </button>

          {/* Separation Divider */}
          <div className="flex items-center gap-4 py-1">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 select-none">
              or use email
            </span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-1.5 overflow-hidden"
                >
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Alex Mercer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={authLoading}
                      className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/3 border border-white/5 focus:border-violet-500/35 focus:bg-white/5 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:ring-0"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@workspace.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={authLoading}
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/3 border border-white/5 focus:border-violet-500/35 focus:bg-white/5 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:ring-0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authLoading}
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-white/3 border border-white/5 focus:border-violet-500/35 focus:bg-white/5 text-sm font-medium text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:ring-0"
                />
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-11 rounded-xl bg-gradient-nova hover:bg-gradient-nova-hover text-white text-sm font-bold shadow-md shadow-violet-500/10 hover:shadow-violet-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  {isSignUp ? "Create Workspace" : "Access Workspace"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Link */}
          <div className="text-center mt-2">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={authLoading}
              className="text-xs font-semibold text-slate-400 hover:text-violet-400 transition-colors cursor-pointer"
            >
              {isSignUp
                ? "Already have an account? Access Workspace"
                : "New to NOVA? Create a premium account"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
