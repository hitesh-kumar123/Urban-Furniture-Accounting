/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0B0B0D",
        "bg-secondary": "#111114",
        "surface-elevated": "#17171B",
        "surface-hover": "#1E1E24",
        "brand-orange": "#FF6B3D",
        "brand-coral": "#FF8A65",
        "text-primary": "#F5F2EA",
        "text-secondary": "#A6A3A0",
        "text-muted": "#6F6C69",
        "semantic-success": "#39D98A",
        "semantic-warning": "#F5B942",
        "semantic-danger": "#FF5C5C",
        "semantic-info": "#58B7FF",
        "border-subtle": "rgba(255, 255, 255, 0.08)",
        "border-strong": "rgba(255, 255, 255, 0.14)"
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      },
      borderRadius: {
        "DEFAULT": "0.375rem",
        "sm": "0.25rem",
        "md": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.625rem",
        "2xl": "0.75rem"
      }
    }
  },
  plugins: []
};
