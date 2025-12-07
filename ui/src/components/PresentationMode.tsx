import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  TrendingUp,
  LucideIcon,
  ArrowLeft,
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { Project, STATUS_LABELS, STATUS_COLORS } from '../types';
import { formatPresentationDate } from '../utils/dateUtils';

interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
}

const PresentationMode = ({ isOpen, onClose }: PresentationModeProps) => {
  const { projects, currentWeek } = useProjectStore();
  const { dashboardTitle, dashboardSubtitle, organizationName, darkMode } = useUIStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);

  // Theme colors based on dark/light mode - using forest green palette
  const theme = useMemo(() => darkMode ? {
    // Dark mode - forest green with dark neutrals
    background: 'linear-gradient(180deg, #0a1f12 0%, #0f2818 30%, #0a1f12 100%)',
    contentBg: 'rgba(10, 31, 18, 0.85)',
    cardBg: 'rgba(30, 91, 57, 0.15)',
    cardBorder: 'rgba(54, 125, 86, 0.3)',
    textPrimary: '#fafaf9',
    textSecondary: '#a8a29e',
    textMuted: '#78716c',
    accent: '#7da98c',
    accentLight: '#619d7a',
    progressBar: 'linear-gradient(90deg, rgba(97, 157, 122, 0.6) 0%, rgba(125, 169, 140, 0.9) 100%)',
    progressBg: 'rgba(30, 91, 57, 0.3)',
    navBg: 'rgba(30, 50, 38, 0.7)',
    waveOpacity: 0.2,
  } : {
    // Light mode - forest green with light neutrals
    background: 'linear-gradient(180deg, #f5f5f4 0%, #e7e5e4 50%, #f5f5f4 100%)',
    contentBg: 'rgba(255, 255, 255, 0.85)',
    cardBg: 'rgba(54, 125, 86, 0.08)',
    cardBorder: 'rgba(54, 125, 86, 0.25)',
    textPrimary: '#1c1917',
    textSecondary: '#57534e',
    textMuted: '#78716c',
    accent: '#367d56',
    accentLight: '#4b8b66',
    progressBar: 'linear-gradient(90deg, rgba(54, 125, 86, 0.7) 0%, rgba(75, 139, 102, 0.95) 100%)',
    progressBg: 'rgba(54, 125, 86, 0.15)',
    navBg: 'rgba(220, 237, 226, 0.9)',
    waveOpacity: 0.15,
  }, [darkMode]);

  // Get active projects (not completed)
  const activeProjects = useMemo(() =>
    projects.filter((p) =>
      (p.isActiveInPresentation ?? true) && p.status !== 'completed'
    ), [projects]
  );

  // Calculate summary stats
  const summaryStats = useMemo(() => ({
    total: projects.length,
    onTrack: projects.filter((p) => p.status === 'on_track').length,
    atRisk: projects.filter((p) => p.status === 'at_risk').length,
    delayed: projects.filter((p) => p.status === 'delayed').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    avgProgress: projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.currentProgress, 0) / projects.length)
      : 0,
  }), [projects]);

  // Progress chart data
  const progressChartData = useMemo(() =>
    projects.slice(0, 8).map((p) => ({
      name: p.name,
      progress: p.currentProgress,
      status: p.status,
    })), [projects]
  );

  // Build slides: Title, Summary Stats, Progress Chart, Individual Projects, Thank You
  const slides = useMemo(() => [
    { type: 'title' as const },
    { type: 'summary' as const },
    { type: 'progress-chart' as const },
    ...activeProjects.map(p => ({ type: 'project' as const, project: p })),
    { type: 'thankyou' as const },
  ], [activeProjects]);

  const totalSlides = slides.length;

  const goToSlide = useCallback(
    (index: number, direction?: 'next' | 'prev') => {
      if (index >= 0 && index < totalSlides && !isAnimating) {
        setIsAnimating(true);
        setSlideDirection(direction || (index > currentSlide ? 'next' : 'prev'));
        setTimeout(() => {
          setCurrentSlide(index);
          setIsAnimating(false);
        }, 50);
      }
    },
    [totalSlides, currentSlide, isAnimating]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1, 'next');
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1, 'prev');
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
          goToSlide(0, 'prev');
          break;
        case 'End':
          goToSlide(totalSlides - 1, 'next');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, onClose, totalSlides, goToSlide]);

  // Reset slide when closing
  useEffect(() => {
    if (!isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSlideData = slides[currentSlide];

  // Animation classes
  const getAnimationClass = () => {
    if (isAnimating) {
      return slideDirection === 'next'
        ? 'animate-slideOutLeft'
        : 'animate-slideOutRight';
    }
    return slideDirection === 'next'
      ? 'animate-slideInRight'
      : 'animate-slideInLeft';
  };

  const renderTitleSlide = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div
        className="rounded-2xl p-8 animate-scaleIn"
        style={{ background: theme.contentBg, animationDelay: '0.1s' }}
      >
        <div className="mb-6 animate-bounce-slow">
          <img src="/logo.svg" alt="Logo" className="w-28 h-28 mx-auto" />
        </div>
        {organizationName && (
          <div className="flex items-center justify-center gap-2 mb-4 animate-fadeInUp" style={{ color: theme.textSecondary, animationDelay: '0.2s' }}>
            <Building2 size={20} />
            <span className="text-lg">{organizationName}</span>
          </div>
        )}
        <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fadeInUp" style={{ color: theme.textPrimary, animationDelay: '0.3s' }}>
          {dashboardTitle || 'عرض تقدم المشاريع'}
        </h1>
        <p className="text-2xl mb-8 animate-fadeInUp" style={{ color: theme.textSecondary, animationDelay: '0.4s' }}>
          {dashboardSubtitle || 'التقرير الأسبوعي'}
        </p>
        <div
          className="rounded-xl px-8 py-4 animate-pulse-subtle"
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, animationDelay: '0.5s' }}
        >
          <p className="text-xl" style={{ color: theme.accent }}>{formatPresentationDate(currentWeek)}</p>
        </div>
      </div>
    </div>
  );

  const renderSummarySlide = () => (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div
        className="rounded-2xl p-8 w-full max-w-5xl"
        style={{ background: theme.contentBg }}
      >
        <h2 className="text-4xl font-bold mb-10 text-center animate-fadeInUp" style={{ color: theme.textPrimary }}>
          ملخص المشاريع
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <StatItem icon={BarChart3} value={summaryStats.total} label="إجمالي المشاريع" color="primary" delay={0.1} theme={theme} darkMode={darkMode} />
          <StatItem icon={CheckCircle2} value={summaryStats.onTrack} label="على المسار الصحيح" color="green" delay={0.15} theme={theme} darkMode={darkMode} />
          <StatItem icon={AlertTriangle} value={summaryStats.atRisk} label="متعثر" color="yellow" delay={0.2} theme={theme} darkMode={darkMode} />
          <StatItem icon={Clock} value={summaryStats.delayed} label="متأخر" color="red" delay={0.25} theme={theme} darkMode={darkMode} />
          <StatItem icon={Target} value={summaryStats.completed} label="مكتمل" color="purple" delay={0.3} theme={theme} darkMode={darkMode} />
          <StatItem icon={TrendingUp} value={`${summaryStats.avgProgress}%`} label="متوسط التقدم" color="primary" delay={0.35} theme={theme} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );

  const renderProgressChartSlide = () => (
    <div className="flex flex-col h-full px-8 py-8">
      <div
        className="rounded-2xl p-8 flex-1 flex flex-col max-w-5xl mx-auto w-full"
        style={{ background: theme.contentBg }}
      >
        <h2 className="text-4xl font-bold mb-8 text-center animate-fadeInUp" style={{ color: theme.textPrimary }}>
          التقدم حسب المشروع
        </h2>
        <div className="flex-1 flex flex-col justify-center space-y-4">
          {progressChartData.map((project, index) => (
            <div
              key={index}
              className="animate-slideInFromRight"
              style={{ animationDelay: `${0.1 + index * 0.08}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-medium" style={{ color: theme.textPrimary }}>{project.name}</span>
                <span className="text-lg font-bold animate-countUp" style={{ color: theme.accent }}>{project.progress}%</span>
              </div>
              <div className="h-8 rounded-lg overflow-hidden" style={{ background: theme.progressBg }}>
                <div
                  className="h-full rounded-lg animate-progressGrow"
                  style={{
                    '--progress': `${project.progress}%`,
                    width: 0,
                    background: theme.progressBar,
                    animationDelay: `${0.3 + index * 0.1}s`,
                  } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProjectSlide = (project: Project) => {
    const statusColor = STATUS_COLORS[project.status];
    // Get latest update
    const latestUpdate = project.weeklyUpdates.length > 0
      ? project.weeklyUpdates.reduce((latest, update) =>
          new Date(update.weekDate) > new Date(latest.weekDate) ? update : latest
        )
      : null;

    const accomplishments = latestUpdate
      ? (Array.isArray(latestUpdate.accomplishments)
          ? latestUpdate.accomplishments
          : latestUpdate.accomplishments.split('\n').filter((line: string) => line.trim()))
      : [];

    const challenges = latestUpdate?.challenges
      ? (Array.isArray(latestUpdate.challenges)
          ? latestUpdate.challenges
          : latestUpdate.challenges.split('\n').filter((line: string) => line.trim()))
      : [];

    const nextSteps = latestUpdate?.nextSteps || [];

    // Colors for cards based on theme
    const cardColors = {
      green: {
        bg: darkMode ? 'rgba(30, 91, 57, 0.25)' : 'rgba(54, 125, 86, 0.1)',
        border: darkMode ? 'rgba(97, 157, 122, 0.4)' : 'rgba(54, 125, 86, 0.3)',
        icon: darkMode ? '#7da98c' : '#367d56',
        title: darkMode ? '#7da98c' : '#2b6a46',
      },
      blue: {
        bg: darkMode ? 'rgba(30, 64, 175, 0.2)' : 'rgba(59, 130, 246, 0.1)',
        border: darkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.3)',
        icon: darkMode ? '#60a5fa' : '#2563eb',
        title: darkMode ? '#93c5fd' : '#1d4ed8',
      },
      amber: {
        bg: darkMode ? 'rgba(180, 83, 9, 0.2)' : 'rgba(245, 158, 11, 0.1)',
        border: darkMode ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)',
        icon: darkMode ? '#fbbf24' : '#d97706',
        title: darkMode ? '#fcd34d' : '#b45309',
      },
    };

    return (
      <div className="flex flex-col items-center justify-center h-full px-12 py-8">
        <div
          className="w-full max-w-5xl rounded-2xl p-6"
          style={{ background: theme.contentBg }}
        >
          {/* Project Header */}
          <div className="flex items-center justify-between mb-4 animate-fadeInUp">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: theme.textPrimary }}>{project.name}</h2>
              <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>المسؤول: {project.owner || 'غير محدد'}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${statusColor.bg} ${statusColor.text}`}>
                {STATUS_LABELS[project.status]}
              </span>
              <div className="text-center">
                <span className="text-2xl font-bold" style={{ color: theme.accent }}>{project.currentProgress}%</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: theme.progressBg }}>
              <div
                className="h-full rounded-full animate-progressGrow"
                style={{
                  '--progress': `${project.currentProgress}%`,
                  width: 0,
                  background: theme.progressBar,
                  animationDelay: '0.3s',
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Three Column Grid - Compact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Accomplishments */}
            <div
              className="rounded-lg p-4 animate-slideInFromBottom"
              style={{ background: cardColors.green.bg, border: `1px solid ${cardColors.green.border}`, animationDelay: '0.2s' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={18} style={{ color: cardColors.green.icon }} />
                <h3 className="text-base font-semibold" style={{ color: cardColors.green.title }}>ما تم إنجازه</h3>
              </div>
              {accomplishments.length > 0 ? (
                <ul className="space-y-1.5">
                  {accomplishments.slice(0, 4).map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: theme.textPrimary }}>
                      <ArrowLeft size={14} style={{ color: cardColors.green.icon }} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                  {accomplishments.length > 4 && (
                    <li className="text-xs" style={{ color: theme.textMuted }}>+{accomplishments.length - 4} المزيد</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: theme.textMuted }}>لا يوجد</p>
              )}
            </div>

            {/* Next Steps */}
            <div
              className="rounded-lg p-4 animate-slideInFromBottom"
              style={{ background: cardColors.blue.bg, border: `1px solid ${cardColors.blue.border}`, animationDelay: '0.3s' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} style={{ color: cardColors.blue.icon }} />
                <h3 className="text-base font-semibold" style={{ color: cardColors.blue.title }}>الخطوات القادمة</h3>
              </div>
              {nextSteps.length > 0 ? (
                <ul className="space-y-1.5">
                  {nextSteps.slice(0, 4).map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: theme.textPrimary }}>
                      <ArrowLeft size={14} style={{ color: cardColors.blue.icon }} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                  {nextSteps.length > 4 && (
                    <li className="text-xs" style={{ color: theme.textMuted }}>+{nextSteps.length - 4} المزيد</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: theme.textMuted }}>لا يوجد</p>
              )}
            </div>

            {/* Challenges */}
            <div
              className="rounded-lg p-4 animate-slideInFromBottom"
              style={{ background: cardColors.amber.bg, border: `1px solid ${cardColors.amber.border}`, animationDelay: '0.4s' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} style={{ color: cardColors.amber.icon }} />
                <h3 className="text-base font-semibold" style={{ color: cardColors.amber.title }}>التحديات</h3>
              </div>
              {challenges.length > 0 ? (
                <ul className="space-y-1.5">
                  {challenges.slice(0, 4).map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: theme.textPrimary }}>
                      <ArrowLeft size={14} style={{ color: cardColors.amber.icon }} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                  {challenges.length > 4 && (
                    <li className="text-xs" style={{ color: theme.textMuted }}>+{challenges.length - 4} المزيد</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: theme.textMuted }}>لا يوجد</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderThankYouSlide = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div
        className="rounded-2xl p-10 animate-scaleIn"
        style={{ background: theme.contentBg }}
      >
        <div className="mb-6 animate-bounce-slow" style={{ animationDelay: '0.1s' }}>
          <img src="/logo.svg" alt="Logo" className="w-28 h-28 mx-auto" />
        </div>
        <h2 className="text-5xl md:text-6xl font-bold mb-6 animate-fadeInUp" style={{ color: theme.textPrimary, animationDelay: '0.2s' }}>
          شكراً لكم!
        </h2>
        {organizationName && (
          <p className="text-xl animate-fadeInUp" style={{ color: theme.textSecondary, animationDelay: '0.3s' }}>
            {organizationName}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100]" style={{ background: theme.background }}>
      {/* Decorative Wave Pattern */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '180px',
          background: 'transparent',
          zIndex: 10,
        }}
      >
        <div
          className="animate-waveShift"
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/wave-pattern.svg)',
            backgroundSize: '50vw auto',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'repeat-x',
            opacity: 0.35,
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
          }}
        />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-100px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(100px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(-100px) scale(0.95); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(100px) scale(0.95); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromBottom {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressGrow {
          from {
            width: 0%;
            opacity: 0.5;
          }
          to {
            width: var(--progress);
            opacity: 1;
          }
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseSubtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-slideInRight {
          animation: slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .animate-slideOutLeft {
          animation: slideOutLeft 0.4s ease-out forwards;
        }
        .animate-slideOutRight {
          animation: slideOutRight 0.4s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
        .animate-slideInFromRight {
          animation: slideInFromRight 0.5s ease-out forwards;
          opacity: 0;
        }
        .animate-slideInFromBottom {
          animation: slideInFromBottom 0.5s ease-out forwards;
          opacity: 0;
        }
        .animate-progressGrow {
          animation: progressGrow 1.2s ease-out forwards;
        }
        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
        .animate-pulse-subtle {
          animation: pulseSubtle 2s ease-in-out infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes waveShift {
          0% {
            background-position-x: 0%;
          }
          100% {
            background-position-x: 100%;
          }
        }
        .animate-waveShift {
          animation: waveShift 60s linear infinite;
        }
      `}</style>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 p-2 rounded-lg transition"
        style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
        title="Exit presentation (Esc)"
      >
        <X size={24} style={{ color: theme.textSecondary }} />
      </button>

      {/* Slide content */}
      <div className="h-full w-full flex flex-col" style={{ position: 'relative', zIndex: 1 }}>
        <div className={`flex-1 overflow-hidden ${getAnimationClass()}`} key={currentSlide}>
          {currentSlideData.type === 'title' && renderTitleSlide()}
          {currentSlideData.type === 'summary' && renderSummarySlide()}
          {currentSlideData.type === 'progress-chart' && renderProgressChartSlide()}
          {currentSlideData.type === 'project' && renderProjectSlide(currentSlideData.project)}
          {currentSlideData.type === 'thankyou' && renderThankYouSlide()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-8 py-4">
          {/* Previous button (on left side) - arrow points RIGHT showing "go back" direction */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0 || isAnimating}
            className="p-3 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
            title="السابق"
          >
            <ChevronRight size={28} style={{ color: theme.textPrimary }} />
          </button>

          {/* Slide indicator */}
          <div className="flex items-center gap-3">
            <span className="text-sm ml-4" style={{ color: theme.textSecondary }}>
              {currentSlide + 1} / {totalSlides}
            </span>
            <div className="flex items-center gap-1.5">
              {slides.map((slide, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  disabled={isAnimating}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: index === currentSlide ? '2rem' : '0.75rem',
                    height: '0.75rem',
                    background: index === currentSlide ? theme.accent : theme.textMuted,
                    opacity: index === currentSlide ? 1 : 0.4,
                  }}
                  title={slide.type === 'project' ? slide.project.name : ''}
                />
              ))}
            </div>
          </div>

          {/* Next button (on right side) - arrow points LEFT showing "go forward" direction in RTL */}
          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1 || isAnimating}
            className="p-3 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
            title="التالي"
          >
            <ChevronLeft size={28} style={{ color: theme.textPrimary }} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Theme type for StatItem
type Theme = {
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  [key: string]: string | number;
};

// Helper component for summary stats
const StatItem = ({
  icon: Icon,
  value,
  label,
  color,
  delay = 0,
  theme,
  darkMode,
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
  color: string;
  delay?: number;
  theme: Theme;
  darkMode: boolean;
}) => {
  // Color styles based on color prop and theme
  const getColorStyles = () => {
    const colors: Record<string, { bg: string; border: string; icon: string; label: string }> = {
      primary: {
        bg: darkMode ? 'rgba(30, 91, 57, 0.25)' : 'rgba(54, 125, 86, 0.1)',
        border: darkMode ? 'rgba(97, 157, 122, 0.4)' : 'rgba(54, 125, 86, 0.3)',
        icon: darkMode ? '#7da98c' : '#367d56',
        label: darkMode ? '#7da98c' : '#2b6a46',
      },
      green: {
        bg: darkMode ? 'rgba(30, 91, 57, 0.25)' : 'rgba(54, 125, 86, 0.1)',
        border: darkMode ? 'rgba(97, 157, 122, 0.4)' : 'rgba(54, 125, 86, 0.3)',
        icon: darkMode ? '#7da98c' : '#367d56',
        label: darkMode ? '#7da98c' : '#2b6a46',
      },
      yellow: {
        bg: darkMode ? 'rgba(180, 83, 9, 0.2)' : 'rgba(245, 158, 11, 0.1)',
        border: darkMode ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)',
        icon: darkMode ? '#fbbf24' : '#d97706',
        label: darkMode ? '#fcd34d' : '#b45309',
      },
      red: {
        bg: darkMode ? 'rgba(153, 27, 27, 0.2)' : 'rgba(220, 38, 38, 0.1)',
        border: darkMode ? 'rgba(248, 113, 113, 0.3)' : 'rgba(220, 38, 38, 0.3)',
        icon: darkMode ? '#f87171' : '#dc2626',
        label: darkMode ? '#fca5a5' : '#b91c1c',
      },
      purple: {
        bg: darkMode ? 'rgba(88, 28, 135, 0.2)' : 'rgba(147, 51, 234, 0.1)',
        border: darkMode ? 'rgba(167, 139, 250, 0.3)' : 'rgba(147, 51, 234, 0.3)',
        icon: darkMode ? '#a78bfa' : '#9333ea',
        label: darkMode ? '#c4b5fd' : '#7c3aed',
      },
    };
    return colors[color] || colors.primary;
  };

  const colorStyles = getColorStyles();

  return (
    <div
      className="rounded-xl p-5 animate-scaleIn"
      style={{
        background: colorStyles.bg,
        border: `1px solid ${colorStyles.border}`,
        animationDelay: `${delay}s`,
      }}
    >
      <Icon size={28} className="mb-2" style={{ color: colorStyles.icon }} />
      <div className="text-3xl font-bold mb-1" style={{ color: theme.textPrimary }}>{value}</div>
      <div className="text-sm" style={{ color: colorStyles.label }}>{label}</div>
    </div>
  );
};

export default PresentationMode;
