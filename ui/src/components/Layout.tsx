import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, FolderKanban, Moon, Sun, Menu, X, Play } from 'lucide-react';
import { useState } from 'react';
import { useUIStore } from '../stores/uiStore';
import { colors } from '../utils/darkMode';
import PresentationMode from './PresentationMode';

const Layout = () => {
  const { darkMode, toggleDarkMode, dashboardTitle, dashboardSubtitle } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);

  const navItems = [
    { to: '/', icon: BarChart3, label: 'Reports' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
  ];

  return (
    <div className={`min-h-screen ${colors.bgPrimary}`}>
      {/* Header */}
      <header className={`${colors.bgSecondary} border-b ${colors.border} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
              <div className="hidden sm:block">
                <h1 className={`text-lg font-bold ${colors.textPrimary}`}>
                  {dashboardTitle || 'عرض تقدم المشاريع'}
                </h1>
                <p className={`text-xs ${colors.textSecondary}`}>
                  {dashboardSubtitle || 'التقرير الأسبوعي'}
                </p>
              </div>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : `${colors.textSecondary} ${colors.hover}`
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center gap-2">
              {/* Present button */}
              <button
                onClick={() => setShowPresentation(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                title="Start presentation"
              >
                <Play size={18} />
                <span className="font-medium">Present</span>
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${colors.hover} transition`}
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                {darkMode ? (
                  <Sun size={20} className="text-yellow-500" />
                ) : (
                  <Moon size={20} className={colors.textSecondary} />
                )}
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg ${colors.hover} transition`}
              >
                {mobileMenuOpen ? (
                  <X size={24} className={colors.textPrimary} />
                ) : (
                  <Menu size={24} className={colors.textPrimary} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t ${colors.border} ${colors.bgSecondary}`}>
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : `${colors.textSecondary} ${colors.hover}`
                    }`
                  }
                >
                  <item.icon size={22} />
                  <span className="font-medium text-lg">{item.label}</span>
                </NavLink>
              ))}
              {/* Mobile Present Button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowPresentation(true);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white w-full"
              >
                <Play size={22} />
                <span className="font-medium text-lg">Present</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Presentation Mode */}
      <PresentationMode
        isOpen={showPresentation}
        onClose={() => setShowPresentation(false)}
      />
    </div>
  );
};

export default Layout;
