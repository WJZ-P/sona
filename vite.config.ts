import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import path from 'node:path'
import fs from 'node:fs'

// Read plugin config from package.json
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const PLUGIN_NAME: string = pkg.config.pluginName
const LOADER_PATH: string = pkg.config.loaderPath
const PLUGINS_DIR = path.resolve(LOADER_PATH, 'plugins', PLUGIN_NAME)

/**
 * Pengu Loader Dev Server Plugin
 * - Generates an index.js entry in the plugins directory
 * - Points to the local Vite dev server for HMR
 */
function penguServe(): Plugin {
  let port: number

  return {
    name: 'pengu-serve',
    apply: 'serve',

    configureServer(server) {
      server.httpServer?.on('listening', () => {
        const addr = server.httpServer!.address()
        if (addr && typeof addr === 'object') {
          port = addr.port
        }

        // Ensure plugins directory exists
        fs.mkdirSync(PLUGINS_DIR, { recursive: true })

        // Write dev entry index.js
        // React Fast Refresh requires both the React preamble and `@vite/client`.
        // Since Pengu loads the module directly instead of via Vite-transformed HTML,
        // we must install the preamble manually before importing React modules.
        const devEntry = [
          `const reactPreamble = import("https://localhost:${port}/@react-refresh").then(({ injectIntoGlobalHook }) => {`,
          `  injectIntoGlobalHook(window);`,
          `  window.$RefreshReg$ = () => {};`,
          `  window.$RefreshSig$ = () => (type) => type;`,
          `  window.__vite_plugin_react_preamble_installed__ = true;`,
          `}).catch(e => {`,
          `  console.error("[Sona] Failed to install react preamble:", e);`,
          `  throw e;`,
          `});`,
          `const viteClient = reactPreamble.then(() => import("https://localhost:${port}/@vite/client")).catch(e => {`,
          `  console.error("[Sona] Failed to load vite client:", e);`,
          `  throw e;`,
          `});`,
          `const pluginModule = () => viteClient.then(() => import("https://localhost:${port}/src/index.tsx")).catch(e => {`,
          `  console.error("[Sona] Failed to load plugin module:", e);`,
          `  throw e;`,
          `});`,
          ``,
          `export function init(context) {`,
          `//  console.log("[Sona] init called");`,
          `  pluginModule().then(m => m.init(context)).catch(e => console.error("[Sona] init error:", e));`,
          `}`,
          ``,
          `export function load() {`,
          `//  console.log("[Sona] load called");`,
          `  pluginModule().then(m => m.load?.()).catch(e => console.error("[Sona] load error:", e));`,
          `}`,
        ].join('\n')

        fs.writeFileSync(path.join(PLUGINS_DIR, 'index.js'), devEntry)
        console.log(`\n  ⚡ Pengu plugin "${PLUGIN_NAME}" dev entry generated`)
        console.log(`  📁 ${PLUGINS_DIR}\n`)
      })
    },

    // Transform asset paths in non-JS files to point to dev server
    transform(code, id) {
      if (/\.(ts|tsx|js|jsx)$/.test(id)) return
      return code.replaceAll('/src/', `https://localhost:${port}/src/`)
    },
  }
}

/**
 * Pengu Loader Build Plugin
 * - Patches asset paths for PenguLoader's plugin protocol
 * - Wraps code for proper load timing
 * - Copies build output to plugins directory
 */
function penguBuild(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'pengu-build',
    apply: 'build',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    closeBundle() {
      const outDir = path.resolve(config.build.outDir)

      // Remove index.html (not needed for plugins)
      const htmlPath = path.join(outDir, 'index.html')
      if (fs.existsSync(htmlPath)) {
        fs.unlinkSync(htmlPath)
      }

      // Process index.js - patch asset paths and wrap in load listener
      const jsPath = path.join(outDir, 'index.js')
      if (fs.existsSync(jsPath)) {
        let js = fs.readFileSync(jsPath, 'utf-8')

        // Fix asset paths: /assets/ -> //plugins/sona/assets/
        js = js.replaceAll('"/assets/', `"//plugins/${PLUGIN_NAME}/assets/`)
        js = js.replaceAll("'/assets/", `'//plugins/${PLUGIN_NAME}/assets/`)

        // Add CSS import at top
        js = `import "./index.css";\n${js}`

        fs.writeFileSync(jsPath, js)
      }

      // Process index.css - fix asset paths
      const cssPath = path.join(outDir, 'index.css')
      if (fs.existsSync(cssPath)) {
        let css = fs.readFileSync(cssPath, 'utf-8')
        css = css.replaceAll('url(/assets/', 'url(./assets/')
        fs.writeFileSync(cssPath, css)
      }

      // Clean target directory and copy build output
      if (fs.existsSync(PLUGINS_DIR)) {
        fs.rmSync(PLUGINS_DIR, { recursive: true })
      }
      fs.mkdirSync(PLUGINS_DIR, { recursive: true })
      copyDirSync(outDir, PLUGINS_DIR)

      console.log(`\n  ✅ Plugin "${PLUGIN_NAME}" built to ${PLUGINS_DIR}\n`)
    },
  }
}

function copyDirSync(src: string, dest: string) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true })
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

export default defineConfig({
  define: {
    __PLUGIN_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    mkcert(),
    penguServe(),
    penguBuild(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    https: {},
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'index.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0]?.endsWith('.css')) return 'index.css'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
  publicDir: false,
})
