import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        terminal: {
          black: "#0a0e27",
          dark: "#0d1117",
          green: "#00ff41",
          cyan: "#00e5ff",
          magenta: "#ff00ff",
          amber: "#ffb000",
          red: "#ff3355",
          gray: "#1a1f3a",
          surface: "#121630",
          border: "#1e2448",
          muted: "#6b7294",
        },
      },
      boxShadow: {
        glow: "0 0 10px rgba(0, 255, 65, 0.3), 0 0 20px rgba(0, 255, 65, 0.1)",
        "glow-cyan": "0 0 10px rgba(0, 229, 255, 0.3), 0 0 20px rgba(0, 229, 255, 0.1)",
        "glow-magenta": "0 0 10px rgba(255, 0, 255, 0.3), 0 0 20px rgba(255, 0, 255, 0.1)",
      },
      animation: {
        "scanline": "scanline 8s linear infinite",
        "flicker": "flicker 0.15s infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "typewriter": "typewriter 2s steps(40) forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite alternate",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.98" },
        },
        "glow-pulse": {
          "0%": { boxShadow: "0 0 5px rgba(0, 255, 65, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 255, 65, 0.4), 0 0 40px rgba(0, 255, 65, 0.1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
