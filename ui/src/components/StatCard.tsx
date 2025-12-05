import { LucideIcon } from 'lucide-react';
import { colors } from '../utils/darkMode';

interface StatCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  trend?: { value: number; isPositive: boolean };
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    icon: 'text-green-600 dark:text-green-400',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    icon: 'text-red-600 dark:text-red-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-700/30',
    text: 'text-gray-600 dark:text-gray-400',
    icon: 'text-gray-600 dark:text-gray-400',
  },
};

const StatCard = ({ icon: Icon, value, label, color, trend }: StatCardProps) => {
  const colorConfig = colorClasses[color];

  return (
    <div className={`${colors.bgSecondary} rounded-xl p-4 shadow-md border ${colors.border} hover:shadow-lg transition-shadow`}>
      <div className={`w-10 h-10 rounded-lg ${colorConfig.bg} flex items-center justify-center mb-3`}>
        <Icon size={20} className={colorConfig.icon} />
      </div>
      <div className={`text-2xl font-bold ${colors.textPrimary} mb-1`}>{value}</div>
      <div className={`text-sm ${colors.textSecondary}`}>{label}</div>
      {trend && (
        <div className={`text-xs mt-2 flex items-center gap-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className={colors.textTertiary}>vs last week</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
