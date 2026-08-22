/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Legacy pcb-* tokens kept for backward compatibility
        pcb: {
          dark:    "#09090b",
          card:    "#18181b",
          accent:  "#4f46e5",
          border:  "#27272a",
          danger:  "#ef4444",
          warning: "#f59e0b",
        },
      },
      animation: {
        'scan': 'scan 2.4s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.3s ease-out both',
      },
      keyframes: {
        scan: {
          '0%':   { top: '-10%' },
          '100%': { top: '110%' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':      { opacity: '1',   transform: 'scale(1.08)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};