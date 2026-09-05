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
        // Enterprise Warm Paper Palette Tokens
        "paper-bg": "#F7F5F1",
        "surface-card": "#FFFFFF",
        "surface-inset": "#F0ECE1",
        "hairline-border": "#E7E2D9",
        "border-divider": "#DDD8CD",
        
        // Typography Colors
        "primary-text": "#1C1B19",
        "secondary-text": "#6B665C",
        "muted-text": "#918C82",
        
        // Brand & Operational Accents
        "action-emerald": "#0F5C4A",
        "action-emerald-hover": "#0B4739",
        "action-emerald-light": "#E8F4F1",
        "currency-gold": "#8A6D3B",
        "currency-gold-light": "#FAF4E8",
        "warning-brick": "#B5482E",
        "warning-brick-light": "#FDF1EE",
        "info-blue": "#20639B",
        "info-blue-light": "#EFF6FB",
        
        // Backward-compatible semantic mappings
        "bg-primary": "#F7F5F1",
        "bg-secondary": "#FFFFFF",
        "surface-elevated": "#FFFFFF",
        "surface-hover": "#F5F2EB",
        "brand-orange": "#0F5C4A",
        "brand-coral": "#0B4739",
        "text-primary": "#1C1B19",
        "text-secondary": "#6B665C",
        "text-muted": "#918C82",
        "semantic-success": "#0F5C4A",
        "semantic-warning": "#B5482E",
        "semantic-danger": "#B5482E",
        "semantic-info": "#20639B",
        "border-subtle": "#E7E2D9",
        "border-strong": "#DDD8CD"
      },
      fontFamily: {
        "heading": ["Fraunces", "Georgia", "serif"],
        "display": ["Fraunces", "Georgia", "serif"],
        "body": ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        "mono": ["JetBrains Mono", "IBM Plex Mono", "monospace"]
      },
      boxShadow: {
        "hairline": "0 0 0 1px #E7E2D9",
        "subtle": "0 1px 3px 0 rgba(28, 27, 25, 0.04), 0 1px 2px 0 rgba(28, 27, 25, 0.02)",
        "card": "0 2px 4px 0 rgba(28, 27, 25, 0.03)",
        "elevated": "0 8px 24px 0 rgba(28, 27, 25, 0.06), 0 1px 3px 0 rgba(28, 27, 25, 0.04)"
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
