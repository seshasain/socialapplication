/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 3s linear infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        }
      }
    },
  },
  plugins: [],
  safelist: [
    'from-blue-50',
    'from-green-50',
    'from-purple-50',
    'from-red-50',
    'from-indigo-50',
    'from-yellow-50',
    'text-blue-600',
    'text-green-600',
    'text-purple-600',
    'text-red-600',
    'text-indigo-600',
    'text-yellow-600',
    'bg-blue-100',
    'bg-green-100',
    'bg-purple-100',
    'bg-red-100',
    'bg-indigo-100',
    'bg-yellow-100',
  ]
};
