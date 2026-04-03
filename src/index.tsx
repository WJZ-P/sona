/// <reference path="../pengu.d.ts" />
declare const __PLUGIN_VERSION__: string  //  这个变量信息在vite.config.js中定义

import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import { createLogger } from '@/lib/logger'
import { startInjection } from '@/lib/inject'
import { lcu } from '@/lib/lcu'
import '@/styles/index.css'
import '@/styles/inject.css'

const PLUGIN_NAME = 'Sona'
const PLUGIN_VERSION = __PLUGIN_VERSION__
const CONTAINER_ID = 'sona-root'

export const logger = createLogger({
  name: PLUGIN_NAME,
  version: PLUGIN_VERSION,
})




function getRuntime(): SonaRuntime {
  if (!window.__SONA_RUNTIME__) {
    window.__SONA_RUNTIME__ = {
      container: null,
      root: null,
      domObserver: null,
      hasShownStartupToast: false,
    }
  }

  return window.__SONA_RUNTIME__
}

function appendContainer(container: HTMLDivElement) {
  const host = document.body ?? document.documentElement
  host.appendChild(container)
}

function ensureContainer(runtime: SonaRuntime) {
  const existing = document.getElementById(CONTAINER_ID)
  if (existing instanceof HTMLDivElement) {
    runtime.container = existing
  }

  if (!runtime.container) {
    runtime.container = document.createElement('div')
    runtime.container.id = CONTAINER_ID
    logger.info('Created app container')
  }

  if (!runtime.container.isConnected) {
    appendContainer(runtime.container)
    logger.warn('App container was missing from DOM and has been reattached')
  }

  return runtime.container
}

function ensureDomGuard(runtime: SonaRuntime) {
  if (runtime.domObserver) return

  const observerTarget = document.documentElement ?? document.body
  if (!observerTarget) return

  const observer = new MutationObserver(() => {
    const container = runtime.container
    if (!container || container.isConnected) return

    appendContainer(container)
    logger.warn('Detected host DOM refresh; restored app container')
  })

  observer.observe(observerTarget, {
    childList: true,
    subtree: true,
  })

  runtime.domObserver = observer
  logger.info('Started app container DOM guard')
}

// Store context for use across the plugin
let penguContext: PenguContext | null = null


/**
 * Called before League Client initializes its scripts.
 * Use this for early hooks like RCP interception.
 */
export function init(context: PenguContext) {
  penguContext = context
  lcu.bindContext(context)
  logger.printBanner()
}

/**
 * Called after the window is loaded.
 * Safe to manipulate DOM here.
 */
export function load() {
  logger.info('Plugin loading...')
  startInjection()  //  注入插件入口按钮
  mountApp()
}

/**
 * Get the stored Pengu context
 */
export function getContext(): PenguContext | null {
  return penguContext
}

/**
 * Mount the React application into the League Client
 */
function mountApp() {
  const runtime = getRuntime()
  const container = ensureContainer(runtime)

  ensureDomGuard(runtime)

  if (!runtime.root) {
    runtime.root = createRoot(container)
    logger.info('Created React root')
  } else {
    logger.info('Reusing existing React root')
  }

  runtime.root.render(<App />)

  logger.info('Mounted ✓ (container connected: %s)', String(container.isConnected))

  if (!runtime.hasShownStartupToast) {
    Toast.success('Sona 已启动！')
    runtime.hasShownStartupToast = true
  }
}

