/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0f0f11',
        darkSurface: '#18181b',
        darkCard: '#1f1f23',
        darkBorder: '#2e2e34',
        darkMuted: '#9ca3af',
        accentGold: '#d97706',
        accentSage: '#059669',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
