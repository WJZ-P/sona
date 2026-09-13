import { registerXhrRule } from './core'
import type { XhrRule } from './types'

let installed = false

const AD_BLOCK_RULES: XhrRule[] = [
  {
    id: 'tencent-welive-match-popup',
    action: 'networkError',
    description: 'Block match livestream resource requests to prevent livestream popups in the client',
    match: 'https://log.welive.qq.com/send',
  },
]

export function installAdBlockXhrRules() {
  if (installed) return
  installed = true

  AD_BLOCK_RULES.forEach(registerXhrRule)
}
