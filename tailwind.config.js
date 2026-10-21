/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Remap default blue classes to the luxurious glossy dark green from Yazh Land Promoters logo
        blue: {
          50: '#edf9f3',
          100: '#d5f2e4',
          200: '#afe5cb',
          300: '#75d1ab',
          400: '#3bb586',
          500: '#189565',
          600: '#0e724a',
          700: '#0a5839',
          800: '#07432b',
          900: '#053221',
          950: '#031f14',
        },
        brand: {
          50: '#edf9f3',
          100: '#d5f2e4',
          200: '#afe5cb',
          300: '#75d1ab',
          400: '#3bb586',
          500: '#189565',
          600: '#0e724a',
          700: '#0a5839',
          800: '#07432b',
          900: '#053221',
          950: '#031f14',
        },
        forest: {
          50: '#edf9f3',
          100: '#d5f2e4',
          200: '#afe5cb',
          300: '#75d1ab',
          400: '#3bb586',
          500: '#189565',
          600: '#0e724a',
          700: '#0a5839',
          800: '#07432b',
          900: '#053221',
          950: '#031f14',
        },
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#d4af37', // metallic gold
          600: '#b88d1d',
          700: '#946d14',
          800: '#735210',
          900: '#52380a',
        },
        navy: {
          800: '#0b261b',
          900: '#061a12',
          950: '#030f0a',
        },
        status: {
          available: '#10b981', // Emerald green
          booked: '#2563eb',    // Distinguishable blue for booked plots
          onHold: '#7c3aed',    // Purple
          sold: '#ef4444',      // Red
          blocked: '#f97316',   // Orange
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        cinzel: ['Cinzel', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
