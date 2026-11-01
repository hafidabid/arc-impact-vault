/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        forest: '#164D42',
        sage: '#91AD9D',
        ivory: '#F8F8F3',
        gold: '#D7B36B',
        ink: '#20342F',
      },
      fontFamily: {
        sans: [
          '"Inter Variable"',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '16px',
        control: '12px',
      },
      spacing: {
        18: '4.5rem',
      },
      maxWidth: {
        content: '1200px',
        reading: '68ch',
      },
      boxShadow: {
        card: '0 1px 2px rgba(32, 52, 47, 0.05), 0 8px 24px -12px rgba(32, 52, 47, 0.16)',
        lift: '0 2px 4px rgba(32, 52, 47, 0.06), 0 18px 40px -16px rgba(32, 52, 47, 0.28)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 150ms ease-out both',
        // Signature motion; keyframes live in index.css so each one can resolve to its resting state.
        'contour-draw': 'contour-draw 1100ms cubic-bezier(0.33, 1, 0.68, 1) both',
        'contour-breathe': 'contour-breathe 9s ease-in-out 1100ms infinite',
        'wash-a': 'wash-a 15s ease-in-out infinite',
        'wash-b': 'wash-b 19s ease-in-out infinite',
        'field-slow': 'field-slow 34s ease-in-out infinite',
        'field-fast': 'field-fast 26s ease-in-out infinite',
        aurora: 'aurora 16s ease-in-out infinite',
        'ring-flow': 'ring-flow 16s linear infinite',
        'float-up': 'float-up var(--dur, 22s) linear var(--delay, 0s) infinite both',
        'timeline-travel': 'timeline-travel 1.1s linear infinite',
      },
    },
  },
  plugins: [],
}
