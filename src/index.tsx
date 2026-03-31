/// <reference path="../pengu.d.ts" />
declare const __PLUGIN_VERSION__: string  //  这个变量信息在vite.config.js中定义

import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import { createLogger } from '@/lib/logger'
import '@/styles/index.css'

const PLUGIN_NAME = 'Sona'
const PLUGIN_VERSION = __PLUGIN_VERSION__

export const logger = createLogger({
  name: PLUGIN_NAME,
  version: PLUGIN_VERSION,
})

// Store context for use across the plugin
let penguContext: PenguContext | null = null

/**
 * Called before League Client initializes its scripts.
 * Use this for early hooks like RCP interception.
 */
export function init(context: PenguContext) {
  penguContext = context
  logger.printBanner()
}

/**
 * Called after the window is loaded.
 * Safe to manipulate DOM here.
 */
export function load() {
  logger.info('Plugin loading...')
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
  const CONTAINER_ID = 'sona-root'
  let container = document.getElementById(CONTAINER_ID)

  if (!container) {
    container = document.createElement('div')
    container.id = CONTAINER_ID
    document.body.appendChild(container)
  }

  // Mount React app
  const root = createRoot(container)
  root.render(<App />)

  logger.info('Mounted ✓')
  Toast.success('Sona 已启动！')
}
