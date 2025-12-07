import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { colors } from '../utils/darkMode';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  maxDate?: string;
  minDate?: string;
  label?: string;
  showNavArrows?: boolean;
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ARABIC_DAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const DatePicker = memo(({ value, onChange, maxDate, minDate, label, showNavArrows = true }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update view when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewDate({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [value]);

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return 'اختر تاريخ';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = ARABIC_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const isDateDisabled = (dateStr: string): boolean => {
    if (maxDate && dateStr > maxDate) return true;
    if (minDate && dateStr < minDate) return true;
    return false;
  };

  const handlePrevMonth = () => {
    setViewDate(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!isDateDisabled(dateStr)) {
      onChange(dateStr);
      setIsOpen(false);
    }
  };

  const handlePrevDay = useCallback(() => {
    const current = new Date(value);
    current.setDate(current.getDate() - 1);
    const newDate = current.toISOString().split('T')[0];
    if (!isDateDisabled(newDate)) {
      onChange(newDate);
    }
  }, [value, onChange, minDate]);

  const handleNextDay = useCallback(() => {
    const current = new Date(value);
    current.setDate(current.getDate() + 1);
    const newDate = current.toISOString().split('T')[0];
    if (!isDateDisabled(newDate)) {
      onChange(newDate);
    }
  }, [value, onChange, maxDate]);

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
    const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const selectedDate = value ? new Date(value) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div
        className={`absolute top-full mt-2 right-0 z-50 ${colors.bgSecondary} rounded-xl shadow-2xl border ${colors.border} p-4 w-80`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Month/Year Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handleNextMonth}
            className={`p-2 rounded-lg ${colors.hover} transition`}
          >
            <ChevronLeft size={18} className={colors.textPrimary} />
          </button>
          <div className={`text-base font-bold ${colors.textPrimary}`}>
            {ARABIC_MONTHS[viewDate.month]} {viewDate.year}
          </div>
          <button
            type="button"
            onClick={handlePrevMonth}
            className={`p-2 rounded-lg ${colors.hover} transition`}
          >
            <ChevronRight size={18} className={colors.textPrimary} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {ARABIC_DAYS.map((day) => (
            <div
              key={day}
              className={`text-center text-xs font-medium ${colors.textSecondary} py-1`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="p-2" />;
            }

            const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate &&
              day === selectedDate.getDate() &&
              viewDate.month === selectedDate.getMonth() &&
              viewDate.year === selectedDate.getFullYear();
            const isToday =
              day === today.getDate() &&
              viewDate.month === today.getMonth() &&
              viewDate.year === today.getFullYear();
            const disabled = isDateDisabled(dateStr);

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDayClick(day)}
                disabled={disabled}
                className={`
                  p-2 rounded-lg text-sm font-medium transition-all
                  ${isSelected
                    ? 'bg-[#367d56] text-white shadow-md'
                    : isToday
                      ? 'bg-[#dceee2] dark:bg-[#1e5b39]/40 text-[#2b6a46] dark:text-[#7da98c] border border-[#7da98c] dark:border-[#2b6a46]'
                      : disabled
                        ? `${colors.textTertiary} cursor-not-allowed opacity-40`
                        : `${colors.textPrimary} ${colors.hover}`
                  }
                  ${!disabled && !isSelected && 'hover:bg-[#dceee2] dark:hover:bg-[#1e5b39]/30'}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              const todayStr = new Date().toISOString().split('T')[0];
              if (!isDateDisabled(todayStr)) {
                onChange(todayStr);
                setIsOpen(false);
              }
            }}
            className={`text-sm ${colors.primaryText} hover:underline`}
          >
            اليوم
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={`text-sm ${colors.textSecondary} hover:underline`}
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  };

  const nextDayDisabled = maxDate && value ? new Date(value) >= new Date(maxDate) : false;
  const prevDayDisabled = minDate && value ? new Date(value) <= new Date(minDate) : false;

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${colors.textPrimary}`}>
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        {showNavArrows && (
          <button
            type="button"
            onClick={handlePrevDay}
            disabled={prevDayDisabled}
            className={`p-2.5 rounded-lg ${colors.bgTertiary} ${colors.hover} transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100`}
            title="اليوم السابق"
          >
            <ChevronRight size={18} className={colors.textPrimary} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border ${colors.border} ${colors.bgTertiary} ${colors.hover} transition-all cursor-pointer`}
        >
          <Calendar size={20} className="text-[#367d56] dark:text-[#7da98c]" />
          <span className={`text-sm font-medium ${colors.textPrimary}`}>
            {formatDisplayDate(value)}
          </span>
        </button>

        {showNavArrows && (
          <button
            type="button"
            onClick={handleNextDay}
            disabled={nextDayDisabled}
            className={`p-2.5 rounded-lg ${colors.bgTertiary} ${colors.hover} transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100`}
            title="اليوم التالي"
          >
            <ChevronLeft size={18} className={colors.textPrimary} />
          </button>
        )}
      </div>

      {isOpen && renderCalendar()}
    </div>
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;
