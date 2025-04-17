/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#E6F7FF',
          200: '#BAE7FF',
          300: '#91D5FF',
          400: '#69C0FF',
          500: '#40A9FF',
          600: '#1890FF',
          700: '#096DD9',
          800: '#0050B3',
          900: '#003A8C',
        },
        secondary: {
          100: '#F6FFED',
          200: '#D9F7BE',
          300: '#B7EB8F',
          400: '#95DE64',
          500: '#73D13D',
          600: '#52C41A',
          700: '#389E0D',
          800: '#237804',
          900: '#135200',
        },
      },
    },
  },
  plugins: [],
}; 