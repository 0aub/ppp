export type ProjectStatus = 'on_track' | 'at_risk' | 'delayed' | 'completed' | 'on_hold';

export interface WeeklyUpdate {
  id: string;
  weekDate: string; // ISO date string for the week (e.g., "2024-01-08" for the week of Jan 8)
  accomplishments: string; // What was done since last week
  progress: number; // 0-100
  estimatedCompletion: string; // Expected completion date
  challenges: string; // Any blockers or challenges
  supportNeeded: string; // What support is needed
  notes: string; // Additional notes
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  targetEndDate: string;
  currentProgress: number; // 0-100
  owner: string;
  weeklyUpdates: WeeklyUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  projects: Project[];
  darkMode: boolean;
  currentWeek: string; // The week being viewed/edited
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  on_track: 'On Track',
  at_risk: 'At Risk',
  delayed: 'Delayed',
  completed: 'Completed',
  on_hold: 'On Hold',
};

export const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  on_track: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-300 dark:border-green-700' },
  at_risk: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' },
  delayed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700' },
  completed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700' },
  on_hold: { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-600' },
};
