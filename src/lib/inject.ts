/**
 * Sona 入口按钮注入器
 * 在 League Client 的 Play 按钮左侧注入一个 Sona 设置入口按钮。
 *
 * League Client 的主界面底部导航栏结构：
 *   .navigation-center 中包含 Play 按钮（.play-button-wrapper 或类似元素）
 *   我们在该区域左侧插入自定义按钮。
 */

import { logger } from '@/index'
import sonaIcon from '../../assets/Champie_Sona_profileicon.png'

const BUTTON_ID = 'sona-entry-btn'

/** 面板可见性变化的监听器 */
type VisibilityListener = (visible: boolean) => void
const listeners: Set<VisibilityListener> = new Set()

let panelVisible = false

export function isPanelVisible() {
  return panelVisible
}

export function togglePanel() {
  panelVisible = !panelVisible
  listeners.forEach((fn) => fn(panelVisible))
}

export function setPanelVisible(visible: boolean) {
  panelVisible = visible
  listeners.forEach((fn) => fn(panelVisible))
}

export function onPanelVisibilityChange(fn: VisibilityListener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/**
 * 创建 Sona 入口按钮 DOM 元素
 */
function createEntryButton(): HTMLElement {
  const btn = document.createElement('div')
  btn.id = BUTTON_ID
  btn.className = 'sona-entry-btn'

  // Sona 头像图标
  btn.innerHTML = `
    <img class="sona-entry-icon" src="${sonaIcon}" alt="Sona" />
  `

  btn.addEventListener('click', (e) => {
    e.stopPropagation() //  这里阻止了冒泡，但是点击的时候，还是会触发container的点击事件
    // 🪄 加上这两句，防一手客户端底层的 mousedown/mouseup 监听！
    btn.addEventListener('mousedown', (e) => e.stopPropagation())
    btn.addEventListener('mouseup', (e) => e.stopPropagation())
    togglePanel()
    btn.classList.toggle('sona-entry-btn--active', panelVisible)
    logger.info('Panel toggled: %s', panelVisible ? 'open' : 'closed')
  })

  return btn
}

/**
 * 尝试将按钮注入到目标位置
 * 返回是否成功注入
 */
function tryInject(): boolean {
  // 如果已注入，跳过
  if (document.getElementById(BUTTON_ID)) return true

  // 找左上角的PLAY按钮容器
  const playButtonContainer = document.querySelector('.play-button-container')

  if (playButtonContainer) {
    const parent = playButtonContainer.parentElement
    if (!parent) return false
    const entryBtn = createEntryButton()
    parent.insertBefore(entryBtn, playButtonContainer)
    logger.info('Entry button injected ✓ (beside play button)')
    return true
  }

  return false
}

/**
 * 启动注入流程
 * 使用 MutationObserver 持续监视 DOM 变化，直到成功注入
 */
export function startInjection() {
  // 先尝试立即注入
  if (tryInject()) return

  logger.info('Waiting for navigation bar to inject entry button...')

  const observer = new MutationObserver(() => {
    if (tryInject()) {
      observer.disconnect()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // 30s 超时自动停止观察
  setTimeout(() => {
    observer.disconnect()
    if (!document.getElementById(BUTTON_ID)) {
      logger.error('Entry button injection timed out')
    }
  }, 30_000)
}
