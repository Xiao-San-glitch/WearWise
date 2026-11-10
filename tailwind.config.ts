import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14110F",
        graphite: "#2B2723",
        smoke: "#6E675F",
        stone: "#A79E93",
        sand: "#E6DFD4",
        cream: "#F7F3EC",
        paper: "#FCFAF6",
        clay: "#9A6B4F",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "ui-serif", "Georgia", "serif"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      boxShadow: {
        soft: "0 18px 50px -30px rgba(20,17,15,0.35)",
        lift: "0 30px 70px -40px rgba(20,17,15,0.45)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both",
        fadeIn: "fadeIn 0.6s ease-out both",
        marquee: "marquee 38s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
