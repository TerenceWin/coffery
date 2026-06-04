/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50:  '#fdf6f0',
          100: '#fbe8d8',
          200: '#f5ceaa',
          300: '#ecae73',
          400: '#e28743',
          500: '#d96c22',
          600: '#c85317',
          700: '#a63e15',
          800: '#853318',
          900: '#6d2b17',
        },
      },
    },
  },
  plugins: [],
}
