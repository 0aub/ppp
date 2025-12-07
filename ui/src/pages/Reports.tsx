import { useState, useMemo } from 'react';
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Target,
  Building2,
  FolderKanban,
} from 'lucide-react';
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
import { ProjectStatus, STATUS_LABELS, STATUS_COLORS } from '../types';
import { colors, patterns } from '../utils/darkMode';
import {
  formatWeekRange,
  formatPresentationDate,
} from '../utils/dateUtils';
import StatCard from '../components/StatCard';
import DatePicker from '../components/DatePicker';

const CHART_COLORS = ['#228B22', '#32CD32', '#90EE90', '#9ACD32', '#6B8E23'];

// Status-specific colors matching the app's status colors
const STATUS_CHART_COLORS: Record<ProjectStatus, string> = {
  on_track: '#367d56',    // forest green main
  at_risk: '#eab308',     // yellow-500
  delayed: '#ef4444',     // red-500
  completed: '#3b82f6',   // blue-500
  on_hold: '#6b7280',     // gray-500
};

// Project colors for trend chart (8 different colors)
const PROJECT_COLORS = [
  '#367d56', // forest green
  '#3b82f6', // blue
  '#eab308', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];

const Reports = () => {
  const { projects, currentWeek, setCurrentWeek } = useProjectStore();
  const { dashboardTitle, dashboardSubtitle, organizationName } = useUIStore();

  const [trendTimeRange, setTrendTimeRange] = useState<'week' | 'month' | 'quarter' | '2quarters' | 'year'>('month');

  // Helper to get Monday of a week
  const getMondayOfWeek = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().split('T')[0];
  };

  // Get projects with updates for current week
  const projectsWithUpdates = useMemo(() => {
    const selectedMonday = getMondayOfWeek(currentWeek);
    return projects
      .map((project) => {
        const weekUpdate = project.weeklyUpdates.find((u) => u.weekDate === selectedMonday);
        return { project, weekUpdate };
      })
      .filter(({ weekUpdate }) => weekUpdate !== undefined);
  }, [projects, currentWeek]);

  // Get projects without updates for current week
  const projectsWithoutUpdates = useMemo(() => {
    const selectedMonday = getMondayOfWeek(currentWeek);
    return projects.filter(
      (project) => !project.weeklyUpdates.some((u) => u.weekDate === selectedMonday)
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

  // Chart data - Progress by project (based on selected week)
  const progressChartData = useMemo(() => {
    const selectedMonday = getMondayOfWeek(currentWeek);
    return projects
      .slice(0, 8) // Limit to 8 for readability
      .map((p) => {
        // Find the update for the selected week, or find the most recent update before/on that date
        const weekUpdate = p.weeklyUpdates.find((u) => u.weekDate === selectedMonday);
        // If no exact match, find the closest update on or before the selected date
        const closestUpdate = weekUpdate || p.weeklyUpdates
          .filter(u => u.weekDate <= selectedMonday)
          .sort((a, b) => b.weekDate.localeCompare(a.weekDate))[0];

        return {
          name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
          progress: closestUpdate?.progress ?? 0,
          fullName: p.name,
        };
      });
  }, [projects, currentWeek]);

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

  // Progress trend data - dynamic based on time range
  const progressTrendData = useMemo(() => {
    const weeks = [];
    const selectedDate = new Date(currentWeek);

    // Helper to get Monday of a week
    const getMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    // Helper to check if a date falls within a week (Monday to Sunday)
    const isDateInWeek = (dateStr: string, weekMonday: Date): boolean => {
      const date = new Date(dateStr);
      const weekSunday = new Date(weekMonday);
      weekSunday.setDate(weekSunday.getDate() + 6);
      weekSunday.setHours(23, 59, 59, 999);
      return date >= weekMonday && date <= weekSunday;
    };

    // Get Monday of the selected date's week
    const currentWeekMonday = getMonday(selectedDate);

    // Determine number of weeks based on time range
    const rangeWeeks = {
      week: 1,
      month: 4,
      quarter: 13,
      '2quarters': 26,
      year: 52,
    };

    const numWeeks = rangeWeeks[trendTimeRange];

    // Generate weeks going backwards from current week
    for (let i = numWeeks - 1; i >= 0; i--) {
      const weekMonday = new Date(currentWeekMonday);
      weekMonday.setDate(weekMonday.getDate() - (i * 7));
      const shortLabel = weekMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const weekData: Record<string, string | number | null> = {
        week: shortLabel,
      };

      // Add each project's progress for this week
      projects.slice(0, 8).forEach((project, index) => {
        // Find update that falls within this week
        const weekUpdate = project.weeklyUpdates.find((u) => isDateInWeek(u.weekDate, weekMonday));
        weekData[`project_${index}`] = weekUpdate ? weekUpdate.progress : null;
      });

      weeks.push(weekData);
    }

    return weeks;
  }, [projects, currentWeek, trendTimeRange]);

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
              {formatPresentationDate(currentWeek)}
            </div>
            <div className={`text-sm ${colors.textSecondary}`}>
              {projects.length} مشروع • {projectsWithUpdates.length} محدّث
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector - at top for easy access */}
      <div className={`${patterns.section} p-4`}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className={`text-sm font-medium ${colors.textSecondary}`}>
            تاريخ التقرير:
          </span>
          <div className="w-full max-w-sm">
            <DatePicker
              value={currentWeek}
              onChange={setCurrentWeek}
              maxDate={new Date().toISOString().split('T')[0]}
              showNavArrows={true}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={FolderKanban}
            value={summaryStats.total}
            label="إجمالي المشاريع"
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            value={summaryStats.onTrack}
            label="على المسار الصحيح"
            color="green"
          />
          <StatCard
            icon={AlertTriangle}
            value={summaryStats.atRisk}
            label="متعثر"
            color="yellow"
          />
          <StatCard
            icon={Clock}
            value={summaryStats.delayed}
            label="متأخر"
            color="red"
          />
          <StatCard
            icon={Target}
            value={summaryStats.completed}
            label="مكتمل"
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            value={`${summaryStats.avgProgress}%`}
            label="متوسط التقدم"
            color="gray"
          />
        </div>
      )}

      {/* Charts Section */}
      {projects.length > 0 && (
        <div className="space-y-6">
          {/* Status Distribution */}
          <div className={`${patterns.section} p-4 sm:p-6`}>
            <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4 flex items-center gap-2`}>
              <BarChart3 size={20} className={colors.primaryIcon} />
              توزيع الحالات
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
                  >
                    {statusChartData.map((entry) => (
                      <Cell
                        key={`cell-${entry.status}`}
                        fill={STATUS_CHART_COLORS[entry.status as ProjectStatus]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ paddingTop: '15px' }}
                    formatter={(value) => <span style={{ marginRight: '8px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress Trend Line Chart - Full Width */}
          <div className={`${patterns.section} p-4 sm:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${colors.textPrimary} flex items-center gap-2`}>
                <TrendingUp size={20} className={colors.primaryIcon} />
                تطور التقدم للمشاريع
              </h3>
              <div className="flex gap-2">
                {(['week', 'month', 'quarter', '2quarters', 'year'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTrendTimeRange(range)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      trendTimeRange === range
                        ? `${colors.primaryText} bg-[rgb(var(--color-primary-light))] border border-[rgb(var(--color-primary-border))]`
                        : `${colors.textSecondary} ${colors.bgTertiary} hover:${colors.bgHover}`
                    }`}
                  >
                    {range === 'week' && 'أسبوع'}
                    {range === 'month' && 'شهر'}
                    {range === 'quarter' && 'ربع'}
                    {range === '2quarters' && 'نصف سنة'}
                    {range === 'year' && 'سنة'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressTrendData} margin={{ top: 10, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    dy={10}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 10 }}
                    width={50}
                    dx={-5}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      fontSize: '10px',
                      paddingTop: '10px',
                    }}
                    iconSize={10}
                    layout="horizontal"
                    align="center"
                    formatter={(value: string) => {
                      // Show full name with wrapping support
                      return (
                        <span style={{
                          marginRight: '12px',
                          display: 'inline-block',
                          maxWidth: '120px',
                          whiteSpace: 'normal',
                          lineHeight: '1.3',
                          verticalAlign: 'middle',
                        }}>
                          {value}
                        </span>
                      );
                    }}
                  />
                  {projects.slice(0, 8).map((project, index) => (
                    <Line
                      key={project.id}
                      type="monotone"
                      dataKey={`project_${index}`}
                      name={project.name}
                      stroke={PROJECT_COLORS[index % PROJECT_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Second Row: Progress by Project */}
          <div className="grid grid-cols-1 gap-6">
            {/* Progress by Project */}
            <div className={`${patterns.section} p-4 sm:p-6`}>
              <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-6 flex items-center gap-2`}>
                <Target size={20} className={colors.primaryIcon} />
                التقدم حسب المشروع
              </h3>
              <div className="space-y-4">
                {progressChartData.map((project, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${colors.textPrimary}`}>
                        {project.fullName}
                      </span>
                      <span className={`text-sm font-bold ${colors.primaryText}`}>
                        {project.progress}%
                      </span>
                    </div>
                    <div className={`w-full h-8 rounded-lg ${colors.bgTertiary} overflow-hidden`}>
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center justify-end px-3"
                        style={{
                          width: `${project.progress}%`,
                          background: `linear-gradient(90deg, rgba(54, 125, 86, 0.7) 0%, rgba(75, 139, 102, 0.9) 100%)`,
                        }}
                      >
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Active Projects with Latest Progress */}
      {projects.filter(p => p.status !== 'completed').length > 0 && (
        <div className={`${patterns.section} overflow-hidden`}>
          <div className={`px-4 sm:px-6 py-4 border-b ${colors.border}`}>
            <h3 className={`text-lg font-semibold ${colors.textPrimary} flex items-center gap-2`}>
              <FolderKanban size={20} className={colors.primaryIcon} />
              المشاريع النشطة
              <span className={`ml-2 px-2 py-0.5 text-sm rounded-full ${colors.primaryLight} ${colors.primaryText}`}>
                {projects.filter(p => p.status !== 'completed').length}
              </span>
            </h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {projects.filter(p => p.status !== 'completed').map((project) => {
              const statusColor = STATUS_COLORS[project.status];
              // Get update for selected week (or closest before)
              const selectedMonday = getMondayOfWeek(currentWeek);
              const exactWeekUpdate = project.weeklyUpdates.find(u => u.weekDate === selectedMonday);
              const closestUpdate = exactWeekUpdate || project.weeklyUpdates
                .filter(u => u.weekDate <= selectedMonday)
                .sort((a, b) => b.weekDate.localeCompare(a.weekDate))[0] || null;

              const selectedProgress = closestUpdate?.progress ?? 0;

              const accomplishments = closestUpdate
                ? (Array.isArray(closestUpdate.accomplishments)
                    ? closestUpdate.accomplishments
                    : closestUpdate.accomplishments.split('\n').filter((line: string) => line.trim()))
                : [];

              const challenges = closestUpdate?.challenges
                ? (Array.isArray(closestUpdate.challenges)
                    ? closestUpdate.challenges
                    : closestUpdate.challenges.split('\n').filter((line: string) => line.trim()))
                : [];

              const nextSteps = closestUpdate?.nextSteps || [];

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
                        المسؤول: {project.owner || 'غير محدد'}
                        {closestUpdate && (
                          <span className="mr-3">
                            • تحديث: {formatPresentationDate(closestUpdate.weekDate)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${colors.textSecondary}`}>التقدم</span>
                      <span className={`text-sm font-medium ${colors.textPrimary}`}>
                        {selectedProgress}%
                      </span>
                    </div>
                    <div className={`h-2.5 rounded-full ${colors.bgTertiary}`}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${selectedProgress}%`,
                          backgroundColor: 'rgb(54, 125, 86)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Update Details for Selected Date - Three Columns */}
                  {closestUpdate ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Accomplishments */}
                      <div className={`p-3 rounded-lg ${colors.bgTertiary}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 size={16} className="text-[#367d56] dark:text-[#7da98c]" />
                          <span className={`text-sm font-medium ${colors.textPrimary}`}>
                            ما تم إنجازه
                          </span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 mr-2">
                          {accomplishments.length > 0 ? accomplishments.map((item: string, idx: number) => (
                            <li key={idx} className={`text-sm ${colors.textSecondary}`}>{item}</li>
                          )) : <li className={`text-sm ${colors.textTertiary}`}>لا يوجد</li>}
                        </ul>
                      </div>

                      {/* Next Steps */}
                      <div className={`p-3 rounded-lg ${colors.bgTertiary}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                          <span className={`text-sm font-medium ${colors.textPrimary}`}>
                            الخطوات القادمة
                          </span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 mr-2">
                          {nextSteps.length > 0 ? nextSteps.map((item: string, idx: number) => (
                            <li key={idx} className={`text-sm ${colors.textSecondary}`}>{item}</li>
                          )) : <li className={`text-sm ${colors.textTertiary}`}>لا يوجد</li>}
                        </ul>
                      </div>

                      {/* Challenges */}
                      <div className={`p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20`}>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
                          <span className={`text-sm font-medium ${colors.textPrimary}`}>
                            التحديات
                          </span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 mr-2">
                          {challenges.length > 0 ? challenges.map((item: string, idx: number) => (
                            <li key={idx} className={`text-sm ${colors.textSecondary}`}>{item}</li>
                          )) : <li className={`text-sm ${colors.textTertiary}`}>لا يوجد</li>}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-lg ${colors.bgTertiary} text-center`}>
                      <p className={`text-sm ${colors.textTertiary}`}>
                        لا توجد تحديثات لهذا المشروع بعد
                      </p>
                    </div>
                  )}
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
            لا توجد مشاريع للتقرير
          </h3>
          <p className={`${colors.textSecondary} mb-6`}>
            قم بإنشاء بعض المشاريع أولاً لبدء تتبع التقدم الأسبوعي
          </p>
          <a
            href="/projects"
            className={`inline-flex items-center gap-2 px-6 py-3 ${patterns.button}`}
          >
            <Plus size={20} />
            الذهاب إلى المشاريع
          </a>
        </div>
      )}

    </div>
  );
};

export default Reports;
