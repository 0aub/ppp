// Get Monday of a given week
export const getWeekMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get current week's Monday as ISO string
export const getCurrentWeekMonday = (): string => {
  return getWeekMonday(new Date()).toISOString().split('T')[0];
};

// Format date for display
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Format week range for display
export const formatWeekRange = (mondayStr: string): string => {
  const monday = new Date(mondayStr);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const mondayFormatted = monday.toLocaleDateString('en-US', options);
  const sundayFormatted = sunday.toLocaleDateString('en-US', {
    ...options,
    year: 'numeric',
  });

  return `${mondayFormatted} - ${sundayFormatted}`;
};

// Get previous week
export const getPreviousWeek = (mondayStr: string): string => {
  const monday = new Date(mondayStr);
  monday.setDate(monday.getDate() - 7);
  return monday.toISOString().split('T')[0];
};

// Get next week
export const getNextWeek = (mondayStr: string): string => {
  const monday = new Date(mondayStr);
  monday.setDate(monday.getDate() + 7);
  return monday.toISOString().split('T')[0];
};

// Check if a week is in the future
export const isFutureWeek = (mondayStr: string): boolean => {
  const monday = new Date(mondayStr);
  const currentMonday = getWeekMonday(new Date());
  return monday > currentMonday;
};

// Get list of weeks for dropdown (past 12 weeks + current)
export const getWeekOptions = (): { value: string; label: string }[] => {
  const weeks: { value: string; label: string }[] = [];
  const currentMonday = getWeekMonday(new Date());

  for (let i = 0; i < 12; i++) {
    const monday = new Date(currentMonday);
    monday.setDate(monday.getDate() - i * 7);
    const value = monday.toISOString().split('T')[0];
    weeks.push({
      value,
      label: formatWeekRange(value),
    });
  }

  return weeks;
};
