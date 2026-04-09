/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0A1628',
        'navy-light': '#1A2B45',
        'navy-lighter': '#243B5C',
        electric: '#3B82F6',
        'electric-dark': '#2563EB',
        green: '#10B981',
        'green-dark': '#059669',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
