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

// Demo data generator for initial projects with 6 months of history
const createDemoProjects = (): Project[] => {
  const now = new Date().toISOString();
  const today = new Date();

  const getMonday = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  };

  const getWeeksAgo = (weeks: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - weeks * 7);
    return getMonday(d);
  };

  const formatDate = (weeksAgo: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - weeksAgo * 7);
    return d.toISOString().split('T')[0];
  };

  const generateUpdates = (
    startWeeksAgo: number,
    startProgress: number,
    endProgress: number,
    projectId: string,
    accomplishmentsList: string[][],
    challengesList: string[][]
  ): WeeklyUpdate[] => {
    const updates: WeeklyUpdate[] = [];
    const totalWeeks = startWeeksAgo + 1;
    const progressPerWeek = (endProgress - startProgress) / totalWeeks;

    for (let i = startWeeksAgo; i >= 0; i--) {
      const weekIndex = startWeeksAgo - i;
      const progress = Math.min(100, Math.max(0, Math.round(startProgress + progressPerWeek * weekIndex)));

      updates.push({
        id: `${projectId}-update-${weekIndex}`,
        weekDate: getWeeksAgo(i),
        accomplishments: accomplishmentsList[weekIndex % accomplishmentsList.length] || [],
        nextSteps: ['متابعة العمل على المهام المتبقية', 'مراجعة التقدم مع الفريق'],
        progress,
        estimatedCompletion: formatDate(-12),
        challenges: challengesList[weekIndex % challengesList.length] || [],
        supportNeeded: weekIndex % 3 === 0 ? 'دعم من الإدارة' : '',
        notes: `تحديث الأسبوع ${weekIndex + 1}`,
        createdAt: now,
      });
    }
    return updates;
  };

  return [
    {
      id: 'demo-project-1',
      name: 'تطوير نظام إدارة المحتوى',
      description: 'بناء نظام إدارة محتوى متكامل باستخدام React و Node.js',
      status: 'on_track',
      category: 'project',
      startDate: formatDate(26 * 7),
      targetEndDate: formatDate(-12 * 7),
      currentProgress: 85,
      owner: 'أحمد محمد',
      createdAt: now,
      updatedAt: now,
      weeklyUpdates: generateUpdates(25, 5, 85, 'p1',
        [['إعداد البنية التحتية للمشروع', 'تصميم قاعدة البيانات'], ['تطوير نماذج البيانات', 'إعداد بيئة التطوير'], ['تصميم واجهة المستخدم الأولية', 'تطوير API الأساسي'], ['تطوير نظام المصادقة', 'إضافة صلاحيات المستخدمين'], ['تطوير لوحة التحكم', 'إضافة إدارة المحتوى'], ['تحسين الأداء', 'إضافة الكاش'], ['اختبارات الوحدة', 'إصلاح الأخطاء'], ['تطوير نظام البحث', 'إضافة الفلاتر']],
        [['تحديات في التكامل مع الأنظمة القديمة'], [], ['تأخير في استلام التصاميم'], [], ['مشاكل في الأداء تم حلها'], [], [], ['حاجة لمراجعة أمنية']]
      ),
    },
    {
      id: 'demo-project-2',
      name: 'تحديث البنية التحتية السحابية',
      description: 'ترحيل الخوادم من AWS إلى Azure مع تحسين الأداء',
      status: 'at_risk',
      category: 'project',
      startDate: formatDate(17 * 7),
      targetEndDate: formatDate(-4 * 7),
      currentProgress: 45,
      owner: 'سارة أحمد',
      createdAt: now,
      updatedAt: now,
      weeklyUpdates: generateUpdates(16, 0, 45, 'p2',
        [['دراسة البنية الحالية', 'تحديد متطلبات الترحيل'], ['إعداد حساب Azure', 'تهيئة الشبكات الافتراضية'], ['ترحيل قاعدة البيانات التجريبية'], ['اختبارات الأداء الأولية'], ['ترحيل الخدمات المصغرة'], ['إعداد نظام المراقبة'], ['اختبارات الأمان'], ['تحسين إعدادات الشبكة']],
        [['تأخير في الموافقات الأمنية'], ['مشاكل في التوافق'], [], ['تكاليف أعلى من المتوقع'], ['تأخير في الجدول الزمني'], [], ['حاجة لتدريب الفريق'], []]
      ),
    },
    {
      id: 'demo-project-3',
      name: 'تطبيق الهاتف المحمول',
      description: 'تطوير تطبيق جوال متعدد المنصات باستخدام React Native',
      status: 'on_track',
      category: 'project',
      startDate: formatDate(22 * 7),
      targetEndDate: formatDate(-2 * 7),
      currentProgress: 92,
      owner: 'محمد علي',
      createdAt: now,
      updatedAt: now,
      weeklyUpdates: generateUpdates(21, 0, 92, 'p3',
        [['إعداد مشروع React Native', 'تصميم هيكل التطبيق'], ['تطوير شاشة تسجيل الدخول', 'إضافة المصادقة'], ['تطوير الشاشة الرئيسية'], ['إضافة التنقل بين الشاشات'], ['تطوير شاشة الملف الشخصي'], ['إضافة الإشعارات'], ['تحسين واجهة المستخدم'], ['اختبارات على iOS و Android']],
        [[], ['مشاكل في التوافق مع iOS'], [], [], ['تأخير بسيط في التصاميم'], [], [], ['أخطاء في الإشعارات تم حلها']]
      ),
    },
    {
      id: 'demo-index-1',
      name: 'مؤشر رضا العملاء',
      description: 'قياس وتتبع مستوى رضا العملاء عن الخدمات المقدمة',
      status: 'on_track',
      category: 'index',
      startDate: formatDate(26 * 7),
      targetEndDate: formatDate(-52 * 7),
      currentProgress: 78,
      owner: 'فاطمة حسن',
      createdAt: now,
      updatedAt: now,
      weeklyUpdates: generateUpdates(25, 45, 78, 'idx1',
        [['إجراء استبيان الرضا', 'تحليل النتائج'], ['إعداد تقرير شهري', 'مشاركة النتائج مع الإدارة'], ['متابعة شكاوى العملاء'], ['تحسين عملية الاستبيان'], ['إضافة أسئلة جديدة للاستبيان'], ['تحليل اتجاهات الرضا'], ['اقتراح تحسينات للخدمة'], ['مراجعة ردود الفعل']],
        [[], ['نسبة استجابة منخفضة'], [], [], [], ['تراجع طفيف في الرضا تم معالجته'], [], []]
      ),
    },
    {
      id: 'demo-project-4',
      name: 'منصة التعلم الإلكتروني',
      description: 'تطوير منصة للتعلم الإلكتروني مع دعم الفيديو والاختبارات',
      status: 'on_track',
      category: 'project',
      startDate: formatDate(9 * 7),
      targetEndDate: formatDate(-16 * 7),
      currentProgress: 28,
      owner: 'نورة السعيد',
      createdAt: now,
      updatedAt: now,
      weeklyUpdates: generateUpdates(8, 0, 28, 'p4',
        [['تحديد متطلبات المشروع', 'دراسة المنافسين'], ['تصميم قاعدة البيانات', 'إعداد البنية التحتية'], ['تطوير نظام المستخدمين'], ['إضافة نظام الدورات'], ['تطوير مشغل الفيديو'], ['إضافة نظام الاختبارات']],
        [[], [], ['تحديات في تخزين الفيديو'], [], [], []]
      ),
    },
    {
      id: 'demo-idea-1',
      name: 'نظام الذكاء الاصطناعي للدعم الفني',
      description: 'اقتراح تطوير chatbot ذكي للرد على استفسارات العملاء',
      status: 'on_hold',
      category: 'idea',
      startDate: formatDate(12 * 7),
      targetEndDate: formatDate(-26 * 7),
      currentProgress: 15,
      owner: 'خالد عبدالله',
      createdAt: now,
      updatedAt: now,
      weeklyUpdates: generateUpdates(11, 5, 15, 'idea1',
        [['إعداد دراسة جدوى أولية'], ['مقارنة الحلول المتاحة في السوق'], ['تقدير التكلفة والعائد'], ['عرض الفكرة على الإدارة'], ['في انتظار الموافقة'], ['مراجعة المتطلبات التقنية']],
        [['في انتظار الموافقة على الميزانية'], [], ['تأخير في الرد من الإدارة'], [], ['المشروع متوقف مؤقتاً'], []]
      ),
    },
    {
      id: 'demo-project-5',
      name: 'تحديث نظام الموارد البشرية',
      description: 'تحديث وتطوير نظام إدارة الموارد البشرية الداخلي',
      status: 'delayed',
      category: 'project',
      startDate: formatDate(13 * 7),
      targetEndDate: formatDate(-2 * 7),
      currentProgress: 35,
      owner: 'عمر حسين',
      createdAt: now,
      updatedAt: now,
      weeklyUpdates: generateUpdates(12, 0, 35, 'p5',
        [['تحليل النظام الحالي', 'جمع المتطلبات'], ['تصميم النظام الجديد'], ['تطوير وحدة الموظفين'], ['إضافة نظام الإجازات'], ['تطوير نظام الحضور'], ['اختبارات أولية']],
        [['نقص في الموارد البشرية'], ['تغيير في المتطلبات'], ['تأخير في الموافقات'], ['مشاكل تقنية'], ['إعادة العمل على بعض الأجزاء'], ['تأخير كبير في الجدول']]
      ),
    },
  ] as Project[];
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: createDemoProjects(),
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
