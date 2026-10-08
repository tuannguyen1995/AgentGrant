/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        scientific: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
        indigo: {
          600: "#4338CA",
          500: "#6366F1",
        },
        emerald: {
          600: "#059669",
          500: "#10B981",
        },
        amber: {
          600: "#D97706",
          500: "#F59E0B",
        },
        crimson: {
          600: "#DC2626",
          500: "#EF4444",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
