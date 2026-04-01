/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'primary-text': '#303030',
        'secondary-text': '#626262',
        'teal-gradient-start': '#55C48B',
        'teal-gradient-end': '#01849F',
        'dim': '#f9fbfb',
      },
      fontFamily: {
        asap: ['Asap', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
