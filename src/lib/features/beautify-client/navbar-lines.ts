import { injector } from '@/lib/InjectorManager'

const STYLE_ID = 'sona-navbar-lines-style'
const VERTICAL_RULE_SELECTOR = '.right-nav-vertical-rule'
const NAVIGATION_ROOT_SELECTOR = 'div.navigation-root-component'

let enabled = false
let registered = false
const removedVerticalRules = new Map<HTMLElement, { parent: Node; nextSibling: Node | null }>()

function removeStyle() {
  document.getElementById(STYLE_ID)?.remove()
}

function restoreVerticalRules() {
  removedVerticalRules.forEach(({ parent, nextSibling }, rule) => {
    if (!parent.isConnected || rule.isConnected) return
    const anchor = nextSibling?.parentNode === parent ? nextSibling : null
    parent.insertBefore(rule, anchor)
  })
  removedVerticalRules.clear()
}

function tryApplyNavbarLines(): boolean {
  if (!enabled) {
    removeStyle()
    restoreVerticalRules()
    return true
  }

  document.querySelectorAll<HTMLElement>(VERTICAL_RULE_SELECTOR).forEach((rule) => {
    const parent = rule.parentNode
    if (!parent) return
    removedVerticalRules.set(rule, { parent, nextSibling: rule.nextSibling })
    rule.remove()
  })

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = `
      ${NAVIGATION_ROOT_SELECTOR} {
        border-bottom: none !important;
      }
    `
    document.head.appendChild(style)
  }

  return Boolean(
    removedVerticalRules.size > 0 || document.querySelector(NAVIGATION_ROOT_SELECTOR),
  )
}

export function initBeautifyNavbarLines() {
  if (registered) return
  registered = true
  injector.register(tryApplyNavbarLines)
}

export function updateBeautifyNavbarLines(value: boolean) {
  enabled = Boolean(value)
  if (registered) tryApplyNavbarLines()
}
