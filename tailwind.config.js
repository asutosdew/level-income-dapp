/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#101626',
          950: '#070a14',
        }
      }
    },
  },
  plugins: [],
}

