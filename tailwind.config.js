/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // JV Constructions Brand Palette: Deep Architectural Navy & Vibrant Emerald Teal
        blue: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f8',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0b3b64',
          950: '#062542',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f8',
          500: '#0b3b64',
          600: '#093457',
          700: '#072a47',
          800: '#052037',
          900: '#031728',
          950: '#020d17',
        },
        jvTeal: {
          50: '#effbf9',
          100: '#cbf4ee',
          200: '#98e9de',
          300: '#5cd7c7',
          400: '#2cbda9',
          500: '#16897b',
          600: '#0f766a',
          700: '#105e56',
          800: '#114b45',
          900: '#123f3b',
        },
        forest: {
          50: '#effbf9',
          100: '#cbf4ee',
          200: '#98e9de',
          300: '#5cd7c7',
          400: '#2cbda9',
          500: '#16897b',
          600: '#0f766a',
          700: '#105e56',
          800: '#114b45',
          900: '#123f3b',
        },
        gold: {
          50: '#effbf9',
          100: '#cbf4ee',
          200: '#98e9de',
          300: '#5cd7c7',
          400: '#2cbda9',
          500: '#16897b', // Re-routed gold highlights to JV Teal
          600: '#0f766a',
          700: '#105e56',
          800: '#114b45',
          900: '#123f3b',
        },
        amber: {
          50: '#f0f7ff', 100: '#e0effe', 200: '#bae0fd', 300: '#7cc5fb', 400: '#38a5f8',
          500: '#0284c7', 600: '#0369a1', 700: '#075985', 800: '#0c4a6e', 900: '#0b3b64', 950: '#062542',
        },
        navy: {
          800: '#0c3757',
          900: '#082841',
          950: '#041624',
        },
        // DO NOT TOUCH: Plot viewing status indicators & plot layout borders
        status: {
          available: '#10b981', // Emerald green
          booked: '#2563eb',    // Distinguishable blue for booked plots
          onHold: '#7c3aed',    // Purple
          sold: '#ef4444',      // Red
          blocked: '#f97316',   // Orange
        }
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,59,100,.04), 0 8px 24px -6px rgba(11,59,100,.10)',
        lift: '0 2px 4px rgba(11,59,100,.05), 0 20px 40px -12px rgba(11,59,100,.18)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        cinzel: ['Cinzel', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
