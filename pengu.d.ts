/**
 * PenguLoader Runtime API Type Declarations
 * @see https://pengu.lol/runtime-api
 */

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

declare global {
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
  }

  /** Pengu Loader namespace */
  const Pengu: {
    /** Current Pengu Loader version */
    version: string
  }
}

export {}
