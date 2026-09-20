/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
          container: 'var(--primary-container)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          dark: 'var(--secondary-dark)',
          night: 'var(--secondary-night)',
          surface: 'var(--secondary-surface)',
          container: 'var(--secondary-container)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
          dark: 'var(--accent-dark)',
          container: 'var(--accent-container)',
        },
        background: 'var(--background)',
        surface: {
          DEFAULT: 'var(--surface)',
          variant: 'var(--surface-variant)',
        },
        outline: 'var(--outline)',
        'text-main': 'var(--text-main)',
        'text-secondary': 'var(--text-secondary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
        'purple-accent': 'var(--purple-accent)',
      },
    },
  },
  plugins: [],
};
