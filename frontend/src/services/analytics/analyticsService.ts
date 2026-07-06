import { CalendarEvent, Memory, AnalyticsSummary, ChartDataPoint } from "@/types";
import { format, differenceInMinutes, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

export const analyticsService = {
  getWeeklySummary(events: CalendarEvent[], targetDate: Date = new Date()): AnalyticsSummary {
    const start = startOfWeek(targetDate, { weekStartsOn: 1 });
    const end = endOfWeek(targetDate, { weekStartsOn: 1 });
    
    const weeklyEvents = events.filter(e => {
      const eDate = parseISO(e.start);
      return eDate >= start && eDate <= end;
    });

    let completedEvents = 0;
    let pendingEvents = 0;
    let totalFocusMinutes = 0;
    let workoutMinutes = 0;
    let studyMinutes = 0;

    weeklyEvents.forEach(e => {
      if (e.completed) completedEvents++;
      else pendingEvents++;

      const eStart = parseISO(e.start);
      const eEnd = parseISO(e.end);
      const duration = differenceInMinutes(eEnd, eStart);

      // Heuristic for categorizing based on title or tags
      const titleLower = e.title.toLowerCase();
      const tagsLower = e.tags?.map(t => t.toLowerCase()) || [];
      const content = [titleLower, ...tagsLower].join(" ");

      if (content.includes("workout") || content.includes("gym") || content.includes("run") || content.includes("exercise")) {
        workoutMinutes += duration;
      } else if (content.includes("study") || content.includes("read") || content.includes("learn") || content.includes("code") || content.includes("work")) {
        studyMinutes += duration;
      } else {
        // general focus
        totalFocusMinutes += duration;
      }
    });

    const completionRate = weeklyEvents.length > 0 
      ? Math.round((completedEvents / weeklyEvents.length) * 100) 
      : 0;
    
    // Free time estimation (assuming 16 wake hours per day = 112 hours/week)
    const totalTrackedHours = (totalFocusMinutes + workoutMinutes + studyMinutes) / 60;
    const freeTimeHours = Math.max(0, 112 - totalTrackedHours);
    
    // Simple AI score formula
    const aiProductivityScore = Math.min(100, Math.round(
      (completionRate * 0.5) + 
      (Math.min(workoutMinutes / 60, 5) * 4) + // up to 20 pts for 5h workout
      (Math.min(studyMinutes / 60, 20) * 1.5) // up to 30 pts for 20h study
    ));

    return {
      completedEvents,
      pendingEvents,
      completionRate,
      totalFocusHours: Math.round((totalFocusMinutes / 60) * 10) / 10,
      workoutHours: Math.round((workoutMinutes / 60) * 10) / 10,
      studyHours: Math.round((studyMinutes / 60) * 10) / 10,
      freeTimeHours: Math.round(freeTimeHours * 10) / 10,
      aiProductivityScore
    };
  },

  getChartData(events: CalendarEvent[], memories: Memory[], targetDate: Date = new Date()): ChartDataPoint[] {
    const start = startOfWeek(targetDate, { weekStartsOn: 1 });
    const end = endOfWeek(targetDate, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      // Filter events for this day
      const dayEvents = events.filter(e => isSameDay(parseISO(e.start), day));
      
      let completed = 0;
      let pending = 0;
      let focusMins = 0;
      
      dayEvents.forEach(e => {
        if (e.completed) completed++;
        else pending++;
        
        focusMins += differenceInMinutes(parseISO(e.end), parseISO(e.start));
      });

      // Find daily review memory for this day if it exists
      // Daily reviews have source: "Daily Review 2026-07-06"
      const dateStr = format(day, "yyyy-MM-dd");
      const dailyReviewMemory = memories.find(m => m.source?.includes(dateStr));
      
      // We don't explicitly store mood/energy in the Memory object separately, 
      // but if we parse the content or if we update the schema later, we could extract it.
      // For now, let's use a synthetic metric if missing, or attempt to extract it from the memory text.
      // E.g., "Energy: 8/10, Mood: 7/10"
      let mood = 5;
      let energy = 5;
      
      if (dailyReviewMemory) {
        // Very basic extraction logic if we assume the memory content contains the text
        // In a real app we'd store these as dedicated fields in Firestore for analytics.
        const energyMatch = dailyReviewMemory.content.match(/Energy:\s*(\d+)/i);
        const moodMatch = dailyReviewMemory.content.match(/Mood:\s*(\d+)/i);
        if (energyMatch) energy = parseInt(energyMatch[1]);
        if (moodMatch) mood = parseInt(moodMatch[1]);
      } else {
        // Just return undefined or 0 to show gaps in the chart
        mood = 0;
        energy = 0;
      }

      return {
        date: format(day, "EEE"), // Mon, Tue, Wed
        completed,
        pending,
        focus: Math.round(focusMins / 60 * 10) / 10,
        mood: mood || undefined,
        energy: energy || undefined
      };
    });
  }
};
