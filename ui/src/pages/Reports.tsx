import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Target,
  MessageSquare,
  HelpCircle,
  Building2,
  Users,
  FolderKanban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { Project, WeeklyUpdate, ProjectStatus, STATUS_LABELS, STATUS_COLORS } from '../types';
import { colors, patterns } from '../utils/darkMode';
import {
  formatWeekRange,
  getPreviousWeek,
  getNextWeek,
  getCurrentWeekMonday,
  isFutureWeek,
  getWeekOptions,
} from '../utils/dateUtils';
import StatCard from '../components/StatCard';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#6b7280'];

const Reports = () => {
  const { projects, currentWeek, setCurrentWeek, addWeeklyUpdate, updateWeeklyUpdate, deleteWeeklyUpdate } =
    useProjectStore();
  const { dashboardTitle, dashboardSubtitle, organizationName, showCompletedProjects } = useUIStore();

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<WeeklyUpdate | null>(null);

  // Form state
  const [updateForm, setUpdateForm] = useState({
    accomplishments: '',
    progress: 0,
    estimatedCompletion: '',
    challenges: '',
    supportNeeded: '',
    notes: '',
  });

  // Get projects with updates for current week
  const projectsWithUpdates = useMemo(() => {
    return projects
      .map((project) => {
        const weekUpdate = project.weeklyUpdates.find((u) => u.weekDate === currentWeek);
        return { project, weekUpdate };
      })
      .filter(({ weekUpdate }) => weekUpdate !== undefined);
  }, [projects, currentWeek]);

  // Get projects without updates for current week
  const projectsWithoutUpdates = useMemo(() => {
    return projects.filter(
      (project) => !project.weeklyUpdates.some((u) => u.weekDate === currentWeek)
    );
  }, [projects, currentWeek]);

  // Chart data - Status distribution
  const statusChartData = useMemo(() => {
    const statusCounts: Record<ProjectStatus, number> = {
      on_track: 0,
      at_risk: 0,
      delayed: 0,
      completed: 0,
      on_hold: 0,
    };

    projects.forEach((p) => {
      statusCounts[p.status]++;
    });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status as ProjectStatus],
        value: count,
        status,
      }));
  }, [projects]);

  // Chart data - Progress by project
  const progressChartData = useMemo(() => {
    return projects
      .slice(0, 8) // Limit to 8 for readability
      .map((p) => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        progress: p.currentProgress,
        fullName: p.name,
      }));
  }, [projects]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const total = projects.length;
    const onTrack = projects.filter((p) => p.status === 'on_track').length;
    const atRisk = projects.filter((p) => p.status === 'at_risk').length;
    const delayed = projects.filter((p) => p.status === 'delayed').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const avgProgress = total > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.currentProgress, 0) / total)
      : 0;

    return { total, onTrack, atRisk, delayed, completed, avgProgress };
  }, [projects]);

  // Owner distribution chart data
  const ownerChartData = useMemo(() => {
    const ownerCounts: Record<string, number> = {};
    projects.forEach((p) => {
      const owner = p.owner || 'Unassigned';
      ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
    });

    return Object.entries(ownerCounts)
      .map(([owner, count]) => ({
        name: owner.length > 12 ? owner.substring(0, 12) + '...' : owner,
        value: count,
        fullName: owner,
      }))
      .slice(0, 8);
  }, [projects]);

  // Progress trend data (mock - showing last 8 weeks with slight variations)
  const progressTrendData = useMemo(() => {
    const weeks = [];
    let weekDate = currentWeek;

    // Go back 7 weeks from current week
    for (let i = 0; i < 7; i++) {
      weekDate = getPreviousWeek(weekDate);
    }

    // Now build forward including current week
    for (let i = 0; i < 8; i++) {
      // Calculate average progress for this week based on weekly updates
      let weekAvgProgress = 0;
      let projectCount = 0;

      projects.forEach((p) => {
        const weekUpdate = p.weeklyUpdates.find((u) => u.weekDate === weekDate);
        if (weekUpdate) {
          weekAvgProgress += weekUpdate.progress;
          projectCount++;
        }
      });

      const avgProgress = projectCount > 0 ? Math.round(weekAvgProgress / projectCount) : null;

      weeks.push({
        week: formatWeekRange(weekDate).split(' - ')[0], // Just show start date
        progress: avgProgress,
        weekDate,
      });

      weekDate = getNextWeek(weekDate);
    }

    return weeks;
  }, [projects, currentWeek]);

  const resetUpdateForm = () => {
    setUpdateForm({
      accomplishments: '',
      progress: 0,
      estimatedCompletion: '',
      challenges: '',
      supportNeeded: '',
      notes: '',
    });
    setSelectedProject(null);
    setEditingUpdate(null);
  };

  const openAddUpdateModal = (project: Project) => {
    setSelectedProject(project);
    setUpdateForm({
      accomplishments: '',
      progress: project.currentProgress,
      estimatedCompletion: project.targetEndDate || '',
      challenges: '',
      supportNeeded: '',
      notes: '',
    });
    setShowUpdateModal(true);
  };

  const openEditUpdateModal = (project: Project, update: WeeklyUpdate) => {
    setSelectedProject(project);
    setEditingUpdate(update);
    setUpdateForm({
      accomplishments: update.accomplishments,
      progress: update.progress,
      estimatedCompletion: update.estimatedCompletion,
      challenges: update.challenges,
      supportNeeded: update.supportNeeded,
      notes: update.notes,
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) return;

    if (!updateForm.accomplishments.trim()) {
      toast.error('Please describe what was accomplished');
      return;
    }

    if (editingUpdate) {
      updateWeeklyUpdate(selectedProject.id, editingUpdate.id, {
        ...updateForm,
        weekDate: currentWeek,
      });
      toast.success('Update saved');
    } else {
      addWeeklyUpdate(selectedProject.id, {
        ...updateForm,
        weekDate: currentWeek,
      });
      toast.success('Weekly update added');
    }

    setShowUpdateModal(false);
    resetUpdateForm();
  };

  const handleDeleteUpdate = (projectId: string, updateId: string) => {
    if (confirm('Delete this weekly update?')) {
      deleteWeeklyUpdate(projectId, updateId);
      toast.success('Update deleted');
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${colors.bgSecondary} border ${colors.border} rounded-lg p-3 shadow-lg`}>
          <p className={`text-sm font-medium ${colors.textPrimary}`}>
            {payload[0].payload.fullName || payload[0].payload.name}
          </p>
          <p className={`text-sm ${colors.textSecondary}`}>
            {payload[0].name}: {payload[0].value}
            {payload[0].name === 'progress' ? '%' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className={`${patterns.section} p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {organizationName && (
              <div className={`flex items-center gap-2 mb-2 text-sm ${colors.textSecondary}`}>
                <Building2 size={16} />
                <span>{organizationName}</span>
              </div>
            )}
            <h1 className={`text-2xl font-bold ${colors.textPrimary}`}>
              {dashboardTitle || 'عرض تقدم المشاريع'}
            </h1>
            <p className={`text-sm ${colors.textSecondary} mt-1`}>
              {dashboardSubtitle || 'التقرير الأسبوعي'}
            </p>
          </div>
          <div className={`text-left sm:text-right`}>
            <div className={`text-lg font-semibold ${colors.primaryText}`}>
              {formatWeekRange(currentWeek)}
            </div>
            <div className={`text-sm ${colors.textSecondary}`}>
              {projects.length} Projects • {projectsWithUpdates.length} Updated
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={FolderKanban}
            value={summaryStats.total}
            label="Total Projects"
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            value={summaryStats.onTrack}
            label="On Track"
            color="green"
          />
          <StatCard
            icon={AlertTriangle}
            value={summaryStats.atRisk}
            label="At Risk"
            color="yellow"
          />
          <StatCard
            icon={Clock}
            value={summaryStats.delayed}
            label="Delayed"
            color="red"
          />
          <StatCard
            icon={Target}
            value={summaryStats.completed}
            label="Completed"
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            value={`${summaryStats.avgProgress}%`}
            label="Avg Progress"
            color="gray"
          />
        </div>
      )}

      {/* Week Selector */}
      <div className={`${patterns.section} p-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className={colors.primaryIcon} size={24} />
            <div>
              <h2 className={`text-lg font-semibold ${colors.textPrimary}`}>
                Week Navigation
              </h2>
              <p className={`text-sm ${colors.textSecondary}`}>
                Select a week to view or edit updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeek(getPreviousWeek(currentWeek))}
              className={`p-2 rounded-lg ${colors.hover} transition`}
              title="Previous week"
            >
              <ChevronLeft size={20} className={colors.textPrimary} />
            </button>

            <select
              value={currentWeek}
              onChange={(e) => setCurrentWeek(e.target.value)}
              className={`px-3 py-2 text-sm ${patterns.input}`}
            >
              {getWeekOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => !isFutureWeek(getNextWeek(currentWeek)) && setCurrentWeek(getNextWeek(currentWeek))}
              disabled={isFutureWeek(getNextWeek(currentWeek))}
              className={`p-2 rounded-lg ${colors.hover} transition disabled:opacity-40`}
              title="Next week"
            >
              <ChevronRight size={20} className={colors.textPrimary} />
            </button>

            {currentWeek !== getCurrentWeekMonday() && (
              <button
                onClick={() => setCurrentWeek(getCurrentWeekMonday())}
                className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
              >
                Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {projects.length > 0 && (
        <div className="space-y-6">
          {/* First Row: Status & Progress Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className={`${patterns.section} p-4 sm:p-6`}>
              <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4 flex items-center gap-2`}>
                <BarChart3 size={20} className={colors.primaryIcon} />
                Status Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Progress Trend Line Chart */}
            <div className={`${patterns.section} p-4 sm:p-6`}>
              <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4 flex items-center gap-2`}>
                <TrendingUp size={20} className={colors.primaryIcon} />
                Progress Trend (8 Weeks)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressTrendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length && payload[0].value !== null) {
                          return (
                            <div className={`${colors.bgSecondary} border ${colors.border} rounded-lg p-3 shadow-lg`}>
                              <p className={`text-sm font-medium ${colors.textPrimary}`}>
                                Week of {payload[0].payload.week}
                              </p>
                              <p className={`text-sm ${colors.textSecondary}`}>
                                Avg Progress: {payload[0].value}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Second Row: Progress by Project & Owner Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress by Project */}
            <div className={`${patterns.section} p-4 sm:p-6`}>
              <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4 flex items-center gap-2`}>
                <Target size={20} className={colors.primaryIcon} />
                Progress by Project
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progressChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="progress" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Owner Distribution */}
            <div className={`${patterns.section} p-4 sm:p-6`}>
              <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4 flex items-center gap-2`}>
                <Users size={20} className={colors.primaryIcon} />
                Projects by Owner
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ownerChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className={`${colors.bgSecondary} border ${colors.border} rounded-lg p-3 shadow-lg`}>
                              <p className={`text-sm font-medium ${colors.textPrimary}`}>
                                {payload[0].payload.fullName}
                              </p>
                              <p className={`text-sm ${colors.textSecondary}`}>
                                Projects: {payload[0].value}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects with updates this week */}
      <div className={`${patterns.section} overflow-hidden`}>
        <div className={`px-4 sm:px-6 py-4 border-b ${colors.border}`}>
          <h3 className={`text-lg font-semibold ${colors.textPrimary} flex items-center gap-2`}>
            <FileText size={20} className={colors.primaryIcon} />
            Updates This Week
            <span className={`ml-2 px-2 py-0.5 text-sm rounded-full ${colors.primaryLight} ${colors.primaryText}`}>
              {projectsWithUpdates.length}
            </span>
          </h3>
        </div>

        {projectsWithUpdates.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className={`mx-auto ${colors.textTertiary} mb-3`} size={40} />
            <p className={colors.textSecondary}>No updates for this week yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {projectsWithUpdates.map(({ project, weekUpdate }) => {
              const statusColor = STATUS_COLORS[project.status];

              return (
                <div key={project.id} className="p-4 sm:p-6">
                  {/* Project Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-lg font-semibold ${colors.textPrimary}`}>
                          {project.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
                        >
                          {STATUS_LABELS[project.status]}
                        </span>
                      </div>
                      <p className={`text-sm ${colors.textSecondary} mt-1`}>
                        Owner: {project.owner || 'Unassigned'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditUpdateModal(project, weekUpdate!)}
                        className={`p-2 rounded-lg ${colors.hover} transition`}
                        title="Edit update"
                      >
                        <Pencil size={18} className={colors.textSecondary} />
                      </button>
                      <button
                        onClick={() => handleDeleteUpdate(project.id, weekUpdate!.id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                        title="Delete update"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${colors.textSecondary}`}>Progress</span>
                      <span className={`text-sm font-medium ${colors.textPrimary}`}>
                        {weekUpdate?.progress}%
                      </span>
                    </div>
                    <div className={`h-2.5 rounded-full ${colors.bgTertiary}`}>
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${weekUpdate?.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Update Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Accomplishments */}
                    <div className={`p-3 rounded-lg ${colors.bgTertiary}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className={`text-sm font-medium ${colors.textPrimary}`}>
                          Accomplishments
                        </span>
                      </div>
                      <p className={`text-sm ${colors.textSecondary} whitespace-pre-wrap`}>
                        {weekUpdate?.accomplishments || '-'}
                      </p>
                    </div>

                    {/* Challenges */}
                    {weekUpdate?.challenges && (
                      <div className={`p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20`}>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={16} className="text-yellow-500" />
                          <span className={`text-sm font-medium ${colors.textPrimary}`}>
                            Challenges
                          </span>
                        </div>
                        <p className={`text-sm ${colors.textSecondary} whitespace-pre-wrap`}>
                          {weekUpdate.challenges}
                        </p>
                      </div>
                    )}

                    {/* Support Needed */}
                    {weekUpdate?.supportNeeded && (
                      <div className={`p-3 rounded-lg bg-red-50 dark:bg-red-900/20`}>
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle size={16} className="text-red-500" />
                          <span className={`text-sm font-medium ${colors.textPrimary}`}>
                            Support Needed
                          </span>
                        </div>
                        <p className={`text-sm ${colors.textSecondary} whitespace-pre-wrap`}>
                          {weekUpdate.supportNeeded}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {weekUpdate?.notes && (
                      <div className={`p-3 rounded-lg ${colors.bgTertiary}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare size={16} className={colors.primaryIcon} />
                          <span className={`text-sm font-medium ${colors.textPrimary}`}>
                            Notes
                          </span>
                        </div>
                        <p className={`text-sm ${colors.textSecondary} whitespace-pre-wrap`}>
                          {weekUpdate.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Estimated Completion */}
                  {weekUpdate?.estimatedCompletion && (
                    <div className={`mt-3 text-sm ${colors.textSecondary}`}>
                      <TrendingUp size={14} className="inline mr-1" />
                      Expected completion: {new Date(weekUpdate.estimatedCompletion).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Projects without updates */}
      {projectsWithoutUpdates.length > 0 && (
        <div className={`${patterns.section} overflow-hidden`}>
          <div className={`px-4 sm:px-6 py-4 border-b ${colors.border}`}>
            <h3 className={`text-lg font-semibold ${colors.textPrimary} flex items-center gap-2`}>
              <AlertTriangle size={20} className="text-yellow-500" />
              Pending Updates
              <span className="ml-2 px-2 py-0.5 text-sm rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                {projectsWithoutUpdates.length}
              </span>
            </h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {projectsWithoutUpdates.map((project) => {
              const statusColor = STATUS_COLORS[project.status];

              return (
                <div
                  key={project.id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-medium ${colors.textPrimary}`}>{project.name}</h4>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    <p className={`text-sm ${colors.textSecondary} mt-1`}>
                      Current progress: {project.currentProgress}%
                    </p>
                  </div>

                  <button
                    onClick={() => openAddUpdateModal(project)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                  >
                    <Plus size={18} />
                    Add Update
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <div className={`${patterns.section} p-12 text-center`}>
          <BarChart3 className={`mx-auto ${colors.textTertiary} mb-4`} size={48} />
          <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-2`}>
            No projects to report
          </h3>
          <p className={`${colors.textSecondary} mb-6`}>
            Create some projects first to start tracking weekly progress
          </p>
          <a
            href="/projects"
            className={`inline-flex items-center gap-2 px-6 py-3 ${patterns.button}`}
          >
            <Plus size={20} />
            Go to Projects
          </a>
        </div>
      )}

      {/* Add/Edit Update Modal */}
      {showUpdateModal && selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowUpdateModal(false)}
        >
          <div
            className={`${colors.bgSecondary} rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${colors.border}`}>
              <div>
                <h2 className={`text-xl font-bold ${colors.textPrimary}`}>
                  {editingUpdate ? 'Edit Update' : 'Weekly Update'}
                </h2>
                <p className={`text-sm ${colors.textSecondary}`}>{selectedProject.name}</p>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className={`p-2 rounded-lg ${colors.hover} transition`}
              >
                <X size={20} className={colors.textSecondary} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitUpdate} className="p-4 space-y-4">
              {/* Accomplishments */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  What was accomplished? *
                </label>
                <textarea
                  value={updateForm.accomplishments}
                  onChange={(e) => setUpdateForm({ ...updateForm, accomplishments: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2.5 ${patterns.input} resize-none`}
                  placeholder="Describe what was done since the last update..."
                  required
                />
              </div>

              {/* Progress */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  Progress: {updateForm.progress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={updateForm.progress}
                  onChange={(e) => setUpdateForm({ ...updateForm, progress: parseInt(e.target.value) })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                />
              </div>

              {/* Estimated Completion */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  Estimated Completion
                </label>
                <input
                  type="date"
                  value={updateForm.estimatedCompletion}
                  onChange={(e) => setUpdateForm({ ...updateForm, estimatedCompletion: e.target.value })}
                  className={`w-full px-4 py-2.5 ${patterns.input}`}
                />
              </div>

              {/* Challenges */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  Challenges / Blockers
                </label>
                <textarea
                  value={updateForm.challenges}
                  onChange={(e) => setUpdateForm({ ...updateForm, challenges: e.target.value })}
                  rows={2}
                  className={`w-full px-4 py-2.5 ${patterns.input} resize-none`}
                  placeholder="Any blockers or challenges faced..."
                />
              </div>

              {/* Support Needed */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  Support Needed
                </label>
                <textarea
                  value={updateForm.supportNeeded}
                  onChange={(e) => setUpdateForm({ ...updateForm, supportNeeded: e.target.value })}
                  rows={2}
                  className={`w-full px-4 py-2.5 ${patterns.input} resize-none`}
                  placeholder="What support or help is needed..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${colors.textPrimary}`}>
                  Additional Notes
                </label>
                <textarea
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  rows={2}
                  className={`w-full px-4 py-2.5 ${patterns.input} resize-none`}
                  placeholder="Any other notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className={`px-4 py-2.5 rounded-lg border ${colors.border} ${colors.textSecondary} ${colors.hover} transition`}
                >
                  Cancel
                </button>
                <button type="submit" className={`px-6 py-2.5 ${patterns.button}`}>
                  {editingUpdate ? 'Save Changes' : 'Add Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
