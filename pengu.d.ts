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

  type SonaRuntime = {
    container: HTMLDivElement | null
    root: Root | null
    hasShownStartupToast: boolean
  }
}

export {}
