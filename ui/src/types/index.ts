export type ProjectStatus = 'on_track' | 'at_risk' | 'delayed' | 'completed' | 'on_hold';

export type ProjectCategory = 'project' | 'index' | 'idea';

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  project: 'المشاريع',
  index: 'المؤشرات',
  idea: 'الأفكار المقترحة',
};

export interface WeeklyUpdate {
  id: string;
  weekDate: string; // ISO date string for the week (e.g., "2024-01-08" for the week of Jan 8)
  accomplishments: string | string[]; // What was done since last week (string for backward compatibility, array for list)
  nextSteps?: string[]; // What needs to be done next
  progress: number; // 0-100
  estimatedCompletion: string; // Expected completion date
  challenges: string | string[]; // Any blockers or challenges (string for backward compatibility, array for list)
  supportNeeded: string; // What support is needed
  notes: string; // Additional notes
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  category: ProjectCategory;
  startDate: string;
  targetEndDate: string;
  currentProgress: number; // 0-100
  owner: string;
  weeklyUpdates: WeeklyUpdate[];
  createdAt: string;
  updatedAt: string;
  isActiveInPresentation?: boolean; // Whether to show in presentation
  displayOrder?: number; // Order for display
}

export interface AppState {
  projects: Project[];
  darkMode: boolean;
  currentWeek: string; // The week being viewed/edited
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  on_track: 'على المسار الصحيح',
  at_risk: 'متعثر',
  delayed: 'متأخر',
  completed: 'مكتمل',
  on_hold: 'متوقف مؤقتاً',
};

export const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  on_track: { bg: 'bg-[#dceee2] dark:bg-[#1e5b39]/30', text: 'text-[#2b6a46] dark:text-[#7da98c]', border: 'border-[#7da98c] dark:border-[#2b6a46]' },
  at_risk: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' },
  delayed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700' },
  completed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700' },
  on_hold: { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-600' },
};

// Helper functions for normalizing data formats (string | string[])
export const normalizeToArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(item => item.trim());
  return value.split('\n').filter(line => line.trim());
};

export const normalizeToString = (value: string | string[] | undefined): string => {
  if (!value) return '';
  if (Array.isArray(value)) return value.filter(item => item.trim()).join('\n');
  return value;
};
