/// <reference path="../pengu.d.ts" />
declare const __PLUGIN_VERSION__: string  //  这个变量信息在vite.config.js中定义

import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import { createLogger } from '@/lib/logger'
import { registerAllInjections } from '@/lib/injections'
import { initFeatures } from '@/lib/features'
import { registerHotkey } from '@/lib/modal'
import { initAssets } from '@/lib/assets'
import { injector } from '@/lib/InjectorManager'
import { lcu } from '@/lib/lcu'
import '@/styles/index.css'
import '@/styles/inject.css'
import '@/styles/availabilityMenu.css'

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
  registerAllInjections()  //  注册所有 DOM 注入点并启动守护
  initFeatures()           //  初始化功能监听（自动接受、解锁签名等）
  registerHotkey()         //  注册 F1 快捷键
  initAssets()             //  初始化装备/技能资源映射（异步，不阻塞）
  mountApp()
}

/**
 * Get the stored Pengu context
 */
export function getContext(): PenguContext | null {
  return penguContext
}

/**
 * 容器守护注入任务
 * 检测 #sona-root 是否脱离 DOM，脱离则自动重新挂载
 */
function tryGuardContainer(): boolean {
  const runtime = getRuntime()
  if (runtime.container?.isConnected) return true
  if (runtime.container) {
    appendContainer(runtime.container)
    logger.warn('Detected host DOM refresh; restored app container')
  }
  return Boolean(runtime.container?.isConnected)
}

/**
 * Mount the React application into the League Client
 */
function mountApp() {
  const runtime = getRuntime()
  const container = ensureContainer(runtime)

  // 将容器守护注册到全局 InjectorManager
  injector.register(tryGuardContainer)

  if (!runtime.root) {
    runtime.root = createRoot(container)
    logger.info('Created React root')
  } else {
    logger.info('Reusing existing React root')
  }

  runtime.root.render(<App />)

  logger.info('Mounted ✓ (container connected: %s)', String(container.isConnected))

  if (!runtime.hasShownStartupToast) {
    Toast.success('Sona 已启动 ♫')
    runtime.hasShownStartupToast = true
  }
}
