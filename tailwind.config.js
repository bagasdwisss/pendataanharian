/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F5F0",
        brutal: "#111111",
        "sidebar-bg": "#131316",
        "sidebar-card": "#1E1E24",
        "pastel-butter": "#FEF08A",
        "pastel-butter-light": "#FEF9C3",
        "pastel-pink": "#FCE7F3",
        "pastel-pink-light": "#FDF2F8",
        "pastel-matcha": "#DCFCE7",
        "pastel-matcha-light": "#F0FDF4",
        "pastel-blue": "#E0F2FE",
        "pastel-blue-light": "#F0F9FF",
        "pastel-lavender": "#EDE9FE",
        "pastel-peach": "#FFEDD5",
      },
      boxShadow: {
        neo: "4px 4px 0px #111111",
        "neo-sm": "2px 2px 0px #111111",
        "neo-lg": "6px 6px 0px #111111",
        "neo-xl": "8px 8px 0px #111111",
        "neo-white": "4px 4px 0px #FFFFFF",
        "neo-inset": "inset 2px 2px 0px #111111",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      borderWidth: {
        2: "2px",
        3: "3px",
      },
    },
  },
  plugins: [],
};
