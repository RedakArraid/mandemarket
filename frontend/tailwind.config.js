/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Accent principal : vert (un cran plus clair)
          orange: '#1A8F5C',
          'orange-dark': '#147A4D',
          'orange-light': '#2BB57A',
          navy: '#1A2332',
          'navy-light': '#243044',
          cream: '#F3F7F4',
          soft: '#E8F3EC',
        },
        orange: {
          50: '#f0faf4',
          100: '#d9f0e3',
          200: '#b5e0c9',
          300: '#7fc5a3',
          400: '#45b07d',
          500: '#1A8F5C',
          600: '#147A4D',
          700: '#0F6340',
          800: '#0B4D32',
          900: '#073A26',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px rgba(26, 35, 50, 0.08)',
      },
    },
  },
  plugins: [],
}
