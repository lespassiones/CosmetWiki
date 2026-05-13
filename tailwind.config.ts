import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAFA",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1F2937",
          muted: "#6B7280",
          subtle: "#9CA3AF",
        },
        rating: {
          vert: { DEFAULT: "#16A34A", soft: "#DCFCE7", ink: "#14532D" },
          jaune: { DEFAULT: "#CA8A04", soft: "#FEF9C3", ink: "#713F12" },
          orange: { DEFAULT: "#EA580C", soft: "#FFEDD5", ink: "#7C2D12" },
          rouge: { DEFAULT: "#DC2626", soft: "#FEE2E2", ink: "#7F1D1D" },
        },
        accent: "#8B5CF6",
        accentDark: "#6D28D9",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)",
        cardHover: "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
        search: "0 4px 24px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)",
        searchFocus:
          "0 6px 32px rgba(244, 63, 94, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-down": "slideDown 220ms ease-out",
        reveal: "reveal 620ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        reveal: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
