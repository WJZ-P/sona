import { registerXhrRule } from './core'
import type { XhrRule } from './types'

let installed = false

const AD_BLOCK_RULES: XhrRule[] = [
  {
    id: 'tencent-welive-match-popup',
    action: 'networkError',
    description: '阻断比赛直播资源请求，避免客户端弹出直播入口',
    match: 'https://log.welive.qq.com/send',
  },
]

export function installAdBlockXhrRules() {
  if (installed) return
  installed = true

  AD_BLOCK_RULES.forEach(registerXhrRule)
}
