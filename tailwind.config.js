/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        keyframes: {
          "slide-in": {
            "0%": { opacity: "0", transform: "translateX(40px)" },
            "100%": { opacity: "1", transform: "translateX(0)" },
          },
          shrink: {
            "0%": { width: "100%" },
            "100%": { width: "0%" },
          },
        },
        animation: {
          "slide-in": "slide-in 0.3s ease",
          "shrink": "shrink 3.5s linear forwards",
        },
      },
    },
    plugins: [],
  }