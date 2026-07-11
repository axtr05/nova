export const getCategoryAndColor = (title: string): { category: string, color: string } => {
  const t = title.toLowerCase();
  
  if (/(gym|run|running|cycl|swim|strength|workout|lift)/.test(t)) {
    return { category: "Workout", color: "emerald" };
  }
  
  if (/(study|college|assignment|exam|contest|leetcode|codeforces|gate|research)/.test(t)) {
    return { category: "Study", color: "blue" };
  }
  
  if (/(meet|call|interview|discuss|client|office)/.test(t)) {
    return { category: "Meeting", color: "violet" };
  }
  
  if (/(project|dev|coding|github|nova|axiom|design)/.test(t)) {
    return { category: "Project", color: "cyan" };
  }
  
  if (/(shop|grocer|bank|bill|travel|errand)/.test(t)) {
    return { category: "Shopping", color: "orange" };
  }
  
  if (/(family|friend|birthday|journal|read|meditat)/.test(t)) {
    return { category: "Personal", color: "pink" };
  }
  
  if (/(doctor|medicine|hospital|recover)/.test(t)) {
    return { category: "Health", color: "red" };
  }
  
  return { category: "Unknown", color: "violet" };
};

export const resolveColor = (event: { color?: string, isManualColor?: boolean, title: string }): string => {
  if (event.isManualColor && event.color) {
    return event.color;
  }
  if (event.color && event.color !== "violet") {
    // Treat non-default assigned colors (like from AI or sync) as valid unless overridden
    return event.color;
  }
  // Fallback to category color
  return getCategoryAndColor(event.title).color;
};

export const getColorClass = (color: string) => {
  switch (color) {
    case "emerald": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "blue": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "violet": return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    case "cyan": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    case "orange": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "pink": return "bg-pink-500/10 text-pink-400 border-pink-500/20";
    case "red": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "amber": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
};

export const getEventColorClasses = (color: string) => {
  switch (color) {
    case "blue":
      return "bg-blue-500/15 border-blue-500/35 text-blue-200 border-l-[3px] border-l-blue-500 hover:bg-blue-500/20";
    case "emerald":
      return "bg-emerald-500/15 border-emerald-500/35 text-emerald-200 border-l-[3px] border-l-emerald-500 hover:bg-emerald-500/20";
    case "pink":
      return "bg-pink-500/15 border-pink-500/35 text-pink-200 border-l-[3px] border-l-pink-500 hover:bg-pink-500/20";
    case "amber":
      return "bg-amber-500/15 border-amber-500/35 text-amber-200 border-l-[3px] border-l-amber-500 hover:bg-amber-500/20";
    case "cyan":
      return "bg-cyan-500/15 border-cyan-500/35 text-cyan-200 border-l-[3px] border-l-cyan-500 hover:bg-cyan-500/20";
    case "orange":
      return "bg-orange-500/15 border-orange-500/35 text-orange-200 border-l-[3px] border-l-orange-500 hover:bg-orange-500/20";
    case "red":
      return "bg-red-500/15 border-red-500/35 text-red-200 border-l-[3px] border-l-red-500 hover:bg-red-500/20";
    default: // violet
      return "bg-violet-500/15 border-violet-500/35 text-violet-200 border-l-[3px] border-l-violet-500 hover:bg-violet-500/20";
  }
};
