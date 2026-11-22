/// <reference path="../../pengu.d.ts" />
/**
 * Sona 壳（构建后成为 plugins/sona/index.js 的入口部分）
 *
 * 职责：
 * 1. 启动时决定运行哪个本体：DataStore 里热更新下载的新版本，或随插件安装的内置版本；
 * 2. 同步执行本体并转交 Pengu 的 init / load 生命周期，早期钩子的注册时机与以前完全一致；
 * 3. 启动完成后在后台检查新版本：版本号相同则什么都不做，有新版本才下载并保存，下次启动生效；
 * 4. 热更新版本连续启动失败时自动拉黑并回退到内置版本。
 *
 * 壳本身很少修改，修改后需要用户手动更新插件；业务代码全部在本体里。
 */
import {
  CORE_GLOBAL_NAME,
  DYNAMIC_UPDATE_STORE_KEY,
  MANUAL_UPDATE_REQUIRED_STORE_KEY,
  SHELL_API_VERSION,
  type CoreManifest,
  type CoreSource,
  type ShellEnv,
  type SonaCoreModule,
} from './contract'

declare const __PLUGIN_VERSION__: string
/** 构建时由 vite.config.ts 拼接在本文件前面，执行内置本体并返回其导出。 */
declare function __sonaLoadBundledCore(): SonaCoreModule

const BUNDLED_VERSION = __PLUGIN_VERSION__
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/WJZ-P/sona'
const MANIFEST_URL = `${CDN_BASE}@main/core-manifest.json`
const getCoreUrl = (version: string) => `${CDN_BASE}@v${version}/core.js`

const SAVED_CORE_KEY = 'sona-shell:core'
const BOOT_KEY = 'sona-shell:boot'
const BLOCKED_KEY = 'sona-shell:blocked'

/** 同一热更新版本连续这么多次没能完成启动，就拉黑并回退到内置版本。 */
const MAX_FAILED_BOOTS = 2
/** 启动后延迟检查更新：清单只有约 100 字节，稍微错开客户端启动的请求高峰即可。 */
const UPDATE_CHECK_DELAY_MS = 3_000
const MANIFEST_TIMEOUT_MS = 10_000
const CORE_DOWNLOAD_TIMEOUT_MS = 60_000
const LOG_PREFIX = '[Sona][Shell]'

interface SavedCore {
  version: string
  code: string
  sha256: string
  savedAt: number
}

interface BootRecord {
  version: string
  /** true 表示该版本已开始启动但 load 尚未完成。 */
  pending: boolean
  failures: number
}

let core: SonaCoreModule | null = null
let runningVersion = BUNDLED_VERSION
let runningSource: CoreSource = 'bundled'

// ==================== 生命周期 ====================

export function init(context: unknown) {
  const saved = selectSavedCore()
  if (saved) {
    try {
      const remoteCore = evaluateCore(saved.code)
      remoteCore.init(context, createEnv(saved.version, 'remote'))
      core = remoteCore
      runningVersion = saved.version
      runningSource = 'remote'
      console.info('%s 已启动热更新版本 v%s（内置 v%s）', LOG_PREFIX, saved.version, BUNDLED_VERSION)
      return
    } catch (error) {
      // init 可能已经执行了一部分；回退后内置版本会再注册一遍钩子，宁可重复也不能让插件整个失效。
      console.error('%s 热更新版本 v%s 启动失败，回退到内置版本:', LOG_PREFIX, saved.version, error)
      blockVersion(saved.version)
    }
  }

  core = __sonaLoadBundledCore()
  core.init(context, createEnv(BUNDLED_VERSION, 'bundled'))
  console.info('%s 已启动内置版本 v%s', LOG_PREFIX, BUNDLED_VERSION)
}

export function load() {
  if (!core) return

  try {
    core.load()
  } catch (error) {
    if (runningSource === 'remote') {
      console.error('%s 热更新版本 v%s 加载失败，下次启动将回退到内置版本:', LOG_PREFIX, runningVersion, error)
      blockVersion(runningVersion)
      safeToast('error', `Sona v${runningVersion} 加载失败，重启客户端后将回退到 v${BUNDLED_VERSION}`)
    }
    throw error
  }

  if (runningSource === 'remote') {
    DataStore.set(BOOT_KEY, { version: runningVersion, pending: false, failures: 0 } satisfies BootRecord)
  }

  window.setTimeout(() => {
    void checkForCoreUpdate()
  }, UPDATE_CHECK_DELAY_MS)
}

// ==================== 调试入口 ====================

