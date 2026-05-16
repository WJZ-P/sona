import { logger } from '@/index'

// ==================== 客户端窗口异常修复 ====================

let fixLcuWindowCleanup: (() => void) | null = null

/** LCU 客户端标准尺寸范围 */
const MIN_WIDTH = 1024
const MIN_HEIGHT = 576
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1200

function clampWindowSize() {
  const body = document.body
  if (!body) return

  const iw = window.innerWidth
  const ih = window.innerHeight
  const needsClamp =
    iw > MAX_WIDTH ||
    ih > MAX_HEIGHT ||
    (iw > 0 && iw < MIN_WIDTH) ||
    (ih > 0 && ih < MIN_HEIGHT)

  if (needsClamp) {
    body.style.maxWidth = `${MAX_WIDTH}px`
    body.style.maxHeight = `${MAX_HEIGHT}px`
    body.style.minWidth = `${MIN_WIDTH}px`
    body.style.minHeight = `${MIN_HEIGHT}px`
    body.style.overflow = 'auto'
  } else {
    body.style.maxWidth = ''
    body.style.maxHeight = ''
    body.style.minWidth = ''
    body.style.minHeight = ''
    body.style.overflow = ''
  }
}

export function updateFixLcuWindow(enabled: boolean) {
  if (enabled && !fixLcuWindowCleanup) {
    let debounceTimer: number
    const handler = () => {
      window.clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(clampWindowSize, 100)
    }
    window.addEventListener('resize', handler)
    clampWindowSize()
    fixLcuWindowCleanup = () => {
      window.removeEventListener('resize', handler)
      window.clearTimeout(debounceTimer)
      const b = document.body
      if (b) {
        b.style.maxWidth = ''
        b.style.maxHeight = ''
        b.style.minWidth = ''
        b.style.minHeight = ''
        b.style.overflow = ''
      }
    }
    logger.info('Fix LCU window enabled ✓')
  } else if (!enabled && fixLcuWindowCleanup) {
    fixLcuWindowCleanup()
    fixLcuWindowCleanup = null
    logger.info('Fix LCU window disabled')
  }
}
