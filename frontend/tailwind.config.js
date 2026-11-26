import preset, { content } from "frappe-ui/tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [...content, "./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // reka-ui measures an accordion panel's open height into this variable.
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--reka-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--reka-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 200ms cubic-bezier(0.23, 1, 0.32, 1)",
        "accordion-up": "accordion-up 200ms cubic-bezier(0.23, 1, 0.32, 1)",
      },
    },
  },
};
