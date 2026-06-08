/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#8f19e8",
          deep: "#34104f",
          light: "#f5f2fb",
          orange: "#ff9f1c"
        }
      },
      fontFamily: {
        sans: ["Urbanist", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 55px rgba(72, 42, 109, 0.12)",
        float: "0 16px 36px rgba(60, 28, 98, 0.14)"
      }
    }
  },
  plugins: []
};
