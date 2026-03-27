import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyan: 'var(--cyan)',
        magenta: 'var(--magenta)',
        amber: 'var(--amber)',
        green: 'var(--green)',
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        border: 'var(--border)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'monospace'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
