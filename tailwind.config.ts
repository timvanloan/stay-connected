import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        emotionBloom:
          "0 0 0 1px rgba(255,255,255,0.4), 0 12px 40px -8px rgba(0,0,0,0.12)",
        hubGlow:
          "0 0 0 8px rgba(255,255,255,0.5), 0 8px 32px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
