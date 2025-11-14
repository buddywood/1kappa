import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        crimson: '#8A0C13',
        cream: '#F7F4E9',
        'midnight-navy': '#121212',
        'frost-gray': '#D9DBE0',
        'aurora-gold': '#C6A664',
        white: '#FFFFFF',
      },
      fontFamily: {
        display: ['var(--font-oswald)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        accent: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config

