import { logger } from '@/index'
import { injector } from '@/lib/InjectorManager'

// ==================== 全局粒子美化效果 ====================

const GLOBAL_CANVAS_ID = 'sona-global-particle-canvas'

/** 全局粒子的动画清理函数 */
let globalParticleAnimCleanup: (() => void) | null = null

/** 获取客户端主视图宿主，粒子必须挂载在这里才能正确显示 */
function getGlobalParticleHost(): HTMLElement | null {
  return document.getElementById('rcp-fe-viewport-root')
    ?? null
}

/**
 * 注入任务：确保全局粒子 canvas 存在并运行
 * 必须等待客户端主视图宿主就绪后才挂载，避免首启时被 loading/iframe 层遮挡
 */
function tryInjectGlobalParticle(): boolean {
  // 只在 LCU 主窗口挂载粒子特效，跳过子窗口（如 Wegame 对局助手、天赋选择弹窗）
  if (window.innerWidth < 800 || window.innerHeight < 550) return true

  const host = getGlobalParticleHost()
  if (!host) return false

  const existing = document.getElementById(GLOBAL_CANVAS_ID)
  if (existing instanceof HTMLCanvasElement && existing.isConnected) return true
  
  // 有旧动画残留先清掉
  if (globalParticleAnimCleanup) {
    globalParticleAnimCleanup()
    globalParticleAnimCleanup = null
  }

  // 创建并挂载 canvas 到主视图宿主
  const canvas = document.createElement('canvas')
  canvas.id = GLOBAL_CANVAS_ID
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:821;'
  host.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) return false


  let animId = 0
  let initialized = false
  const particles: Array<{
    x: number; y: number; size: number
    speedY: number; speedX: number; opacity: number; isGold: boolean
  }> = []

  const resize = () => {
    // 限制 canvas 最大尺寸，防止 CEF 子窗口（如 Wegame 对局助手）被异常撑大
    canvas.width = Math.min(window.innerWidth, 1920)
    canvas.height = Math.min(window.innerHeight, 1200)
  }

  const initParticles = () => {
    if (initialized || canvas.width === 0) return
    initialized = true
    for (let i = 0; i < 300; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speedY: Math.random() * 0.4 + 0.1,
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.3 + 0.1,
        isGold: Math.random() > 0.7,
      })
    }
  }

  const render = () => {
    if (!initialized) { resize(); initParticles() }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      p.y -= p.speedY
      p.x += p.speedX
      p.opacity += (Math.random() - 0.5) * 0.02
      if (p.opacity < 0.1) p.opacity = 0.1
      if (p.opacity > 0.5) p.opacity = 0.5
      if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width }
      if (p.isGold) { ctx.shadowBlur = 4; ctx.shadowColor = `rgba(200, 170, 110, ${p.opacity})` }
      else { ctx.shadowBlur = 3; ctx.shadowColor = `rgba(0, 180, 255, ${p.opacity * 0.8})` }
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = p.isGold ? `rgba(220, 190, 130, ${p.opacity})` : `rgba(80, 200, 255, ${p.opacity * 0.85})`
      ctx.fill()
    }
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
    animId = requestAnimationFrame(render)
  }

  resize()
  window.addEventListener('resize', resize)
  animId = requestAnimationFrame(render)

  globalParticleAnimCleanup = () => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
    canvas.remove()
  }

  logger.info('Global particle canvas injected ✓')
  return true
}


let globalParticleRegistered = false

export function updateGlobalParticle(enabled: boolean) {
  if (enabled && !globalParticleRegistered) {
    injector.register(tryInjectGlobalParticle)
    globalParticleRegistered = true
    logger.info('Global particle effect enabled ✓')
  } else if (!enabled && globalParticleRegistered) {
    injector.unregister(tryInjectGlobalParticle)
    globalParticleRegistered = false
    if (globalParticleAnimCleanup) {
      globalParticleAnimCleanup()
      globalParticleAnimCleanup = null
    }
    logger.info('Global particle effect disabled')
  }
}