/**
 * 在 DevTools 控制台使用：window.__SONA_SHELL__
 * - status()：查看当前运行版本、保存的版本、启动记录和黑名单
 * - checkForUpdate()：立即执行一次更新检查（不用等启动后的自动检查）
 * - reset()：清除热更新保存的本体、启动记录和黑名单，下次启动回到内置版本
 */
const shellDebugApi = {
  apiVersion: SHELL_API_VERSION,
  bundledVersion: BUNDLED_VERSION,
  status() {
    const saved = readSavedCore()
    return {
      running: { version: runningVersion, source: runningSource },
      bundledVersion: BUNDLED_VERSION,
      saved: saved ? { version: saved.version, sha256: saved.sha256, size: saved.code.length, savedAt: new Date(saved.savedAt).toLocaleString() } : null,
      boot: DataStore.get<BootRecord>(BOOT_KEY) ?? null,
      blocked: getBlockedVersions(),
      dynamicUpdateEnabled: isDynamicUpdateEnabled(),
      manualUpdateRequired: DataStore.get<string>(MANUAL_UPDATE_REQUIRED_STORE_KEY) ?? null,
    }
  },
  checkForUpdate: checkForCoreUpdate,
  reset() {
    DataStore.remove(SAVED_CORE_KEY)
    DataStore.remove(BOOT_KEY)
    DataStore.remove(BLOCKED_KEY)
    DataStore.remove(MANUAL_UPDATE_REQUIRED_STORE_KEY)
    console.info('%s 已清除热更新数据，下次启动使用内置版本 v%s', LOG_PREFIX, BUNDLED_VERSION)
  },
}

;(window as unknown as { __SONA_SHELL__?: typeof shellDebugApi }).__SONA_SHELL__ = shellDebugApi

function createEnv(coreVersion: string, coreSource: CoreSource): ShellEnv {
  return {
    apiVersion: SHELL_API_VERSION,
    metaUrl: import.meta.url,
    coreVersion,
    coreSource,
    bundledVersion: BUNDLED_VERSION,
  }
}

// ==================== 选择本体 ====================

function isDynamicUpdateEnabled(): boolean {
  return DataStore.get<boolean>(DYNAMIC_UPDATE_STORE_KEY) !== false
}

function readSavedCore(): SavedCore | null {
  const saved = DataStore.get<SavedCore>(SAVED_CORE_KEY)
  if (!saved || typeof saved.version !== 'string' || typeof saved.code !== 'string' || !saved.code) return null
  return saved
}

function getBlockedVersions(): string[] {
  const blocked = DataStore.get<string[]>(BLOCKED_KEY)
  return Array.isArray(blocked) ? blocked : []
}

function blockVersion(version: string) {
  const blocked = getBlockedVersions()
  if (!blocked.includes(version)) {
    DataStore.set(BLOCKED_KEY, [...blocked, version].slice(-20))
  }
  if (readSavedCore()?.version === version) {
    DataStore.remove(SAVED_CORE_KEY)
  }
  DataStore.remove(BOOT_KEY)
  console.warn('%s 已拉黑热更新版本 v%s', LOG_PREFIX, version)
}

/**
 * 返回本次应启动的热更新版本；不满足条件时返回 null，由调用方使用内置版本。
 * 同时维护启动记录：上次启动没走到 load 完成就算一次失败。
 */
function selectSavedCore(): SavedCore | null {
  if (!isDynamicUpdateEnabled()) return null

  const saved = readSavedCore()
  if (!saved) return null

  if (compareVersion(saved.version, BUNDLED_VERSION) <= 0) {
    // 用户手动安装了同版本或更新的插件，保存的热更新代码已经过时。
    DataStore.remove(SAVED_CORE_KEY)
    DataStore.remove(BOOT_KEY)
    return null
  }

  if (getBlockedVersions().includes(saved.version)) return null

  const boot = DataStore.get<BootRecord>(BOOT_KEY)
  const failures = boot?.pending && boot.version === saved.version ? boot.failures + 1 : 0
  if (failures >= MAX_FAILED_BOOTS) {
    console.error('%s 热更新版本 v%s 连续 %d 次未能完成启动，回退到内置版本', LOG_PREFIX, saved.version, failures)
    blockVersion(saved.version)
    return null
  }

  DataStore.set(BOOT_KEY, { version: saved.version, pending: true, failures } satisfies BootRecord)
  return saved
}

