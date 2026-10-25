/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1f2430',
        paper: '#ffffff',
        brand: { 50: '#eef6ff', 100: '#d9eaff', 500: '#2f7df6', 600: '#1f64d8', 700: '#184fae' },
        sun: '#ffb703',
      },
      fontFamily: { sans: ['"Trebuchet MS"', '"Segoe UI"', 'system-ui', 'sans-serif'] },
      keyframes: { pop: { '0%': { transform: 'scale(.92)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } } },
      animation: { pop: 'pop .18s ease-out' },
    },
  },
  plugins: [],
}
