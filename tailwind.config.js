/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Master primary szín paletta - egy helyen módosítható az egész app színe
        primary: {
          DEFAULT: '#2563eb',  // blue-600 - fő szín
          light: '#3b82f6',    // blue-500 - hover, fókusz
          dark: '#1d4ed8',     // blue-700 - pressed state
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
