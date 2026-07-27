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
          950: '#000000',
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
          accent: '#00FF66',
          neonGreen: '#00FF66',
          neonPurple: '#A855F7',
          neonPink: '#FF007A',
        },
      },
      backgroundImage: {
        'cyber-gradient': 'radial-gradient(ellipse at top, #1E2D50 0%, #0D1322 60%, #070A13 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'glow-cyan': 'radial-gradient(circle, rgba(0,240,255,0.15) 0%, rgba(0,0,0,0) 70%)',
      },
      boxShadow: {
        'cyber-glow': '0 0 25px -5px rgba(0, 240, 255, 0.4)',
        'neon-green': '0 0 20px -3px rgba(0, 255, 102, 0.4)',
        'neon-purple': '0 0 20px -3px rgba(168, 85, 247, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s infinite ease-in-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
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
