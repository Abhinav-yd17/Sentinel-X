/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#07090f',
          secondary: '#0d1117',
          card: '#0f1623',
          hover: '#141d2e',
        },
        border: {
          DEFAULT: '#1a2332',
          active: '#22d3ee',
        },
        accent: {
          cyan: '#22d3ee',
          red: '#ef4444',
          amber: '#f59e0b',
          green: '#10b981',
          purple: '#8b5cf6',
        },
        risk: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
          critical: '#dc2626',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        glow: {
          from: { boxShadow: '0 0 5px rgba(34,211,238,0.2)' },
          to: { boxShadow: '0 0 20px rgba(34,211,238,0.5)' }
        }
      }
    }
  },
  plugins: [],
}
