import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", "monospace"],
      },
      colors: {
        terminal: {
          green: "#00ff41",
          amber: "#ffb000",
          red: "#ff3333",
          blue: "#00aaff",
          gray: "#888888",
          bg: "#0a0a0a",
          panel: "#0f0f0f",
          border: "#1a1a1a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
