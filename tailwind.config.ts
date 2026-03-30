import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          dark: '#B8941F',
          light: '#E5C76B',
        },
        cream: {
          DEFAULT: '#FAF8F3',
          dark: '#F5F0E6',
        },
        black: '#0A0A0A',
        gray: {
          text: '#666666',
          light: '#999999',
        },
      },
      fontFamily: {
        title: ['Cormorant Garamond', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '50px',
      },
      boxShadow: {
        soft: '0 4px 12px rgba(0, 0, 0, 0.08)',
        gold: '0 4px 12px rgba(212, 175, 55, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
