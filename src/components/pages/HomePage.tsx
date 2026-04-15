import { useEffect, useRef } from 'react'
import '@/styles/HomePage.css'
import sonaIcon from '@/../assets/Champie_Sona_profileicon.png'

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    const particles: Array<{
      x: number; y: number
      vx: number; vy: number
      size: number; opacity: number
      life: number; maxLife: number
      isGold: boolean
    }> = []

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.offsetWidth
        canvas.height = parent.offsetHeight
      }
    }

    const spawn = () => {
      const cx = canvas.width / 2
      const cy = canvas.height / 2
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 0.6 + 0.2
      const isGold = Math.random() > 0.35
      particles.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 1.8 + 0.5,
        opacity: 0,
        life: 0,
        maxLife: 120 + Math.random() * 80,
        isGold,
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 每帧生成 2~3 个粒子
      if (particles.length < 200) {
        spawn()
        spawn()
        if (Math.random() > 0.3) spawn()
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.vx
        p.y += p.vy
        // 轻微减速
        p.vx *= 0.998
        p.vy *= 0.998

        // 前 20% 淡入，后 30% 淡出
        const progress = p.life / p.maxLife
        if (progress < 0.2) {
          p.opacity = (progress / 0.2) * 0.8
        } else if (progress > 0.7) {
          p.opacity = ((1 - progress) / 0.3) * 0.8
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1)
          continue
        }

        if (p.isGold) {
          ctx.shadowBlur = 6
          ctx.shadowColor = `rgba(200, 170, 110, ${p.opacity})`
          ctx.fillStyle = `rgba(220, 190, 130, ${p.opacity})`
        } else {
          ctx.shadowBlur = 5
          ctx.shadowColor = `rgba(0, 180, 255, ${p.opacity * 0.8})`
          ctx.fillStyle = `rgba(100, 200, 255, ${p.opacity * 0.85})`
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'

      animId = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="sona-home-particle-canvas" />
}

export function HomePage() {
  return (
    <div className="sona-home">
      <ParticleCanvas />

      {/* SONA 标题 */}
      <h1 className="sona-home-brand">
        <span className="sona-home-brand-text">SONA</span>
      </h1>

      {/* 头像 */}
      <div className="sona-home-avatar-wrap">
        <div className="sona-home-avatar-glow" />
        <img
          className="sona-home-avatar"
          src={sonaIcon}
          alt="Sona"
          draggable={false}
        />
      </div>

      {/* 欢迎语 */}
      <div className="sona-home-welcome">
        <h2 className="sona-home-heading">欢迎使用 Sona</h2>
        <p className="sona-home-subtitle">
          你的英雄联盟客户端增强工具
        </p>
      </div>

      {/* 琴女语录 */}
      <p className="sona-home-quote">
        "本项目完全开源免费，如果你通过收费渠道使用，那你被骗啦!"
        <br />
        &nbsp;—— 神奇的WJZ_P
      </p>
    </div>
  )
}
