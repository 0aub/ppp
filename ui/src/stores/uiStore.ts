import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;

  // Dashboard customization
  dashboardTitle: string;
  dashboardSubtitle: string;
  organizationName: string;
  showCompletedProjects: boolean;

  // Setters
  setDashboardTitle: (title: string) => void;
  setDashboardSubtitle: (subtitle: string) => void;
  setOrganizationName: (name: string) => void;
  setShowCompletedProjects: (show: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Theme defaults
      darkMode: false,

      // Dashboard customization defaults
      dashboardTitle: 'عرض تقدم المشاريع',
      dashboardSubtitle: 'التقرير الأسبوعي',
      organizationName: '',
      showCompletedProjects: true,

      toggleDarkMode: () => {
        set((state) => {
          const newValue = !state.darkMode;
          if (newValue) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: newValue };
        });
      },

      setDarkMode: (value) => {
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: value });
      },

      setDashboardTitle: (title) => set({ dashboardTitle: title }),
      setDashboardSubtitle: (subtitle) => set({ dashboardSubtitle: subtitle }),
      setOrganizationName: (name) => set({ organizationName: name }),
      setShowCompletedProjects: (show) => set({ showCompletedProjects: show }),
    }),
    {
      name: 'ppp-ui-storage',
      onRehydrateStorage: () => (state) => {
        // Apply dark mode on page load
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
