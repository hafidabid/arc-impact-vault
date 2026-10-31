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
      },
    },
  },
  plugins: [],
}
