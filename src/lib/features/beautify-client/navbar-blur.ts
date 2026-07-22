import { injector } from '@/lib/InjectorManager'

const NAVBAR_BACKDROP_SELECTOR = 'div.navbar_backdrop, div#navbar_backdrop'

let blur = 10
let registered = false

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function tryApplyNavbarBlur(): boolean {
  const navbarBackdrop = document.querySelector<HTMLElement>(NAVBAR_BACKDROP_SELECTOR)
  if (!navbarBackdrop) return false

  const filter = `blur(${clamp(blur, 0, 40)}px)`
  navbarBackdrop.style.setProperty('backdrop-filter', filter, 'important')
  navbarBackdrop.style.setProperty('-webkit-backdrop-filter', filter, 'important')
  return true
}

export function initBeautifyNavbarBlur() {
  if (registered) return

  registered = true
  injector.register(tryApplyNavbarBlur)
}

export function updateBeautifyNavbarBlur(value: number) {
  blur = clamp(Number.isFinite(value) ? value : 10, 0, 40)
  if (registered) tryApplyNavbarBlur()
}
