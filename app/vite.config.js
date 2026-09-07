import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, 'src/data')

// Dev-only API so the in-browser editor can save straight back to
// src/data/*.json instead of the user hand-editing JSON. Only active under
// `vite dev` (configureServer never runs for `vite build`/`vite preview`),
// and confined to src/data by filename validation + a resolved-path check.
function bmlDataApi() {
  return {
    name: 'bml-data-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/data/', (req, res, next) => {
        const filename = decodeURIComponent(req.url.slice(1).split('?')[0])
        if (!/^[A-Za-z0-9._-]+\.json$/.test(filename)) {
          res.statusCode = 400
          res.end('Invalid filename')
          return
        }
        const filePath = path.join(dataDir, filename)
        if (path.dirname(filePath) !== dataDir) {
          res.statusCode = 400
          res.end('Invalid path')
          return
        }

        if (req.method === 'PUT') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              res.statusCode = 400
              res.end(String(err))
            }
          })
          return
        }

        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves a project site (not a user/org site) from
  // https://<user>.github.io/bridge-viewer/, so built asset URLs need that
  // prefix. Keyed on `mode`, not `command`: Vite resolves `vite preview`
  // with command "serve" (same as `vite dev`) but mode "production" --
  // using `command` here meant `vite preview` got base "/" while the
  // already-built dist/index.html it's serving has "/bridge-viewer/"
  // hardcoded into its asset URLs, so every asset request 404'd into the
  // SPA fallback and the app never mounted. `mode` correctly distinguishes
  // "the interactive dev server" (development) from "anything serving an
  // actual production build" (production) -- which is what preview is
  // for: matching what actually gets deployed.
  base: mode === 'development' ? '/' : '/bridge-viewer/',
  plugins: [vue(), bmlDataApi()],
}))
