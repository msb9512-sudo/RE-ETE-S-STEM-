import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import process from 'node:process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './', // Elektron dosya sistemi için gerekli
    plugins: [
      react(),
      electron([
        {
          entry: 'electron/main.ts',
        },
        {
          entry: 'electron/preload.ts',
          onstart(options) {
            options.reload()
          },
        },
      ]),
      renderer(),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
      },
    }
  }
})