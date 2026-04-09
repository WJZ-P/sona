import { useEffect, useRef } from 'react'

// ==================== 配置 ====================

interface TierConfig {
  id: string
  borderColor: string
  particleColors: string[]
  particleStyle: 'fire' | 'magic' | 'ambient' | 'ash' | 'void'
  filter?: string
  boxShadow?: string
}

function getTierConfig(winRate: number): TierConfig {
  if (winRate >= 70 ) return {
    id: 'blazing',
    borderColor: '#ff3300',
    particleColors: ['#ff3300', '#ffaa00', '#ff003c'],
    particleStyle: 'fire',
    boxShadow: '0 0 15px rgba(255,51,0,0.5)',
  }
  if (winRate >= 60 ) return {
    id: 'strong',
    borderColor: '#c8aa6e',
    particleColors: ['#4a9eff', '#7ec8ff', '#2060c0'],
    particleStyle: 'magic',
    boxShadow: '0 0 8px rgba(74,158,255,0.35)',
  }

  if (winRate >= 50) return {
    id: 'normal',
    borderColor: '#3c2e16',
    particleColors: ['#a09b8c', '#5c6b73', '#d1d8e0'],
    particleStyle: 'ambient',
    boxShadow: '0 0 6px rgba(160,155,140,0.25)',
  }
  if (winRate >= 40) return {
    id: 'shaky',
    borderColor: '#555555',
    particleColors: ['#8b6914', '#a07828', '#6b4e0a'],
    particleStyle: 'ash',
    filter: 'saturate(0.5)',
    boxShadow: '0 0 6px rgba(139,105,20,0.3)',

  }
  return {
    id: 'dizzy',
    borderColor: '#8b00ff',
    particleColors: ['#8b00ff', '#4a0080', '#000000'],
    particleStyle: 'void',
    filter: 'grayscale(1) contrast(1.2)',
    boxShadow: '0 0 10px rgba(139,0,255,0.4)',
  }

}

// ==================== 粒子类型 ====================

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  decay: number
}

// ==================== 组件 ====================

export interface ChampSelectIconEffectProps {
  /** 胜率 (0~100) */
  winRate: number
  /** Canvas 尺寸，应覆盖整个 champion-icon-container */
  width?: number
  height?: number
}

export function ChampSelectIconEffect({ winRate, width = 160, height = 160 }: ChampSelectIconEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const config = getTierConfig(winRate)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctxRaw = canvas.getContext('2d')
    if (!ctxRaw) return
    const ctx = ctxRaw

    const centerX = width / 2
    const centerY = height / 2
    const avatarRadius = Math.min(width, height) / 4 // 头像大约占一半

    let animationId = 0
    const particles: Particle[] = []

    function createParticle(): Particle {
      const angle = Math.random() * Math.PI * 2
      const r = avatarRadius + Math.random() * 5
      const colors = config.particleColors

      const p: Particle = {
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
        size: Math.random() * 2.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: Math.random() * 0.01 + 0.005,
      }

      switch (config.particleStyle) {
        case 'fire':
          p.vx = Math.cos(angle) * (Math.random() * 0.3 + 0.1)
          p.vy = Math.sin(angle) * (Math.random() * 0.3 + 0.1) - 0.2
          p.decay = Math.random() * 0.008 + 0.003
          break
        case 'magic':
          p.vx = (Math.random() - 0.5) * 0.3
          p.vy = -Math.random() * 0.5 - 0.2
          break
        case 'ambient':
          p.vx = (Math.random() - 0.5) * 0.2
          p.vy = (Math.random() - 0.5) * 0.2 - 0.1
          p.decay = Math.random() * 0.008 + 0.004
          break
        case 'ash':
          p.vx = (Math.random() - 0.5) * 0.3
          p.vy = Math.random() * 0.1 + 0.2
          break
        case 'void': {
          const spawnR = avatarRadius + 15
          p.x = centerX + Math.cos(angle) * spawnR
          p.y = centerY + Math.sin(angle) * spawnR
          p.vx = -Math.cos(angle) * (Math.random() * 0.4 + 0.1)
          p.vy = -Math.sin(angle) * (Math.random() * 0.4 + 0.1)
          p.decay = Math.random() * 0.015 + 0.01
          break
        }
      }

      return p
    }

    function render() {
      ctx.clearRect(0, 0, width, height)

      const spawnRate = config.particleStyle === 'fire' ? 3 : 2
      const spawnThreshold = config.particleStyle === 'ambient' ? 0.7 : 0.3

      for (let i = 0; i < spawnRate; i++) {
        if (Math.random() > spawnThreshold) particles.push(createParticle())
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= p.decay

        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)

        // 边缘渐出：根据离画布圆形边界的距离降低透明度
        const dx = p.x - centerX
        const dy = p.y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const canvasRadius = Math.min(width, height) / 2
        const edgeFade = Math.max(0, 1 - dist / canvasRadius)
        ctx.globalAlpha = p.life * edgeFade

        ctx.fillStyle = p.color


        const style = config.particleStyle
        if (style === 'fire' || style === 'magic') {
          ctx.shadowBlur = 8
          ctx.shadowColor = p.color
        } else if (style === 'ambient') {
          ctx.shadowBlur = 3
          ctx.shadowColor = p.color
        } else {
          ctx.shadowBlur = 0
        }

        ctx.fill()
        ctx.globalAlpha = 1
      }

      animationId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationId)
      ctx.clearRect(0, 0, width, height)
    }
  }, [config, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
        borderRadius: '50%',
        mixBlendMode: config.particleStyle === 'void' ? 'normal' : 'screen',
      }}
    />
  )
}

/** 导出配置获取函数供外部使用 */
export { getTierConfig }
export type { TierConfig }
