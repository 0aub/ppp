import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, WeeklyUpdate } from '../types';

// Helper to get current day
const getCurrentDay = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString().split('T')[0];
};

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface ProjectStore {
  projects: Project[];
  currentWeek: string;

  // Project CRUD
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'weeklyUpdates'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Weekly Updates
  addWeeklyUpdate: (projectId: string, update: Omit<WeeklyUpdate, 'id' | 'createdAt'>) => void;
  updateWeeklyUpdate: (projectId: string, updateId: string, changes: Partial<WeeklyUpdate>) => void;
  deleteWeeklyUpdate: (projectId: string, updateId: string) => void;

  // Week Navigation
  setCurrentWeek: (week: string) => void;

  // Presentation Management
  toggleProjectInPresentation: (id: string) => void;
  reorderProjects: (projects: Project[]) => void;

  // Get projects with updates for current week
  getProjectsForWeek: (week: string) => Project[];
  getProjectsWithUpdatesThisWeek: () => Project[];
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentWeek: getCurrentDay(),

      addProject: (projectData) => {
        const now = new Date().toISOString();
        const newProject: Project = {
          ...projectData,
          id: generateId(),
          weeklyUpdates: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ projects: [...state.projects, newProject] }));
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },

      addWeeklyUpdate: (projectId, updateData) => {
        const newUpdate: WeeklyUpdate = {
          ...updateData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  weeklyUpdates: [...p.weeklyUpdates, newUpdate],
                  currentProgress: updateData.progress,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      updateWeeklyUpdate: (projectId, updateId, changes) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  weeklyUpdates: p.weeklyUpdates.map((u) =>
                    u.id === updateId ? { ...u, ...changes } : u
                  ),
                  currentProgress: changes.progress ?? p.currentProgress,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      deleteWeeklyUpdate: (projectId, updateId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  weeklyUpdates: p.weeklyUpdates.filter((u) => u.id !== updateId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      setCurrentWeek: (week) => {
        set({ currentWeek: week });
      },

      toggleProjectInPresentation: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, isActiveInPresentation: !(p.isActiveInPresentation ?? true) }
              : p
          ),
        }));
      },

      reorderProjects: (newProjectsOrder) => {
        set({ projects: newProjectsOrder.map((p, index) => ({ ...p, displayOrder: index })) });
      },

      getProjectsForWeek: (week) => {
        return get().projects.filter((p) =>
          p.weeklyUpdates.some((u) => u.weekDate === week)
        );
      },

      getProjectsWithUpdatesThisWeek: () => {
        const week = get().currentWeek;
        return get().projects.filter((p) =>
          p.weeklyUpdates.some((u) => u.weekDate === week)
        );
      },
    }),
    {
      name: 'ppp-projects-storage',
    }
  )
);
