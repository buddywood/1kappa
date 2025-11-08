import type { Config } from 'tailwindcss'

const config: Config = {
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
        crimson: '#9B111E',
        cream: '#F7F4E9',
        'midnight-navy': '#1E2A38',
        'frost-gray': '#D9DBE0',
        'aurora-gold': '#C6A664',
      },
      fontFamily: {
        display: ['var(--font-montserrat)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        accent: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config

