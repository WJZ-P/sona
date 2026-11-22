import type { ShellEnv } from '@/shell/contract'

/** 壳传入的运行环境；dev 模式或旧入口直接加载本体时为 null。 */
let shellEnv: ShellEnv | null = null

export function setShellEnv(env: ShellEnv | null | undefined) {
  shellEnv = env ?? null
}

export function getShellEnv(): ShellEnv | null {
  return shellEnv
}
