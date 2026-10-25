/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#F6F6F3',
        ink: '#16181D',
        muted: '#5B606B',
        line: '#E3E4E0',
        under: { DEFAULT: '#1D4ED8', bg: '#E8EEFD' },
        over: { DEFAULT: '#9A3F07', bg: '#FCEFE5' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans KR"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
