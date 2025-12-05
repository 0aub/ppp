import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Building2,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { Project, STATUS_LABELS, STATUS_COLORS } from '../types';
import { formatWeekRange } from '../utils/dateUtils';

interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
}

const PresentationMode = ({ isOpen, onClose }: PresentationModeProps) => {
  const { projects, currentWeek } = useProjectStore();
  const { dashboardTitle, dashboardSubtitle, organizationName } = useUIStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Get projects with updates for current week
  const projectsWithUpdates = projects.filter((p) =>
    p.weeklyUpdates.some((u) => u.weekDate === currentWeek)
  );

  // Calculate summary stats
  const summaryStats = {
    total: projects.length,
    onTrack: projects.filter((p) => p.status === 'on_track').length,
    atRisk: projects.filter((p) => p.status === 'at_risk').length,
    delayed: projects.filter((p) => p.status === 'delayed').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    avgProgress: projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.currentProgress, 0) / projects.length)
      : 0,
  };

  // Build slides: Title, Summary, each project with update, Thank You
  const slides = [
    { type: 'title' as const },
    { type: 'summary' as const },
    ...projectsWithUpdates.map((p) => ({ type: 'project' as const, project: p })),
    { type: 'thankyou' as const },
  ];

  const totalSlides = slides.length;

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentSlide(index);
      }
    },
    [totalSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          nextSlide();
          break;
        case 'ArrowLeft':
          prevSlide();
          break;
        case 'Escape':
          onClose();
          break;
        case 'Home':
          setCurrentSlide(0);
          break;
        case 'End':
          setCurrentSlide(totalSlides - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, onClose, totalSlides]);

  // Reset slide when closing
  useEffect(() => {
    if (!isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];

  const renderTitleSlide = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="mb-8">
        <img src="/logo.svg" alt="Logo" className="w-24 h-24 mx-auto mb-6" />
      </div>
      {organizationName && (
        <div className="flex items-center gap-2 text-gray-400 mb-4">
          <Building2 size={20} />
          <span className="text-lg">{organizationName}</span>
        </div>
      )}
      <h1 className="text-5xl font-bold text-white mb-4">
        {dashboardTitle || 'عرض تقدم المشاريع'}
      </h1>
      <p className="text-2xl text-gray-300 mb-8">
        {dashboardSubtitle || 'التقرير الأسبوعي'}
      </p>
      <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl px-8 py-4">
        <p className="text-xl text-blue-400">{formatWeekRange(currentWeek)}</p>
      </div>
    </div>
  );

  const renderSummarySlide = () => (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <h2 className="text-4xl font-bold text-white mb-12">Project Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <StatItem icon={BarChart3} value={summaryStats.total} label="Total Projects" color="blue" />
        <StatItem icon={CheckCircle2} value={summaryStats.onTrack} label="On Track" color="green" />
        <StatItem icon={AlertTriangle} value={summaryStats.atRisk} label="At Risk" color="yellow" />
        <StatItem icon={Clock} value={summaryStats.delayed} label="Delayed" color="red" />
        <StatItem icon={Target} value={summaryStats.completed} label="Completed" color="purple" />
        <StatItem icon={TrendingUp} value={`${summaryStats.avgProgress}%`} label="Avg Progress" color="gray" />
      </div>
    </div>
  );

  const renderProjectSlide = (project: Project) => {
    const weekUpdate = project.weeklyUpdates.find((u) => u.weekDate === currentWeek);
    const statusColor = STATUS_COLORS[project.status];

    return (
      <div className="flex flex-col h-full px-8 py-6 overflow-y-auto">
        {/* Project Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{project.name}</h2>
            <p className="text-gray-400">{project.owner || 'Unassigned'}</p>
          </div>
          <span className={`px-4 py-2 text-lg font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}>
            {STATUS_LABELS[project.status]}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Progress</span>
            <span className="text-2xl font-bold text-white">{weekUpdate?.progress || project.currentProgress}%</span>
          </div>
          <div className="h-4 rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${weekUpdate?.progress || project.currentProgress}%` }}
            />
          </div>
        </div>

        {weekUpdate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* Accomplishments */}
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="text-green-500" size={24} />
                <h3 className="text-xl font-semibold text-green-400">Accomplishments</h3>
              </div>
              <p className="text-gray-200 whitespace-pre-wrap">{weekUpdate.accomplishments}</p>
            </div>

            {/* Challenges */}
            {weekUpdate.challenges && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-yellow-500" size={24} />
                  <h3 className="text-xl font-semibold text-yellow-400">Challenges</h3>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">{weekUpdate.challenges}</p>
              </div>
            )}

            {/* Support Needed */}
            {weekUpdate.supportNeeded && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="text-red-500" size={24} />
                  <h3 className="text-xl font-semibold text-red-400">Support Needed</h3>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">{weekUpdate.supportNeeded}</p>
              </div>
            )}

            {/* Notes */}
            {weekUpdate.notes && (
              <div className="bg-gray-800/50 border border-gray-600/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="text-gray-400" size={24} />
                  <h3 className="text-xl font-semibold text-gray-300">Notes</h3>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">{weekUpdate.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderThankYouSlide = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="mb-8">
        <img src="/logo.svg" alt="Logo" className="w-20 h-20 mx-auto mb-6 opacity-80" />
      </div>
      <h2 className="text-5xl font-bold text-white mb-6">Thank You!</h2>
      <p className="text-2xl text-gray-300 mb-4">Questions & Discussion</p>
      <div className="text-gray-500 mt-8">
        <p>{formatWeekRange(currentWeek)}</p>
        {organizationName && <p className="mt-2">{organizationName}</p>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition"
        title="Exit presentation (Esc)"
      >
        <X size={24} className="text-gray-400" />
      </button>

      {/* Slide content */}
      <div className="h-full w-full flex flex-col">
        <div className="flex-1 overflow-hidden">
          {currentSlideData.type === 'title' && renderTitleSlide()}
          {currentSlideData.type === 'summary' && renderSummarySlide()}
          {currentSlideData.type === 'project' && renderProjectSlide(currentSlideData.project)}
          {currentSlideData.type === 'thankyou' && renderThankYouSlide()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 py-4 bg-gray-800/50">
          {/* Previous button */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="p-3 rounded-lg bg-gray-700/50 hover:bg-gray-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>

          {/* Slide dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition ${
                  index === currentSlide
                    ? 'bg-blue-500 scale-125'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="p-3 rounded-lg bg-gray-700/50 hover:bg-gray-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        </div>

        {/* Slide counter */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-gray-500 text-sm">
          {currentSlide + 1} / {totalSlides}
        </div>
      </div>
    </div>
  );
};

// Helper component for summary stats
const StatItem = ({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: number | string;
  label: string;
  color: string;
}) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-900/30 border-blue-500/30 text-blue-400',
    green: 'bg-green-900/30 border-green-500/30 text-green-400',
    yellow: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400',
    red: 'bg-red-900/30 border-red-500/30 text-red-400',
    purple: 'bg-purple-900/30 border-purple-500/30 text-purple-400',
    gray: 'bg-gray-800/50 border-gray-600/30 text-gray-400',
  };

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color]}`}>
      <Icon size={32} className="mb-3" />
      <div className="text-4xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
};

export default PresentationMode;
