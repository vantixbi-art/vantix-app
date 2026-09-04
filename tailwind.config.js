/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        panel:  'rgb(var(--color-panel)  / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        gold:   'rgb(var(--color-gold)   / <alpha-value>)',
        live:   'rgb(var(--color-live)   / <alpha-value>)',
        alert:  'rgb(var(--color-alert)  / <alpha-value>)',
        muted:  'rgb(var(--color-muted)  / <alpha-value>)',
        input:  'rgb(var(--color-input)  / <alpha-value>)',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
