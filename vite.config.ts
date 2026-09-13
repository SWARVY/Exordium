import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const isDev = process.env.NODE_ENV !== "production"

const config = defineConfig(({ mode }) => ({
  envDir: mode === "e2e" ? false : undefined,
  build: { outDir: mode === "e2e" ? "dist-e2e" : "dist" },
  plugins: [
    isDev && mode !== "e2e" && devtools(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))

export default config
