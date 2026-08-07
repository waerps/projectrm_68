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
        chatPopIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        botFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s ease",
        "shrink": "shrink 3.5s linear forwards",
        "chatPopIn": "chatPopIn 0.2s ease-out",
        "botFloat": "botFloat 2.5s ease-in-out infinite",
        "fadeIn": "fadeIn 0.3s ease-out",
      },
    },
  },
  plugins: [],
}