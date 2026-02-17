/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Faction colors
        ironwright: { DEFAULT: '#6B8AFF', dark: '#4A6AE0' },
        fey: { DEFAULT: '#7CDB8A', dark: '#5CB86A' },
        demonic: { DEFAULT: '#FF6B6B', dark: '#E04A4A' },
        // Admin UI colors
        surface: {
          DEFAULT: '#1a1a2e',
          light: '#25253e',
          lighter: '#30304e',
        },
        accent: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
        },
      },
    },
  },
  plugins: [],
};
