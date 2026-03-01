import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isDev = process.env.NODE_ENV !== 'production'

const config = defineConfig({
  plugins: [
    isDev && devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart({
      server: {
        preset: 'node-server',
      },
    }),
    viteReact(),
  ],
})

export default config
