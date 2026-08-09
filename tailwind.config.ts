import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
      colors: {
        green: {
          DEFAULT: '#1B4332',
          light: '#2D6A4F',
          pale: '#E8F4EE',
        },
        gold: {
          DEFAULT: '#C9962A',
          light: '#D4A853',
          pale: '#FDF6E3',
        },
        bg: '#FAF8F5',
        border: '#E8E4DC',
      },
    },
  },
  plugins: [],
}

export default config
