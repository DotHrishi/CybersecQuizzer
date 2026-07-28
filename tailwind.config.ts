import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#050507',
          900: '#0a0a0d',
          800: '#121217',
          700: '#1c1c24',
          accent: '#FFFFFF',
          silver: '#E2E8F0',
          darkBg: '#08080a',
        },
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(180deg, #09090b 0%, #030304 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'cyber-glow': '0 0 25px -5px rgba(255, 255, 255, 0.15)',
        'white-glow': '0 0 20px -3px rgba(255, 255, 255, 0.25)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 4s infinite ease-in-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
