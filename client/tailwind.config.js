export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          default: '#38d7ff',
          strong: '#15c3f2',
          soft: 'rgba(56, 215, 255, 0.18)',
        },
        green: {
          default: '#2dd4a7',
          soft: 'rgba(45, 212, 167, 0.18)',
        },
        purple: {
          DEFAULT: '#9c7bff',
        },
        pink: {
          DEFAULT: '#f170d9',
        },
        blue: {
          DEFAULT: '#66b6ff',
        },
        muted: '#95a9bc',
        body: '#020b17',
        bg2: '#050f1d',
        panel: 'rgba(12, 21, 34, 0.86)',
        'panel-strong': 'rgba(13, 22, 35, 0.96)',
        'panel-soft': 'rgba(18, 30, 46, 0.88)',
      },
      backgroundImage: {
        'gradient-cyan': 'linear-gradient(135deg, #38d7ff, #15c3f2)',
        'gradient-green': 'linear-gradient(135deg, #2dd4a7, #8b5936)',
        'gradient-purple': 'linear-gradient(135deg, #9c7bff, #8b5cf6)',
        'gradient-pink': 'linear-gradient(135deg, #f170d9, #ec4899)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatGlow: {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '0.7' },
          '50%': { transform: 'translateY(-10px)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(56, 215, 255, 0.15)' },
          '50%': { boxShadow: '0 0 24px rgba(56, 215, 255, 0.18)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floating: {
          '0%, 100%': { transform: 'translateY(0) rotateX(0deg)' },
          '50%': { transform: 'translateY(-8px) rotateX(1deg)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s ease both',
        floatGlow: 'floatGlow 6s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2.8s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        floating: 'floating 6s ease-in-out infinite',
        popIn: 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        fadeIn: 'fadeIn 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
}