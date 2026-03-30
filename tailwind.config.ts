import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0e4a6e",
          light: "#1a6b9a",
          dark: "#083550",
        },
        accent: {
          DEFAULT: "#f59e0b",
          light: "#fbbf24",
        },
      },
    },
  },
  plugins: [],
};
export default config;
