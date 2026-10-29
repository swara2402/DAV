/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          600: '#15803D',
          700: '#166534',
          800: '#14532D',
          900: '#0F3D24',
          950: '#0B2B19',
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Text'",
          "'SF Pro Display'",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "'Charter'",
          "'New York'",
          "Georgia",
          "serif",
        ],
        mono: [
          "'SF Mono'",
          "Menlo",
          "Monaco",
          "ui-monospace",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
}
