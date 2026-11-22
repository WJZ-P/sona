import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { CORE_GLOBAL_NAME, SHELL_API_VERSION, type CoreManifest } from './src/shell/contract'

// Read plugin config from package.json
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const PLUGIN_NAME: string = pkg.config.pluginName
const LOADER_PATH: string = pkg.config.loaderPath
const PLUGINS_DIR = path.resolve(LOADER_PATH, 'plugins', PLUGIN_NAME)

/** 构建时占位，closeBundle 中替换为打包后的 CSS 文本（见 src/lib/core-style.ts）。 */
const CORE_CSS_PLACEHOLDER = '__SONA_CORE_CSS_PLACEHOLDER__'
/** 热更新清单文件名，随版本提交到仓库，由 jsDelivr @main 分发。 */
const CORE_MANIFEST_FILE = 'core-manifest.json'

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

    async closeBundle() {
      const outDir = path.resolve(config.build.outDir)

      // Remove index.html (not needed for plugins)
      const htmlPath = path.join(outDir, 'index.html')
      if (fs.existsSync(htmlPath)) {
        fs.unlinkSync(htmlPath)
      }

      // ---- 1. 本体 core.js：修正资源路径并内嵌 CSS ----
      const corePath = path.join(outDir, 'core.js')
      const cssPath = path.join(outDir, 'index.css')
      let core = fs.readFileSync(corePath, 'utf-8')
      core = core.replaceAll('"/assets/', `"//plugins/${PLUGIN_NAME}/assets/`)
      core = core.replaceAll("'/assets/", `'//plugins/${PLUGIN_NAME}/assets/`)

      let css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : ''
      // 样式以 <style> 注入到客户端页面，相对路径会按页面地址解析，所以改成插件协议的绝对路径。
      css = css.replaceAll('url(/assets/', `url(//plugins/${PLUGIN_NAME}/assets/`)
      const placeholderLiteral = JSON.stringify(CORE_CSS_PLACEHOLDER)
      const placeholderCount = core.split(placeholderLiteral).length - 1
      if (placeholderCount !== 1) {
        throw new Error(`[pengu-build] CSS 占位符应出现 1 次，实际 ${placeholderCount} 次`)
      }
      core = core.replace(placeholderLiteral, () => JSON.stringify(css))
      if (fs.existsSync(cssPath)) fs.unlinkSync(cssPath)

      // 统一 LF：热更新会校验 core.js 的 SHA-256，换行不一致会导致校验失败。
      core = core.replace(/\r\n/g, '\n')
      fs.writeFileSync(corePath, core)

      // ---- 2. 热更新清单 ----
      const manifest: CoreManifest = {
        version: pkg.version,
        minShellApi: SHELL_API_VERSION,
        sha256: crypto.createHash('sha256').update(core, 'utf-8').digest('hex'),
        size: Buffer.byteLength(core, 'utf-8'),
      }
      fs.writeFileSync(path.join(outDir, CORE_MANIFEST_FILE), JSON.stringify(manifest, null, 2) + '\n')

      // ---- 3. 壳 + 内置本体 → index.js（Pengu 加载的入口） ----
      const { build: esbuild } = await import('esbuild')
      const shellResult = await esbuild({
        entryPoints: [path.resolve(__dirname, 'src/shell/index.ts')],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: 'es2020',
        charset: 'utf8',
        write: false,
        define: {
          __PLUGIN_VERSION__: JSON.stringify(pkg.version),
        },
      })
      const shell = shellResult.outputFiles[0].text

      // Pengu Loader 插件头注释（识别插件元信息用）
      const banner = [
        '/**',
        ' * @name Sona',
        ` * @version ${pkg.version}`,
        ' * @description 基于 Pengu Loader 的全服可用英雄联盟客户端增强插件',
        ' * @author WJZ_P',
        ' * @link https://github.com/WJZ-P/sona',
        ' */',
        '',
      ].join('\n')
      // 内置本体包在函数里：使用热更新版本时，内置代码只解析、不执行。
      const bundledCore = [
        'function __sonaLoadBundledCore() {',
        core,
        `;return ${CORE_GLOBAL_NAME};`,
        '}',
        '',
      ].join('\n')
      fs.writeFileSync(path.join(outDir, 'index.js'), banner + bundledCore + shell)

      // Copy build output to plugins directory (skip if it's the project root)
      const projectRoot = path.resolve(__dirname)
      if (path.resolve(PLUGINS_DIR) === projectRoot) {
        // Target is the project itself — just move dist contents to project root
        // 旧版构建会在根目录留下 index.css，现在样式已内嵌进本体
        fs.rmSync(path.join(projectRoot, 'index.css'), { force: true })
        copyDirSync(outDir, projectRoot)
        console.log(`\n  ✅ Plugin "${PLUGIN_NAME}" built in-place (project root)\n`)
      } else {
        if (fs.existsSync(PLUGINS_DIR)) {
          fs.rmSync(PLUGINS_DIR, { recursive: true })
        }
        fs.mkdirSync(PLUGINS_DIR, { recursive: true })
        copyDirSync(outDir, PLUGINS_DIR)
        console.log(`\n  ✅ Plugin "${PLUGIN_NAME}" built to ${PLUGINS_DIR}\n`)
      }
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

export default defineConfig(({ command }) => ({
  define: {
    __PLUGIN_VERSION__: JSON.stringify(pkg.version),
    'process.env.NODE_ENV': JSON.stringify('production'),
    // dev 模式样式由 Vite 注入；构建时先放占位符，closeBundle 再替换成 CSS 文本。
    __SONA_CORE_CSS__: command === 'build' ? JSON.stringify(CORE_CSS_PLACEHOLDER) : 'null',
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
    origin: 'https://localhost:3000',// 必须加这个，否则引入图片资源等会失败
  },
  build: {
    outDir: 'dist',
    // 本体打成 IIFE：壳可以用 new Function 同步执行（热更新代码存在 DataStore 里），
    // 保证 init 阶段的早期钩子与以前一样同步注册。
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'),
      formats: ['iife'],
      name: CORE_GLOBAL_NAME,
      fileName: () => 'core.js',
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.[0]?.endsWith('.css')) return 'index.css'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
  publicDir: false,
}))
