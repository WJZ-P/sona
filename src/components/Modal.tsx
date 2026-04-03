import { useEffect, useRef, useState, type ReactNode } from 'react'
import '@/styles/Modal.css'

export interface ModalProps {
  /** 是否显示 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 标题 */
  title?: ReactNode
  /** 内容 */
  children: ReactNode
  /** 宽度，默认 680px */
  width?: number | string
  /** 高度，默认 520px */
  height?: number | string
  /** 点击遮罩是否关闭，默认 true */
  maskClosable?: boolean
  /** 是否显示关闭按钮，默认 true */
  closable?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 680,
  height = 520,
  maskClosable = true,
  closable = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)

  // 控制挂载/卸载：open 为 true 时立即挂载，关闭时等动画结束再卸载
  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
    } else if (mounted) {
      setClosing(true)
    }
  }, [open])

  // 监听退出动画结束后真正卸载
  useEffect(() => {
    if (!closing) return
    const overlay = overlayRef.current
    if (!overlay) {
      setMounted(false)
      setClosing(false)
      return
    }
    const onEnd = (e: AnimationEvent) => {
      if (e.target === overlay) {
        setMounted(false)
        setClosing(false)
      }
    }
    overlay.addEventListener('animationend', onEnd)
    return () => overlay.removeEventListener('animationend', onEnd)
  }, [closing])

  // ESC 关闭
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // 🪄 Sona 音乐星光粒子效果
  useEffect(() => {
    if (!mounted || closing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let initialized = false
    const particles: Array<{
      x: number; y: number; size: number;
      speedY: number; speedX: number; opacity: number; isGold: boolean
    }> = []

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        const w = parent.offsetWidth
        const h = parent.offsetHeight
        if (w > 0 && h > 0) {
          canvas.width = w
          canvas.height = h
        }
      }
    }

    const initParticles = () => {
      if (initialized || canvas.width === 0 || canvas.height === 0) return
      initialized = true
      for (let i = 0; i < 60; i++) {
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
      if (!initialized) {
        resizeCanvas()
        initParticles()
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.y -= p.speedY
        p.x += p.speedX
        p.opacity += (Math.random() - 0.5) * 0.02
        if (p.opacity < 0.1) p.opacity = 0.1
        if (p.opacity > 0.5) p.opacity = 0.5
        if (p.y < 0) {
          p.y = canvas.height
          p.x = Math.random() * canvas.width
        }
        if (p.isGold) {
          ctx.shadowBlur = 4
          ctx.shadowColor = `rgba(200, 170, 110, ${p.opacity})`
        } else {
          ctx.shadowBlur = 3
          ctx.shadowColor = `rgba(0, 180, 255, ${p.opacity * 0.8})`
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.isGold
          ? `rgba(220, 190, 130, ${p.opacity})`
          : `rgba(80, 200, 255, ${p.opacity * 0.85})`
        ctx.fill()
      })
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [mounted, closing])

  // 打开时阻止背景滚动
  useEffect(() => {
    if (mounted && !closing) {
      document.body.style.overflow = 'hidden'
    }
    if (!mounted) {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mounted, closing])

  if (!mounted) return null

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  const overlayClass = `sona-modal-overlay${closing ? ' sona-modal-closing' : ''}`
  const dialogClass = `sona-modal-dialog${closing ? ' sona-modal-closing' : ''}`

  return (
    <div
      ref={overlayRef}
      className={overlayClass}
      onClick={maskClosable ? onClose : undefined}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div
        ref={dialogRef}
        className={dialogClass}
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Canvas 粒子背景 */}
        <canvas
          ref={canvasRef}
          className="sona-modal-particle-canvas"
        />
        {/* Header */}
        {(title || closable) && (
          <div className="sona-modal-header">
            <div className="sona-modal-title">{title}</div>
            {closable && (
              <button className="sona-modal-close" onClick={onClose} title="Close">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        )}
        {/* Body */}
        <div className="sona-modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
