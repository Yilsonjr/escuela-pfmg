import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "var(--brand-blue)",
          gold: "var(--brand-gold)",
        },
      },
      textColor: {
        "muted-foreground": "var(--muted-foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;

