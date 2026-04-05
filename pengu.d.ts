/**
 * PenguLoader Runtime API Type Declarations
 * @see https://pengu.lol/runtime-api
 */

import type { Root } from 'react-dom/client'

declare global {
  interface PenguContext {
    rcp: {
      preInit: (name: string, callback: (api: unknown) => void) => void
      postInit: (name: string, callback: (api: unknown) => void) => void
    }
    socket: {
      observe: (uri: string, callback: (data: unknown) => void) => void
      disconnect: () => void
    }
  }

  interface Window {
    /** Opens Chrome DevTools window */
    openDevTools(remote?: boolean): void
    /** Opens the plugins folder */
    openPluginsFolder(path?: string): void
    /** Reloads the client (ignores cache) */
    reloadClient(): void
    /** Restarts the client (all UX processes) */
    restartClient(): void
    /** Gets the current script path */
    getScriptPath(): string
    /** Sona plugin runtime state */
    __SONA_RUNTIME__?: SonaRuntime
  }

  /** Pengu Loader namespace */
  const Pengu: {
    /** Current Pengu Loader version */
    version: string
  }

  /** Toast notification API @since v1.1.0 */
  const Toast: {
    /** Push a notification with a success checkmark icon */
    success(message: string): void
    /** Push a notification with a failure icon */
    error(message: string): void
    /** Push a progress notification that awaits a promise */
    promise<T>(promise: Promise<T>, msg: { loading: string; success: string; error: string }): Promise<T>
  }

  /**
   * DataStore - 持久化存储 API
   * 数据以 JSON 格式存储在磁盘上
   * @see https://pengu.lol/runtime-api/data-store
   */
  const DataStore: {
    /** 存储数据，返回是否成功 */
    set(key: string | number, value: unknown): boolean
    /** 读取数据，不存在时返回 fallback 或 undefined */
    get<T = unknown>(key: string | number, fallback?: T): T | undefined
    /** 检查键是否存在 */
    has(key: string | number): boolean
    /** 移除数据，返回是否成功 */
    remove(key: string | number): boolean
  }

  type SonaRuntime = {
    container: HTMLDivElement | null
    root: Root | null
    hasShownStartupToast: boolean
  }
}

export {}
