/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Evenly Dark Theme Colors - Exact match from app theme
        background: '#111111',
        foreground: '#e2e8f0',
        card: '#2c2825',
        'card-foreground': '#e2e8f0',
        popover: '#2c2825',
        'popover-foreground': '#e2e8f0',
        primary: {
          DEFAULT: '#818cf8',
          foreground: '#1e1b18',
        },
        secondary: {
          DEFAULT: '#3a3633',
          foreground: '#d1d5db',
        },
        muted: {
          DEFAULT: '#2c2825',
          foreground: '#9ca3af',
        },
        accent: {
          DEFAULT: '#484441',
          foreground: '#d1d5db',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#1e1b18',
        },
        border: '#3a3633',
        input: '#3a3633',
        ring: '#818cf8',
        chart: {
          '1': '#818cf8',
          '2': '#6366f1',
          '3': '#4f46e5',
          '4': '#4338ca',
          '5': '#3730a3',
        },
        sidebar: '#3a3633',
        'sidebar-foreground': '#e2e8f0',
        'sidebar-primary': '#818cf8',
        'sidebar-primary-foreground': '#1e1b18',
        'sidebar-accent': '#484441',
        'sidebar-accent-foreground': '#d1d5db',
        'sidebar-border': '#3a3633',
        'sidebar-ring': '#818cf8',
        // Tab bar colors
        'tab-bar-background': 'rgba(0, 0, 0, 0.1)',
        'tab-bar-border': 'rgba(255, 255, 255, 0.1)',
        'active-tab-background': 'rgba(129, 140, 248, 0.2)',
        'active-tab-border': 'rgba(129, 140, 248, 0.3)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.2' }],
        'sm': ['14px', { lineHeight: '1.4' }],
        'base': ['16px', { lineHeight: '1.6' }],
        'lg': ['18px', { lineHeight: '1.6' }],
        'xl': ['20px', { lineHeight: '1.6' }],
        '2xl': ['24px', { lineHeight: '1.2' }],
        '3xl': ['30px', { lineHeight: '1.2' }],
        '4xl': ['36px', { lineHeight: '1.2' }],
        '5xl': ['48px', { lineHeight: '1.2' }],
        '6xl': ['60px', { lineHeight: '1.1' }],
        '7xl': ['72px', { lineHeight: '1.1' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      letterSpacing: {
        tight: '-0.025em',
        normal: '-0.01em',
        wide: '0.01em',
      },
      lineHeight: {
        tight: '1.2',
        normal: '1.6',
        relaxed: '1.8',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(129, 140, 248, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(129, 140, 248, 0.6)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}