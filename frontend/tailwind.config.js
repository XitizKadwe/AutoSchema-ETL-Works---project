/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17243b",
        muted: "#77849a",
        canvas: "#f5f7fb",
        teal: {
          50: "#eaf8f6",
          100: "#d3f0eb",
          500: "#18a999",
          600: "#138879",
          700: "#116d63",
        },
      },
      boxShadow: {
        card: "0 10px 35px rgba(27, 46, 75, 0.06)",
      },
    },
  },
  plugins: [],
};
