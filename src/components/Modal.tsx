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
