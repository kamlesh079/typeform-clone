import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#262627", lime: "#d7f95b", cream: "#f7f7f5" },
      fontFamily: { sans: ["Inter", "Arial", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
