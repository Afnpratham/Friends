/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: {
          DEFAULT: '#030014',
          secondary: '#05051A',
          tertiary: '#090B2A',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          medium: 'rgba(255, 255, 255, 0.06)',
          heavy: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.10)',
          border: 'rgba(255, 255, 255, 0.10)',
        },
        primary: {
          DEFAULT: '#8B5CF6',
          deep: '#7C3AED',
          hover: '#A78BFA',
          muted: 'rgba(139, 92, 246, 0.15)',
          foreground: '#ffffff',
        },
        indigo: {
          DEFAULT: '#6366F1',
          muted: 'rgba(99, 102, 241, 0.15)',
        },
        accent: {
          DEFAULT: '#22D3EE',
          hover: '#06B6D4',
          muted: 'rgba(34, 211, 238, 0.15)',
          pink: '#D946EF',
          'pink-muted': 'rgba(217, 70, 239, 0.15)',
        },
        success: {
          DEFAULT: '#10B981',
          muted: 'rgba(16, 185, 129, 0.15)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          muted: 'rgba(245, 158, 11, 0.15)',
        },
        danger: {
          DEFAULT: '#EF4444',
          muted: 'rgba(239, 68, 68, 0.15)',
        },
        muted: {
          DEFAULT: '#94A3B8',
          foreground: '#64748B',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.25), transparent)',
        'gradient-card': 'linear-gradient(135deg, rgba(5,5,26,0.8) 0%, rgba(9,11,42,0.8) 100%)',
        'gradient-primary': 'linear-gradient(135deg, #8B5CF6, #6366F1)',
        'gradient-primary-hover': 'linear-gradient(135deg, #A78BFA, #22D3EE)',
        'gradient-border': 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(34,211,238,0.3))',
        'gradient-aurora':
          'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.1), rgba(217,70,239,0.1), rgba(139,92,246,0.15))',
        'gradient-glow':
          'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.2), transparent 50%)',
      },
      boxShadow: {
        'glow-primary': '0 0 30px rgba(139, 92, 246, 0.3)',
        'glow-primary-lg': '0 0 50px rgba(139, 92, 246, 0.4)',
        'glow-accent': '0 0 30px rgba(34, 211, 238, 0.3)',
        'glow-pink': '0 0 30px rgba(217, 70, 239, 0.3)',
        'glow-sm': '0 0 15px rgba(139, 92, 246, 0.2)',
        'glow-success': '0 0 25px rgba(16, 185, 129, 0.25)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glass-lg': '0 24px 80px rgba(0, 0, 0, 0.35)',
        'neon-violet':
          '0 0 5px rgba(139,92,246,0.4), 0 0 20px rgba(139,92,246,0.2), 0 0 40px rgba(139,92,246,0.1)',
        'neon-cyan':
          '0 0 5px rgba(34,211,238,0.4), 0 0 20px rgba(34,211,238,0.2), 0 0 40px rgba(34,211,238,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        shimmer: 'shimmer 2s infinite',
        'bounce-dot': 'bounceDot 1.4s infinite ease-in-out both',
        aurora: 'aurora 15s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 6s ease-in-out infinite',
        'blob-drift': 'blobDrift 20s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        borderGlow: {
          '0%': { opacity: '0.5' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.5' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        blobDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '50%': { transform: 'translate(-20px, 20px) scale(0.95)' },
          '75%': { transform: 'translate(10px, -10px) scale(1.02)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
