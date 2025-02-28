/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            pre: {
              backgroundColor: '#f3f4f6', // light mode gray-100
              color: '#1f2937', // gray-800
              padding: '1rem',
              borderRadius: '0.375rem',
              marginTop: '1.25rem',
              marginBottom: '1.25rem',
            },
            code: {
              backgroundColor: '#f3f4f6', // light mode gray-100
              color: '#1f2937', // gray-800
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'media'
}
