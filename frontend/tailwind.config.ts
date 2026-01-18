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
        // Farming theme colors
        'farm-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'earth-brown': {
          50: '#faf7f2',
          100: '#f5ede0',
          200: '#e8d4b8',
          300: '#d4b896',
          400: '#b8956a',
          500: '#9d7a4a',
          600: '#7d6239',
          700: '#5f4a2c',
          800: '#3f321d',
          900: '#1f190e',
        },
        'sky-blue': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      backgroundImage: {
        'gradient-farm': 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
        'gradient-earth': 'linear-gradient(135deg, #f5ede0 0%, #e8d4b8 100%)',
        'gradient-tech': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        'gradient-agri-tech': 'linear-gradient(135deg, #22c55e 0%, #16a34a 25%, #0ea5e9 75%, #0284c7 100%)',
        'gradient-diagonal': 'linear-gradient(45deg, #f0fdf4 0%, #e0f2fe 50%, #f0fdf4 100%)',
        'gradient-grape': 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 25%, #86efac 50%, #dcfce7 100%)',
      },
      boxShadow: {
        'tech': '0 0 20px rgba(14, 165, 233, 0.2)',
        'tech-lg': '0 0 40px rgba(14, 165, 233, 0.3)',
        'agri': '0 0 20px rgba(34, 197, 94, 0.2)',
        'agri-lg': '0 0 40px rgba(34, 197, 94, 0.3)',
        'modern': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'modern-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'gradient': 'gradient-shift 15s ease infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
export default config



