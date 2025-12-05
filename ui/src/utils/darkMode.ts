export const colors = {
  bgPrimary: 'bg-[rgb(var(--color-bg-primary))]',
  bgSecondary: 'bg-[rgb(var(--color-bg-secondary))]',
  bgTertiary: 'bg-[rgb(var(--color-bg-tertiary))]',
  bgHover: 'bg-[rgb(var(--color-bg-hover))]',

  textPrimary: 'text-[rgb(var(--color-text-primary))]',
  textSecondary: 'text-[rgb(var(--color-text-secondary))]',
  textTertiary: 'text-[rgb(var(--color-text-tertiary))]',

  border: 'border-[rgb(var(--color-border))]',
  borderHover: 'border-[rgb(var(--color-border-hover))]',

  inputBg: 'bg-[rgb(var(--color-input-bg))]',
  inputBorder: 'border-[rgb(var(--color-input-border))]',
  inputText: 'text-[rgb(var(--color-input-text))]',
  inputPlaceholder: 'placeholder:text-[rgb(var(--color-input-placeholder))]',

  primary: 'bg-[rgb(var(--color-primary))]',
  primaryHover: 'hover:bg-[rgb(var(--color-primary-hover))]',
  primaryText: 'text-[rgb(var(--color-primary-text))]',
  primaryTextHover: 'hover:text-[rgb(var(--color-primary-text-hover))]',
  primaryLight: 'bg-[rgb(var(--color-primary-light))]',
  primaryBorder: 'border-[rgb(var(--color-primary-border))]',
  primaryIcon: 'text-[rgb(var(--color-primary-icon))]',

  focusRing: 'focus:ring-2 focus:ring-[rgb(var(--color-focus-ring))] focus:border-transparent',

  success: 'text-[rgb(var(--color-success))]',
  successBg: 'bg-[rgb(var(--color-success))]',
  successLight: 'bg-[rgb(var(--color-success-light))]',

  warning: 'text-[rgb(var(--color-warning))]',
  warningBg: 'bg-[rgb(var(--color-warning))]',
  warningLight: 'bg-[rgb(var(--color-warning-light))]',

  error: 'text-[rgb(var(--color-error))]',
  errorBg: 'bg-[rgb(var(--color-error))]',
  errorLight: 'bg-[rgb(var(--color-error-light))]',

  info: 'text-[rgb(var(--color-info))]',
  infoBg: 'bg-[rgb(var(--color-info))]',
  infoLight: 'bg-[rgb(var(--color-info-light))]',

  hover: 'hover:bg-[rgb(var(--color-bg-hover))]',
};

export const patterns = {
  page: `min-h-screen ${colors.bgPrimary} ${colors.textPrimary}`,
  section: `${colors.bgSecondary} rounded-xl shadow-lg`,
  panel: `${colors.bgSecondary} p-6 rounded-lg border ${colors.border}`,
  card: `${colors.bgSecondary} border ${colors.border}`,
  button: `${colors.primary} ${colors.primaryHover} text-white rounded-lg transition shadow-md`,
  buttonOutline: `border-2 ${colors.primaryBorder} ${colors.primaryText} ${colors.primaryTextHover} hover:${colors.primaryLight} rounded-lg transition`,
  link: `${colors.primaryText} ${colors.primaryTextHover} font-medium transition`,
  input: `${colors.inputBg} ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} ${colors.focusRing} border rounded-lg`,
};
