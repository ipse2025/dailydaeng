/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        surface: 'var(--color-surface)',
        bg: 'var(--color-bg)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
