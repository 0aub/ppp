import { colors } from '../utils/darkMode';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner = ({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) => {
  const sizeConfig = {
    sm: { container: 64, logo: 20, dot: 5, radius: 24 },
    md: { container: 88, logo: 28, dot: 6, radius: 34 },
    lg: { container: 120, logo: 40, dot: 8, radius: 48 },
  };

  const config = sizeConfig[size];
  const dots = 8;

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className="relative"
        style={{ width: config.container, height: config.container }}
      >
        {/* Orbiting dots */}
        {Array.from({ length: dots }).map((_, i) => {
          const angle = (i * 360) / dots;
          const delay = i * (1 / dots);
          return (
            <div
              key={i}
              className="absolute rounded-full bg-blue-500"
              style={{
                width: config.dot,
                height: config.dot,
                left: '50%',
                top: '50%',
                marginLeft: -config.dot / 2,
                marginTop: -config.dot / 2,
                transform: `rotate(${angle}deg) translateY(-${config.radius}px)`,
                animation: `orbit 1.2s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                opacity: 0.3 + (i / dots) * 0.7,
              }}
            />
          );
        })}

        {/* Center logo */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{ width: config.logo, height: config.logo }}
        >
          <svg viewBox="0 0 64 64" className="w-full h-full">
            <rect x="12" y="38" width="10" height="16" rx="2" fill="#3B82F6" opacity="0.7"/>
            <rect x="27" y="28" width="10" height="26" rx="2" fill="#3B82F6" opacity="0.85"/>
            <rect x="42" y="18" width="10" height="36" rx="2" fill="#3B82F6"/>
          </svg>
        </div>
      </div>

      {text && (
        <p className={`text-sm ${colors.textSecondary} animate-pulse`}>{text}</p>
      )}

      <style>{`
        @keyframes orbit {
          0%, 100% {
            opacity: 0.3;
            transform: rotate(var(--angle)) translateY(var(--radius)) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: rotate(var(--angle)) translateY(var(--radius)) scale(1.2);
          }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${colors.bgPrimary}`}>
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
