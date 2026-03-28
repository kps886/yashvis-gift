/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': 'var(--primary-bg)', 
        'secondary-bg': 'var(--secondary-bg)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'accent-gold': 'var(--accent-gold)',
        'border-color': 'var(--border-color)',
      },
    },
  },
  plugins: [],
}

