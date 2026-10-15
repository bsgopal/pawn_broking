/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        renic: {
          lime: '#84cc16',
          limeDark: '#65a30d',
          limeLight: '#a3e635',
          slate: '#0f172a',
          slateLight: '#1e293b',
          slateDark: '#020617',
          gold: '#C5A059',
          goldLight: '#E6CA85',
          bg: '#f8fafc',
          border: '#e2e8f0'
        },
        malabar: {
          burgundy: '#0f172a', // Unified to Obsidian Slate
          deep: '#020617',
          gold: '#84cc16',     // Unified to Lime
          lightGold: '#a3e635',
          cream: '#f8fafc',
          dark: '#0f172a',
          surface: '#ffffff',
          border: '#e2e8f0'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
