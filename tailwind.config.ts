import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        uxp: {
          bg: "#090a10",
          panel: "#11131e",
          card: "#161927",
          border: "#25293e",
          accent: "#7c3aed",
          accentHover: "#6d28d9",
        },
      },
    },
  },
  plugins: [],
};

export default config;
