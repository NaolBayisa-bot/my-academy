export default {
  darkMode: 'class', // Enable class-based dark mode (dark class on <html>)
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // DARK palette as CSS custom properties (default)
        background: 'var(--color-background)',
        'surface-container-lowest': 'var(--color-surface-container-lowest)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        'surface-dim': 'var(--color-surface-dim)',
        'surface-bright': 'var(--color-surface-bright)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'primary': 'var(--color-primary)',
        'primary-container': 'var(--color-primary-container)',
        'on-primary': 'var(--color-on-primary)',
        'inverse-primary': 'var(--color-inverse-primary)',
        'primary-fixed': 'var(--color-primary-fixed)',
        'tertiary': 'var(--color-tertiary)',
        'tertiary-fixed': 'var(--color-tertiary-fixed)',
        'tertiary-container': 'var(--color-tertiary-container)',
        'error': 'var(--color-error)',
        'error-container': 'var(--color-error-container)',
        'on-error-container': 'var(--color-on-error-container)',
        'outline': 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        'secondary': 'var(--color-secondary)',
        'secondary-container': 'var(--color-secondary-container)',
        // Glow colors
        'glow-primary': 'var(--glow-primary)',
        'glow-tertiary': 'var(--glow-tertiary)',
        // Kinetic Glass accent (electric violet)
        violet: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      fontFamily: {
        geist: ['var(--font-geist)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-geist)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['1.5rem', { lineHeight: '1.3', fontWeight: '800', letterSpacing: '-0.02em' }],
        'headline-lg': ['1.25rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'headline-lg-mobile': ['1.25rem', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '-0.01em' }],
        'section-header': ['1rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.005em' }],
        'body-md': ['0.875rem', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.005em' }],
        'body-sm': ['0.75rem', { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.01em' }],
        'meta-label': ['0.625rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.015em', textTransform: 'uppercase' }],
      },
      borderRadius: {
        DEFAULT: '4px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}