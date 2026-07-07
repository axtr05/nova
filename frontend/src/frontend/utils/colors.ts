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
