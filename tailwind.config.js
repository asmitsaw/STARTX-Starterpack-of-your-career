/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // STARTX Palette: professional yet vibrant
        startx: {
          50:  '#f2f7ff',
          100: '#e6f0ff',
          200: '#cce0ff',
          300: '#99c2ff',
          400: '#66a3ff',
          500: '#3b82f6', // primary
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        success: {
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
        },
        brand: {
          green: '#1db954',
        },
        dark: {
          950: '#0d0d0d',
          900: '#121212',
          800: '#1a1a1a',
          700: '#222222',
          600: '#2a2a2a',
        }
      },
      boxShadow: {
        card: '0 8px 24px rgba(0, 0, 0, 0.35)'
      }
    },
  },
  plugins: [],
}


