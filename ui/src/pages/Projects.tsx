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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { Project, ProjectStatus, STATUS_LABELS, STATUS_COLORS } from '../types';
import { colors, patterns } from '../utils/darkMode';
import { formatDate, formatWeekRange } from '../utils/dateUtils';

const statusIcons: Record<ProjectStatus, typeof CheckCircle2> = {
  on_track: TrendingUp,
  at_risk: AlertCircle,
  delayed: Clock,
  completed: CheckCircle2,
  on_hold: Pause,
};

const Projects = () => {
  const { projects, addProject, updateProject, deleteProject } = useProjectStore();
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
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '',
    currentProgress: 0,
    owner: '',
  });

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
            <span className={`font-medium ${colors.textPrimary}`}>Dashboard Settings</span>
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
                  Dashboard Title
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
                  Subtitle
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
                  Organization Name
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                  placeholder="Your Organization"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showCompleted"
                checked={showCompletedProjects}
                onChange={(e) => setShowCompletedProjects(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showCompleted" className={`text-sm ${colors.textSecondary}`}>
                Show completed projects in dashboard
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${colors.textPrimary}`}>Projects</h1>
          <p className={`mt-1 ${colors.textSecondary}`}>
            Manage your projects and track their progress
          </p>
        </div>
        <button
          onClick={openAddModal}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 ${patterns.button}`}
        >
          <Plus size={20} />
          <span>Add Project</span>
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
                  placeholder="Search projects..."
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
              <option value="all">All Status</option>
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
                <option value="name">Sort by Name</option>
                <option value="progress">Sort by Progress</option>
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-2.5 rounded-lg ${colors.hover} border ${colors.border} transition`}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
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
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className={`${patterns.section} p-12 text-center`}>
          <FolderKanban className={`mx-auto ${colors.textTertiary} mb-4`} size={48} />
          <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-2`}>No projects yet</h3>
          <p className={`${colors.textSecondary} mb-6`}>
            Get started by creating your first project
          </p>
          <button
            onClick={openAddModal}
            className={`inline-flex items-center gap-2 px-6 py-3 ${patterns.button}`}
          >
            <Plus size={20} />
            Create Project
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className={`${patterns.section} p-12 text-center`}>
          <Search className={`mx-auto ${colors.textTertiary} mb-4`} size={48} />
          <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-2`}>No matching projects</h3>
          <p className={`${colors.textSecondary}`}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.map((project) => {
            const StatusIcon = statusIcons[project.status];
            const statusColor = STATUS_COLORS[project.status];
            const isExpanded = expandedProjectId === project.id;

            return (
              <div
                key={project.id}
                className={`${patterns.section} overflow-hidden hover:shadow-xl transition-shadow`}
              >
                {/* Status Banner */}
                <div className={`px-4 py-2 ${statusColor.bg} border-b ${statusColor.border}`}>
                  <div className="flex items-center gap-2">
                    <StatusIcon size={16} className={statusColor.text} />
                    <span className={`text-sm font-medium ${statusColor.text}`}>
                      {STATUS_LABELS[project.status]}
                    </span>
                  </div>
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

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${colors.textSecondary}`}>Progress</span>
                      <span className={`text-sm font-medium ${colors.textPrimary}`}>
                        {project.currentProgress}%
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${colors.bgTertiary}`}>
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${project.currentProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={14} className={colors.textTertiary} />
                      <span className={colors.textSecondary}>
                        {project.owner || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className={colors.textTertiary} />
                      <span className={colors.textSecondary}>
                        {project.targetEndDate ? formatDate(project.targetEndDate) : 'No deadline'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target size={14} className={colors.textTertiary} />
                      <span className={colors.textSecondary}>
                        {project.weeklyUpdates.length} weekly updates
                      </span>
                    </div>
                  </div>

                  {/* Expandable History */}
                  {project.weeklyUpdates.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() =>
                          setExpandedProjectId(isExpanded ? null : project.id)
                        }
                        className={`flex items-center gap-2 text-sm ${colors.primaryText} hover:underline`}
                      >
                        <History size={14} />
                        {isExpanded ? 'Hide history' : 'Show update history'}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isExpanded && (
                        <div className={`mt-3 space-y-2 max-h-48 overflow-y-auto`}>
                          {project.weeklyUpdates
                            .slice()
                            .reverse()
                            .slice(0, 5)
                            .map((update) => (
                              <div
                                key={update.id}
                                className={`p-3 rounded-lg ${colors.bgTertiary} text-sm`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`font-medium ${colors.textPrimary}`}>
                                    {formatWeekRange(update.weekDate)}
                                  </span>
                                  <span className={`${colors.primaryText} font-medium`}>
                                    {update.progress}%
                                  </span>
                                </div>
                                <p className={`${colors.textSecondary} line-clamp-2`}>
                                  {update.accomplishments}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div
                  className={`px-4 sm:px-5 py-3 border-t ${colors.border} flex justify-end gap-2`}
                >
                  <button
                    onClick={() => openEditModal(project)}
                    className={`p-2 rounded-lg ${colors.hover} transition`}
                    title="Edit"
                  >
                    <Pencil size={18} className={colors.textSecondary} />
                  </button>
                  <button
                    onClick={() => handleDelete(project)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                    title="Delete"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
                {editingProject ? 'Edit Project' : 'New Project'}
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
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                  placeholder="Enter project name"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2.5 ${patterns.input} resize-none`}
                  placeholder="Brief description of the project"
                />
              </div>

              {/* Owner */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  Owner
                </label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                  placeholder="Project owner name"
                />
              </div>

              {/* Status */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  Status
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
                    Start Date
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
                    Target End Date
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
                  Current Progress: {formData.currentProgress}%
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
                  Cancel
                </button>
                <button type="submit" className={`px-6 py-2.5 ${patterns.button}`}>
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
