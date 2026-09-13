import { store } from '@/lib/store'
import { registerXhrRule } from './core'
import type { XhrRule } from './types'

let installed = false

const PROFILE_PRIVACY_RULES: XhrRule[] = [
  {
    id: 'profile-privacy-disabled',
    action: 'rewriteResponse',
    description: 'Rewrite the profile privacy setting response to allow viewing private profiles',
    match: '/lol-summoner/v1/profile-privacy-enabled',
    response: false,
    status: 200,
    statusText: 'OK',
  },
]

export function installProfilePrivacyXhrRules() {
  if (installed || !store.get('ignoreProfilePrivacy')) return
  installed = true

  PROFILE_PRIVACY_RULES.forEach(registerXhrRule)
}
