// Get current date as ISO string (YYYY-MM-DD)
export const getCurrentDate = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().split('T')[0];
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

// Format single date for presentation (just the Monday)
export const formatPresentationDate = (mondayStr: string): string => {
  const monday = new Date(mondayStr);
  return monday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Get previous day
export const getPreviousDay = (dateStr: string): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

// Get next day
export const getNextDay = (dateStr: string): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

// Check if a date is in the future
export const isFutureWeek = (dateStr: string): boolean => {
  const selectedDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate > today;
};

// Get list of dates for dropdown (past 90 days + today)
export const getWeekOptions = (): { value: string; label: string }[] => {
  const dates: { value: string; label: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate dates from today going back 90 days (about 13 weeks)
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const value = date.toISOString().split('T')[0];
    dates.push({
      value,
      label: formatPresentationDate(value),
    });
  }

  return dates;
};
