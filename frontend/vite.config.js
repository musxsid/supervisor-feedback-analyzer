import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createConnection } from 'node:net'

function isBackendListening(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.setTimeout(500)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, '.', '')
  let apiTarget = env.VITE_API_PROXY_TARGET
  if (!apiTarget) {
    const port = await isBackendListening(8080) ? 8080 : await isBackendListening(8081) ? 8081 : 8080
    apiTarget = `http://localhost:${port}`
  }
  console.info(`[vite] API proxy -> ${apiTarget}`)

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
