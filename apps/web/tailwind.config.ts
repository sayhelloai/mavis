import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A1628',
        primary: {
          DEFAULT: '#005C8A',
          foreground: '#FFFFFF',
        },
        sidebar: '#0D1F3C',
        card: '#0F2040',
        border: '#1E3A5F',
        muted: '#8B9EC7',
        accent: '#00A3E0',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}
export default config