/** 同步执行本体 IIFE 代码并取出其导出。 */
function evaluateCore(code: string): SonaCoreModule {
  const factory = new Function(`${code}\n;return ${CORE_GLOBAL_NAME};`) as () => SonaCoreModule
  const coreModule = factory()
  if (!coreModule || typeof coreModule.init !== 'function' || typeof coreModule.load !== 'function') {
    throw new Error('本体导出缺少 init / load')
  }
  return coreModule
}

// ==================== 检查并下载更新 ====================

/** 更新检查结果，供调试入口在控制台查看。 */
type UpdateCheckResult =
  | 'disabled'
  | 'latest'
  | 'blocked'
  | 'shell-too-old'
  | 'downloaded'
  | 'failed'

async function checkForCoreUpdate(): Promise<UpdateCheckResult> {
  if (!isDynamicUpdateEnabled()) return 'disabled'

  try {
    const manifest = await fetchManifest()
    DataStore.remove(MANUAL_UPDATE_REQUIRED_STORE_KEY)
    const saved = readSavedCore()
    const newestLocal = saved && compareVersion(saved.version, runningVersion) > 0 ? saved.version : runningVersion

    if (compareVersion(manifest.version, newestLocal) <= 0) {
      console.info('%s 已是最新版本 v%s', LOG_PREFIX, newestLocal)
      return 'latest'
    }
    if (getBlockedVersions().includes(manifest.version)) {
      console.warn('%s 最新版本 v%s 已被拉黑，跳过下载', LOG_PREFIX, manifest.version)
      return 'blocked'
    }
    if (manifest.minShellApi > SHELL_API_VERSION) {
      DataStore.set(MANUAL_UPDATE_REQUIRED_STORE_KEY, manifest.version)
      console.warn(
        '%s v%s 需要壳接口版本 %d（当前 %d），请手动更新 Sona',
        LOG_PREFIX,
        manifest.version,
        manifest.minShellApi,
        SHELL_API_VERSION,
      )
      return 'shell-too-old'
    }

    console.info('%s 发现新版本 v%s，开始下载', LOG_PREFIX, manifest.version)
    const code = await fetchWithTimeout(getCoreUrl(manifest.version), {}, CORE_DOWNLOAD_TIMEOUT_MS)
      .then((resp) => {
        if (!resp.ok) throw new Error(`下载 core.js 失败：HTTP ${resp.status}`)
        return resp.text()
      })

    const sha256 = await sha256Hex(code)
    if (sha256 !== manifest.sha256) {
      throw new Error(`core.js 校验失败：期望 ${manifest.sha256}，实际 ${sha256}`)
    }
    // 只编译不执行，提前拦住语法错误，避免保存一份启动必崩的代码。
    new Function(code)

    DataStore.set(SAVED_CORE_KEY, { version: manifest.version, code, sha256, savedAt: Date.now() } satisfies SavedCore)
    DataStore.remove(BOOT_KEY)
    console.info('%s v%s 已保存，下次启动生效', LOG_PREFIX, manifest.version)
    // Ctrl+Enter 是当前 Pengu Loader 版本的重启客户端快捷键；重启后壳会读到新保存的版本。
    safeToast('success', `Sona v${manifest.version} 已下载，按 Ctrl+Enter 重启客户端后即可生效`)
    return 'downloaded'
  } catch (error) {
    console.warn('%s 检查或下载更新失败，下次启动再试:', LOG_PREFIX, error)
    return 'failed'
  }
}

async function fetchManifest(): Promise<CoreManifest> {
  // main 分支的清单在发版后会 purge jsDelivr；本地必须绕过浏览器 HTTP 缓存。
  const resp = await fetchWithTimeout(MANIFEST_URL, { cache: 'no-store' }, MANIFEST_TIMEOUT_MS)
  if (!resp.ok) throw new Error(`获取版本清单失败：HTTP ${resp.status}`)

  const manifest = await resp.json() as Partial<CoreManifest>
  if (
    typeof manifest.version !== 'string'
    || typeof manifest.sha256 !== 'string'
    || typeof manifest.minShellApi !== 'number'
  ) {
    throw new Error('版本清单格式不正确')
  }
  return manifest as CoreManifest
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// ==================== 工具 ====================

function compareVersion(left: string, right: string): number {
  const a = left.replace(/^v/i, '').split('.').map((part) => Number.parseInt(part, 10) || 0)
  const b = right.replace(/^v/i, '').split('.').map((part) => Number.parseInt(part, 10) || 0)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }
  return 0
}

function safeToast(type: 'success' | 'error', message: string) {
  try {
    if (typeof Toast !== 'undefined') Toast[type](message)
  } catch {
    // Toast 不可用时忽略，日志里已有记录。
  }
}
