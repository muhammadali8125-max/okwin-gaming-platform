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
        jjwin: {
          primary: "#78E02C",
          "primary-hover": "#68C624",
          "primary-glow": "rgba(120, 224, 44, 0.35)",
          dark: "#161616",
          darker: "#0d0d0d",
          card: "#212121",
          elevated: "#2a2a2a",
          border: "#333333",
          gold: "#FFAA09",
          red: "#EA4E3D",
          textPrimary: "#FFFFFF",
          textSecondary: "#A4A4A4",
          textMuted: "#757575",
        },
        okwin: {
          primary: "#78E02C",
          "primary-hover": "#68C624",
          "primary-glow": "rgba(120, 224, 44, 0.35)",
          dark: "#161616",
          darker: "#0d0d0d",
          card: "#212121",
          elevated: "#2a2a2a",
          border: "#333333",
          gold: "#FFAA09",
          red: "#EA4E3D",
          textPrimary: "#FFFFFF",
          textSecondary: "#A4A4A4",
          textMuted: "#757575",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(120, 224, 44, 0.35)",
        "glow-sm": "0 0 10px rgba(120, 224, 44, 0.25)",
        gold: "0 0 20px rgba(255, 170, 9, 0.35)",
        card: "0 4px 20px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ticker: "ticker 25s linear infinite",
        float: "float 3s ease-in-out infinite",
        "fade-up": "fadeUp 0.8s ease-out forwards",
        "shake": "shake 0.3s ease-in-out",
        "swing": "swing 0.25s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "crack-spread": "crackSpread 0.4s ease-out forwards",
        "coin-rain": "coinRain 1.2s ease-out forwards",
        "slam": "slam 0.15s ease-out",
        "wobble": "wobble 0.5s ease-in-out",
        "sparkle": "sparkle 1.5s ease-in-out infinite",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fadeUp: {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-60px) scale(1.3)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "20%": { transform: "translateX(-4px) rotate(-2deg)" },
          "40%": { transform: "translateX(4px) rotate(2deg)" },
          "60%": { transform: "translateX(-3px) rotate(-1deg)" },
          "80%": { transform: "translateX(2px) rotate(1deg)" },
        },
        swing: {
          "0%": { transform: "rotate(-60deg) scale(1.2)" },
          "60%": { transform: "rotate(15deg) scale(1)" },
          "100%": { transform: "rotate(0deg) scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.1)" },
          "50%": { boxShadow: "0 0 30px rgba(245, 158, 11, 0.5), 0 0 60px rgba(245, 158, 11, 0.2)" },
        },
        crackSpread: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        coinRain: {
          "0%": { opacity: "1", transform: "translateY(0) rotate(0deg)" },
          "100%": { opacity: "0", transform: "translateY(80px) rotate(180deg)" },
        },
        slam: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.92)" },
          "100%": { transform: "scale(1)" },
        },
        wobble: {
          "0%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-5deg)" },
          "50%": { transform: "rotate(5deg)" },
          "75%": { transform: "rotate(-3deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0.4", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
