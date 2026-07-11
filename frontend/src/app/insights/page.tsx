"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/frontend/components/ProtectedRoute";
import { useEvents } from "@/frontend/hooks/useEvents";
import { useMemories } from "@/frontend/hooks/useMemories";
import { analyticsService } from "@/services/analytics/analyticsService";
import { useAuth } from "@/frontend/contexts/AuthContext";
import { AIWeeklyReport } from "@/types";
import { format } from "date-fns";
import { Sparkles, ArrowLeft, Target, TrendingUp, Clock, Calendar, CheckCircle2, Battery, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { toast } from "sonner";

export default function InsightsPage() {
  const { events, isLoaded: eventsLoaded } = useEvents();
  const { memories, isLoaded: memoriesLoaded } = useMemories();
  const { user } = useAuth();

  const [aiReport, setAiReport] = useState<AIWeeklyReport | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const summary = useMemo(() => {
    if (!eventsLoaded) return null;
    return analyticsService.getWeeklySummary(events);
  }, [events, eventsLoaded]);

  const chartData = useMemo(() => {
    if (!eventsLoaded || !memoriesLoaded) return [];
    return analyticsService.getChartData(events, memories);
  }, [events, memories, eventsLoaded, memoriesLoaded]);

  const handleGenerateAIReport = async () => {
    if (!summary || chartData.length === 0) return;
    setIsGeneratingAI(true);
    try {
      // Just pass the 15 most recent/important memories to keep payload size down
      const topMemories = memories.slice(0, 15).map(m => ({
        title: m.title,
        content: m.content,
        category: m.category,
        importance: m.importance
      }));

      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          chartData,
          memories: topMemories,
          aiModels: user?.aiModels
        })
      });

      if (!res.ok) throw new Error("Failed to generate report");
      
      const data = await res.json() as AIWeeklyReport;
      setAiReport(data);
      toast.success("AI Report Generated", { description: "Your weekly insights are ready." });
    } catch (error) {
      console.error(error);
      toast.error("Generation Failed", { description: "Could not generate AI report." });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (!eventsLoaded || !memoriesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 flex-col gap-4 text-slate-300">
        <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-nova animate-pulse">
          <span className="h-6 w-6 rounded-full bg-white/20 animate-ping" />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase text-slate-500 font-mono">
          Loading Analytics...
        </span>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950/60 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Glows */}
        <div className="absolute top-0 right-1/4 h-[400px] w-[500px] bg-blue-900/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-0 h-[300px] w-[400px] bg-violet-900/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Weekly Intelligence
                  <span className="text-xs uppercase font-bold bg-blue-500/15 border border-blue-500/25 px-2 py-0.5 rounded-md text-blue-300">
                    Insights
                  </span>
                </h1>
                <p className="text-sm font-medium text-slate-400">
                  {format(new Date(), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerateAIReport}
              disabled={isGeneratingAI}
              className="h-10 px-5 rounded-xl bg-gradient-nova hover:bg-gradient-nova-hover text-white font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingAI ? <Sparkles className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
              {isGeneratingAI ? "Analyzing..." : "Generate AI Report"}
            </button>
          </div>

          {/* Top Metrics Row */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard 
                title="Completion Rate" 
                value={`${summary.completionRate}%`} 
                icon={<Target className="h-4 w-4 text-emerald-400" />} 
                subtext={`${summary.completedEvents} / ${summary.completedEvents + summary.pendingEvents} tasks`}
              />
              <MetricCard 
                title="Focus Hours" 
                value={`${summary.totalFocusHours}h`} 
                icon={<Clock className="h-4 w-4 text-violet-400" />} 
                subtext="Total deep work"
              />
              <MetricCard 
                title="AI Score" 
                value={summary.aiProductivityScore.toString()} 
                icon={<Sparkles className="h-4 w-4 text-amber-400" />} 
                subtext="Overall efficiency"
              />
              <MetricCard 
                title="Free Time" 
                value={`${summary.freeTimeHours}h`} 
                icon={<Battery className="h-4 w-4 text-blue-400" />} 
                subtext="Estimated recovery"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Charts */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="glass-card rounded-2xl border border-white/5 p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-400" /> Productivity Trend (Focus Hours)
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="focus" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-white/5 p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Task Completion
                </h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                      <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="pending" name="Pending" stackId="a" fill="#334155" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Right Column: AI Report */}
            <div className="flex flex-col gap-6">
              
              {aiReport ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl border border-white/5 p-6 space-y-6 flex-1 bg-gradient-to-b from-white/5 to-transparent"
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Weekly Summary</h3>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      {aiReport.weeklySummary}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Biggest Achievement</h4>
                      <p className="text-xs text-slate-300">{aiReport.biggestAchievement}</p>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Area for Growth</h4>
                      <p className="text-xs text-slate-300">{aiReport.biggestWeakness}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Smart Insights</h3>
                    <ul className="space-y-2">
                      {aiReport.smartInsights.map((insight, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                          <Sparkles className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Burnout Risk</span>
                      <span className={`text-sm font-bold ${
                        aiReport.burnoutRisk === "High" ? "text-rose-400" :
                        aiReport.burnoutRisk === "Medium" ? "text-amber-400" : "text-emerald-400"
                      }`}>{aiReport.burnoutRisk}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Recovery Score</span>
                      <span className="text-sm font-bold text-blue-400">{aiReport.recoveryScore}/100</span>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="glass-card rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                  <div className="p-3 bg-gradient-nova rounded-2xl mb-4 shadow-lg shadow-violet-500/20">
                    <BrainCircuit className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">AI Intelligence Report</h3>
                  <p className="text-sm text-slate-400 font-medium max-w-[200px]">
                    Click generate to analyze your week, spot patterns, and optimize your schedule.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}

function MetricCard({ title, value, icon, subtext }: { title: string; value: string; icon: React.ReactNode; subtext: string }) {
  return (
    <div className="glass-card rounded-2xl border border-white/5 p-4 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity scale-150">
        {icon}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-white/10 rounded-lg">{icon}</div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <div className="text-2xl font-black text-white mb-1 font-mono">{value}</div>
      <div className="text-[10px] font-semibold text-slate-500">{subtext}</div>
    </div>
  );
}
