import { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  FolderKanban,
  Calendar,
  User,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  Pause,
  TrendingUp,
  Settings,
  Search,
  SortAsc,
  SortDesc,
  ChevronDown,
  ChevronUp,
  History,
  Eye,
  EyeOff,
  GripVertical,
  PlusCircle,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { Project, ProjectStatus, ProjectCategory, STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS } from '../types';
import { colors, patterns } from '../utils/darkMode';
import { formatDate, formatWeekRange } from '../utils/dateUtils';
import DatePicker from '../components/DatePicker';

const statusIcons: Record<ProjectStatus, typeof CheckCircle2> = {
  on_track: TrendingUp,
  at_risk: AlertCircle,
  delayed: Clock,
  completed: CheckCircle2,
  on_hold: Pause,
};

const Projects = () => {
  const { projects, addProject, updateProject, deleteProject, toggleProjectInPresentation, reorderProjects, addWeeklyUpdate, currentWeek } = useProjectStore();
  const {
    dashboardTitle,
    setDashboardTitle,
    dashboardSubtitle,
    setDashboardSubtitle,
    organizationName,
    setOrganizationName,
    showCompletedProjects,
    setShowCompletedProjects,
  } = useUIStore();

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressProject, setProgressProject] = useState<Project | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'date' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'on_track' as ProjectStatus,
    category: 'project' as ProjectCategory,
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '',
    currentProgress: 0,
    owner: '',
  });

  // Progress form state
  const [progressFormData, setProgressFormData] = useState({
    status: 'on_track' as ProjectStatus,
    weekDate: new Date().toISOString().split('T')[0],
    accomplishments: [''],
    nextSteps: [''],
    challenges: [''],
    progress: 0,
    notes: '',
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredProjects.findIndex((p) => p.id === active.id);
      const newIndex = filteredProjects.findIndex((p) => p.id === over.id);

      const newOrder = arrayMove(filteredProjects, oldIndex, newIndex);
      reorderProjects(newOrder);
    }
  };

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter out completed if setting is off
    if (!showCompletedProjects) {
      result = result.filter((p) => p.status !== 'completed');
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.owner.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'progress':
          comparison = a.currentProgress - b.currentProgress;
          break;
        case 'date':
          const dateA = a.targetEndDate ? new Date(a.targetEndDate).getTime() : Infinity;
          const dateB = b.targetEndDate ? new Date(b.targetEndDate).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        case 'status':
          const statusOrder = { on_track: 1, at_risk: 2, delayed: 3, on_hold: 4, completed: 5 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [projects, searchQuery, statusFilter, sortBy, sortOrder, showCompletedProjects]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'on_track',
      category: 'project',
      startDate: new Date().toISOString().split('T')[0],
      targetEndDate: '',
      currentProgress: 0,
      owner: '',
    });
    setEditingProject(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      category: project.category,
      startDate: project.startDate,
      targetEndDate: project.targetEndDate,
      currentProgress: project.currentProgress,
      owner: project.owner,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (editingProject) {
      updateProject(editingProject.id, formData);
      toast.success('Project updated successfully');
    } else {
      addProject(formData);
      toast.success('Project created successfully');
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      deleteProject(project.id);
      toast.success('Project deleted');
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <div className={`${patterns.section} overflow-hidden`}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`w-full flex items-center justify-between p-4 ${colors.hover} transition`}
        >
          <div className="flex items-center gap-3">
            <Settings size={20} className={colors.primaryIcon} />
            <span className={`font-medium ${colors.textPrimary}`}>إعدادات لوحة التحكم</span>
          </div>
          {showSettings ? (
            <ChevronUp size={20} className={colors.textSecondary} />
          ) : (
            <ChevronDown size={20} className={colors.textSecondary} />
          )}
        </button>

        {showSettings && (
          <div className={`p-4 border-t ${colors.border} space-y-4`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  عنوان لوحة التحكم
                </label>
                <input
                  type="text"
                  value={dashboardTitle}
                  onChange={(e) => setDashboardTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                  placeholder="عرض تقدم المشاريع"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  العنوان الفرعي
                </label>
                <input
                  type="text"
                  value={dashboardSubtitle}
                  onChange={(e) => setDashboardSubtitle(e.target.value)}
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                  placeholder="التقرير الأسبوعي"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  اسم المؤسسة
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                  placeholder="اسم مؤسستك"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showCompleted"
                checked={showCompletedProjects}
                onChange={(e) => setShowCompletedProjects(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#367d56] focus:ring-[#4b8b66]"
              />
              <label htmlFor="showCompleted" className={`text-sm ${colors.textSecondary}`}>
                عرض المشاريع المكتملة في لوحة التحكم
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${colors.textPrimary}`}>المشاريع</h1>
          <p className={`mt-1 ${colors.textSecondary}`}>
            إدارة مشاريعك وتتبع تقدمها
          </p>
        </div>
        <button
          onClick={openAddModal}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 ${patterns.button}`}
        >
          <Plus size={20} />
          <span>إضافة مشروع</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      {projects.length > 0 && (
        <div className={`${patterns.section} p-4`}>
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.textTertiary}`}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="البحث عن المشاريع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 ${patterns.input}`}
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
              className={`px-4 py-2.5 ${patterns.input} min-w-[140px]`}
            >
              <option value="all">جميع الحالات</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className={`px-4 py-2.5 ${patterns.input}`}
              >
                <option value="name">ترتيب حسب الاسم</option>
                <option value="progress">ترتيب حسب التقدم</option>
                <option value="date">ترتيب حسب التاريخ</option>
                <option value="status">ترتيب حسب الحالة</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-2.5 rounded-lg ${colors.hover} border ${colors.border} transition`}
                title={sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc size={18} className={colors.textSecondary} />
                ) : (
                  <SortDesc size={18} className={colors.textSecondary} />
                )}
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className={`mt-3 text-sm ${colors.textTertiary}`}>
            عرض {filteredProjects.length} من {projects.length} مشروع
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className={`${patterns.section} p-12 text-center`}>
          <FolderKanban className={`mx-auto ${colors.textTertiary} mb-4`} size={48} />
          <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-2`}>لا توجد مشاريع بعد</h3>
          <p className={`${colors.textSecondary} mb-6`}>
            ابدأ بإنشاء مشروعك الأول
          </p>
          <button
            onClick={openAddModal}
            className={`inline-flex items-center gap-2 px-6 py-3 ${patterns.button}`}
          >
            <Plus size={20} />
            إنشاء مشروع
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className={`${patterns.section} p-12 text-center`}>
          <Search className={`mx-auto ${colors.textTertiary} mb-4`} size={48} />
          <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-2`}>لا توجد مشاريع مطابقة</h3>
          <p className={`${colors.textSecondary}`}>جرب تعديل البحث أو الفلاتر</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredProjects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4">
              {filteredProjects.map((project) => (
                <SortableProjectCard
                  key={project.id}
                  project={project}
                  expandedProjectId={expandedProjectId}
                  setExpandedProjectId={setExpandedProjectId}
                  setProgressProject={setProgressProject}
                  setProgressFormData={setProgressFormData}
                  setShowProgressModal={setShowProgressModal}
                  openEditModal={openEditModal}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className={`${colors.bgSecondary} rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${colors.border}`}>
              <h2 className={`text-xl font-bold ${colors.textPrimary}`}>
                {editingProject ? 'تعديل مشروع' : 'مشروع جديد'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-lg ${colors.hover} transition`}
              >
                <X size={20} className={colors.textSecondary} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  اسم المشروع *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                  placeholder="أدخل اسم المشروع"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2.5 ${patterns.input} resize-none`}
                  placeholder="وصف مختصر للمشروع"
                />
              </div>

              {/* Owner */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  المسؤول
                </label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                  placeholder="اسم المسؤول عن المشروع"
                />
              </div>

              {/* Category */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  التصنيف
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as ProjectCategory })
                  }
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  الحالة
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as ProjectStatus })
                  }
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`w-full px-4 py-2.5 ${patterns.input}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                    تاريخ الانتهاء المتوقع
                  </label>
                  <input
                    type="date"
                    value={formData.targetEndDate}
                    onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                    className={`w-full px-4 py-2.5 ${patterns.input}`}
                  />
                </div>
              </div>

              {/* Progress */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  التقدم الحالي: {formData.currentProgress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.currentProgress}
                  onChange={(e) =>
                    setFormData({ ...formData, currentProgress: parseInt(e.target.value) })
                  }
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2.5 rounded-lg border ${colors.border} ${colors.textSecondary} ${colors.hover} transition`}
                >
                  إلغاء
                </button>
                <button type="submit" className={`px-6 py-2.5 ${patterns.button}`}>
                  {editingProject ? 'حفظ التغييرات' : 'إنشاء مشروع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Progress Modal */}
      {showProgressModal && progressProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowProgressModal(false)}
        >
          <div
            className={`${colors.bgSecondary} rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${colors.bgSecondary} border-b ${colors.border} px-6 py-4 flex justify-between items-center`}>
              <h2 className={`text-xl font-bold ${colors.textPrimary}`}>
                إضافة تقدم - {progressProject.name}
              </h2>
              <button
                onClick={() => setShowProgressModal(false)}
                className={`p-2 rounded-lg ${colors.hover} transition`}
              >
                <X size={20} className={colors.textSecondary} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!progressProject) return;

                const filteredAccomplishments = progressFormData.accomplishments.filter(a => a.trim());
                const filteredNextSteps = progressFormData.nextSteps.filter(n => n.trim());
                const filteredChallenges = progressFormData.challenges.filter(c => c.trim());

                addWeeklyUpdate(progressProject.id, {
                  weekDate: progressFormData.weekDate,
                  accomplishments: filteredAccomplishments,
                  nextSteps: filteredNextSteps.length > 0 ? filteredNextSteps : undefined,
                  challenges: filteredChallenges,
                  progress: progressFormData.progress,
                  estimatedCompletion: progressProject.targetEndDate,
                  supportNeeded: '',
                  notes: progressFormData.notes,
                });

                // Update project status
                updateProject(progressProject.id, {
                  status: progressFormData.status,
                });

                toast.success('تم إضافة التقدم بنجاح');
                setShowProgressModal(false);
              }}
              className="p-6 space-y-4 overflow-y-auto"
            >
              {/* Date Picker */}
              <DatePicker
                label="تاريخ التحديث"
                value={progressFormData.weekDate}
                onChange={(date) => setProgressFormData({ ...progressFormData, weekDate: date })}
                maxDate={new Date().toISOString().split('T')[0]}
                showNavArrows={false}
              />

              {/* Status Selector */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${colors.textPrimary}`}>
                  الحالة
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => {
                    const statusColor = STATUS_COLORS[status];
                    const isSelected = progressFormData.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setProgressFormData({ ...progressFormData, status })}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                          isSelected
                            ? `${statusColor.bg} ${statusColor.text} ${statusColor.border}`
                            : `${colors.bgSecondary} ${colors.textSecondary} ${colors.border} hover:${colors.bgTertiary}`
                        }`}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress Percentage */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${colors.textPrimary}`}>
                  نسبة الإنجاز: {progressFormData.progress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressFormData.progress}
                  onChange={(e) =>
                    setProgressFormData({ ...progressFormData, progress: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              {/* Accomplishments */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${colors.textPrimary}`}>
                  ما تم إنجازه
                </label>
                {progressFormData.accomplishments.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newAccomplishments = [...progressFormData.accomplishments];
                        newAccomplishments[idx] = e.target.value;
                        setProgressFormData({ ...progressFormData, accomplishments: newAccomplishments });
                      }}
                      className={`flex-1 px-4 py-2 ${patterns.input}`}
                      placeholder={`إنجاز ${idx + 1}`}
                    />
                    {progressFormData.accomplishments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newAccomplishments = progressFormData.accomplishments.filter((_, i) => i !== idx);
                          setProgressFormData({ ...progressFormData, accomplishments: newAccomplishments });
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      >
                        <X size={20} className="text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setProgressFormData({
                      ...progressFormData,
                      accomplishments: [...progressFormData.accomplishments, ''],
                    })
                  }
                  className={`text-sm ${colors.primaryText} hover:underline`}
                >
                  + إضافة إنجاز
                </button>
              </div>

              {/* Next Steps */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${colors.textPrimary}`}>
                  الخطوات القادمة
                </label>
                {progressFormData.nextSteps.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newNextSteps = [...progressFormData.nextSteps];
                        newNextSteps[idx] = e.target.value;
                        setProgressFormData({ ...progressFormData, nextSteps: newNextSteps });
                      }}
                      className={`flex-1 px-4 py-2 ${patterns.input}`}
                      placeholder={`خطوة ${idx + 1}`}
                    />
                    {progressFormData.nextSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newNextSteps = progressFormData.nextSteps.filter((_, i) => i !== idx);
                          setProgressFormData({ ...progressFormData, nextSteps: newNextSteps });
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      >
                        <X size={20} className="text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setProgressFormData({
                      ...progressFormData,
                      nextSteps: [...progressFormData.nextSteps, ''],
                    })
                  }
                  className={`text-sm ${colors.primaryText} hover:underline`}
                >
                  + إضافة خطوة
                </button>
              </div>

              {/* Challenges */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${colors.textPrimary}`}>
                  التحديات الحالية
                </label>
                {progressFormData.challenges.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newChallenges = [...progressFormData.challenges];
                        newChallenges[idx] = e.target.value;
                        setProgressFormData({ ...progressFormData, challenges: newChallenges });
                      }}
                      className={`flex-1 px-4 py-2 ${patterns.input}`}
                      placeholder={`تحدي ${idx + 1}`}
                    />
                    {progressFormData.challenges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newChallenges = progressFormData.challenges.filter((_, i) => i !== idx);
                          setProgressFormData({ ...progressFormData, challenges: newChallenges });
                        }}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      >
                        <X size={20} className="text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setProgressFormData({
                      ...progressFormData,
                      challenges: [...progressFormData.challenges, ''],
                    })
                  }
                  className={`text-sm ${colors.primaryText} hover:underline`}
                >
                  + إضافة تحدي
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${colors.textPrimary}`}>
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  value={progressFormData.notes}
                  onChange={(e) =>
                    setProgressFormData({ ...progressFormData, notes: e.target.value })
                  }
                  className={`w-full px-4 py-2 ${patterns.input}`}
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-lg border ${colors.border} ${colors.textSecondary} hover:${colors.bgTertiary} transition`}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#367d56] hover:bg-[#2b6a46] text-white font-medium transition"
                >
                  حفظ التقدم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sortable Project Card Component
interface SortableProjectCardProps {
  project: Project;
  expandedProjectId: string | null;
  setExpandedProjectId: (id: string | null) => void;
  setProgressProject: (project: Project) => void;
  setProgressFormData: (data: any) => void;
  setShowProgressModal: (show: boolean) => void;
  openEditModal: (project: Project) => void;
  handleDelete: (project: Project) => void;
}

const SortableProjectCard = ({
  project,
  expandedProjectId,
  setExpandedProjectId,
  setProgressProject,
  setProgressFormData,
  setShowProgressModal,
  openEditModal,
  handleDelete,
}: SortableProjectCardProps) => {
  const { toggleProjectInPresentation } = useProjectStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const StatusIcon = statusIcons[project.status];
  const statusColor = STATUS_COLORS[project.status];
  const isExpanded = expandedProjectId === project.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${patterns.section} overflow-hidden hover:shadow-xl transition-shadow`}
    >
      {/* Status Banner */}
      <div className={`px-4 py-2 ${statusColor.bg} border-b ${statusColor.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <StatusIcon size={16} className={statusColor.text} />
          <span className={`text-sm font-medium ${statusColor.text}`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        <button
          {...attributes}
          {...listeners}
          className={`p-1 cursor-grab active:cursor-grabbing ${colors.hover} rounded`}
          title="اسحب لإعادة الترتيب"
        >
          <GripVertical size={18} className={colors.textTertiary} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-2 line-clamp-2`}>
          {project.name}
        </h3>
        {project.description && (
          <p className={`text-sm ${colors.textSecondary} mb-4 line-clamp-2`}>
            {project.description}
          </p>
        )}

        {/* Latest Progress Details */}
        {(() => {
          const latestUpdate = project.weeklyUpdates.length > 0
            ? project.weeklyUpdates.reduce((latest, update) =>
                new Date(update.weekDate) > new Date(latest.weekDate) ? update : latest
              )
            : null;

          if (!latestUpdate) return null;

          const accomplishments = Array.isArray(latestUpdate.accomplishments)
            ? latestUpdate.accomplishments
            : latestUpdate.accomplishments.split('\n').filter(line => line.trim());

          const challenges = latestUpdate.challenges
            ? (Array.isArray(latestUpdate.challenges)
                ? latestUpdate.challenges
                : latestUpdate.challenges.split('\n').filter(line => line.trim()))
            : [];

          const nextSteps = latestUpdate.nextSteps || [];

          return (
            <div className={`mb-4 p-3 rounded-lg ${colors.bgSecondary}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium ${colors.textTertiary}`}>
                  آخر تحديث: {formatWeekRange(latestUpdate.weekDate)}
                </span>
                <span className={`text-sm font-bold ${colors.primaryText}`}>
                  {latestUpdate.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className={`h-2 rounded-full ${colors.bgTertiary}`}>
                  <div
                    className="h-full rounded-full bg-[#367d56] transition-all"
                    style={{ width: `${latestUpdate.progress}%` }}
                  />
                </div>
              </div>

              {/* Three columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 size={14} className="text-[#367d56] dark:text-[#7da98c]" />
                    <span className={`text-xs font-medium ${colors.textPrimary}`}>ما تم إنجازه</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 mr-4">
                    {accomplishments.length > 0 ? accomplishments.map((item, idx) => (
                      <li key={idx} className={`text-xs ${colors.textSecondary}`}>{item}</li>
                    )) : <li className={`text-xs ${colors.textTertiary}`}>لا يوجد</li>}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingUp size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className={`text-xs font-medium ${colors.textPrimary}`}>الخطوات القادمة</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 mr-4">
                    {nextSteps.length > 0 ? nextSteps.map((item, idx) => (
                      <li key={idx} className={`text-xs ${colors.textSecondary}`}>{item}</li>
                    )) : <li className={`text-xs ${colors.textTertiary}`}>لا يوجد</li>}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertCircle size={14} className="text-red-600 dark:text-red-400" />
                    <span className={`text-xs font-medium ${colors.textPrimary}`}>التحديات الحالية</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 mr-4">
                    {challenges.length > 0 ? challenges.map((item, idx) => (
                      <li key={idx} className={`text-xs ${colors.textSecondary}`}>{item}</li>
                    )) : <li className={`text-xs ${colors.textTertiary}`}>لا يوجد</li>}
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Meta Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User size={14} className={colors.textTertiary} />
            <span className={colors.textSecondary}>{project.owner || 'غير محدد'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className={colors.textTertiary} />
            <span className={colors.textSecondary}>
              {project.targetEndDate ? formatDate(project.targetEndDate) : 'بدون موعد نهائي'}
            </span>
          </div>
        </div>

        {/* Expandable History */}
        {project.weeklyUpdates.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
              className={`flex items-center gap-2 text-sm ${colors.primaryText} hover:underline`}
            >
              <History size={14} />
              {isExpanded ? 'إخفاء السجل' : 'عرض سجل التحديثات'}
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isExpanded && (
              <div className={`mt-3 space-y-2 max-h-48 overflow-y-auto`}>
                {project.weeklyUpdates.slice().reverse().slice(0, 5).map((update) => (
                  <div key={update.id} className={`p-3 rounded-lg ${colors.bgTertiary} text-sm`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-medium ${colors.textPrimary}`}>
                        {formatWeekRange(update.weekDate)}
                      </span>
                      <span className={`${colors.primaryText} font-medium`}>{update.progress}%</span>
                    </div>
                    <p className={`${colors.textSecondary} line-clamp-2`}>
                      {Array.isArray(update.accomplishments) ? update.accomplishments.join(', ') : update.accomplishments}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={`px-4 sm:px-5 py-3 border-t ${colors.border} flex justify-between items-center`}>
        <button
          onClick={() => toggleProjectInPresentation(project.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
            (project.isActiveInPresentation ?? true)
              ? 'bg-[#dceee2] dark:bg-[#1e5b39]/30 text-[#2b6a46] dark:text-[#7da98c]'
              : 'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400'
          }`}
        >
          {(project.isActiveInPresentation ?? true) ? (
            <><Eye size={16} /><span className="text-sm">نشط</span></>
          ) : (
            <><EyeOff size={16} /><span className="text-sm">غير نشط</span></>
          )}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setProgressProject(project);
              setProgressFormData({
                status: project.status,
                weekDate: new Date().toISOString().split('T')[0],
                accomplishments: [''],
                nextSteps: [''],
                challenges: [''],
                progress: project.currentProgress,
                notes: '',
              });
              setShowProgressModal(true);
            }}
            className={`p-2 rounded-lg ${colors.hover} transition`}
            title="إضافة تقدم"
          >
            <PlusCircle size={18} className={colors.textSecondary} />
          </button>
          <button
            onClick={() => openEditModal(project)}
            className={`p-2 rounded-lg ${colors.hover} transition`}
            title="تعديل"
          >
            <Pencil size={18} className={colors.textSecondary} />
          </button>
          <button
            onClick={() => handleDelete(project)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
            title="حذف"
          >
            <Trash2 size={18} className="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Projects;
