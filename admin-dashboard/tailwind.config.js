/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#2563EB",
        success: "#10B981",
        purple: "#8B5CF6",
        warning: "#F59E0B",
        danger: "#EF4444",
        page: "#F8FAFC",
        ink: "#111827",
        border: "#E5E7EB"
      },
      boxShadow: {
        soft: "0 18px 42px rgba(17, 24, 39, 0.08)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
};
