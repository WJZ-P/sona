/**
 * 壳（plugins/sona/index.js）与本体（core.js）之间的契约。
 *
 * 壳很少更新，本体可以通过热更新替换。只要这里的接口不变，新本体就能在旧壳上运行；
 * 一旦接口发生不兼容变化，必须把 SHELL_API_VERSION +1，旧壳会拒绝下载要求更高版本的本体，
 * 用户需要手动更新插件一次。
 */

/** 当前壳的接口版本。只在壳与本体的接口出现不兼容变化时递增。 */
export const SHELL_API_VERSION = 1

/** 本体 IIFE 构建时挂出的全局变量名，壳执行代码后从这里取导出对象。 */
export const CORE_GLOBAL_NAME = 'SonaCore'

/** 热更新开关在 DataStore 中的键（与 store.ts 的 `sona:` 前缀一致）。 */
export const DYNAMIC_UPDATE_STORE_KEY = 'sona:dynamicCoreUpdate'

/**
 * 新版本要求更高的壳接口、无法热更新时，壳把该版本号写到这个 DataStore 键；
 * 本体的更新检查据此决定是否仍提示用户手动下载。
 */
export const MANUAL_UPDATE_REQUIRED_STORE_KEY = 'sona-shell:manual-update-required'

export type CoreSource = 'bundled' | 'remote'

/** 壳传给本体 init 的运行环境。 */
export interface ShellEnv {
  apiVersion: number
  /** 壳模块自身的 import.meta.url，本体据此解析插件目录。 */
  metaUrl: string
  /** 正在运行的本体版本。 */
  coreVersion: string
  /** 本体来源：随插件一起安装的内置版本，或热更新下载的版本。 */
  coreSource: CoreSource
  /** 随插件一起安装的内置本体版本。 */
  bundledVersion: string
}

/** 本体导出的入口。 */
export interface SonaCoreModule {
  init(context: unknown, env?: ShellEnv): void
  load(): void
}

/** jsDelivr 上 main 分支的发布清单，由构建生成并随版本提交。 */
export interface CoreManifest {
  version: string
  /** 运行该本体所需的最低壳接口版本。 */
  minShellApi: number
  /** core.js 内容的 SHA-256（十六进制）。 */
  sha256: string
  size: number
}
