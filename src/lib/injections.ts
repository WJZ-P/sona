/**
 * 注入点注册中心
 *
 * 所有需要注入到 League Client DOM 中的元素都在这里定义。
 * 每个注入点是一个 tryInjectXxx 函数，通过 InjectorManager 统一调度。
 *
 * 新增注入点只需：
 * 1. 写一个 tryInjectXxx(): boolean 函数
 * 2. 在 registerAllInjections() 中 injector.register(tryInjectXxx)
 */

import { logger } from '@/index'
import { injector } from '@/lib/InjectorManager'
import { openModal, onModalVisibilityChange } from '@/lib/modal'
import sonaIcon from '../../assets/Champie_Sona_profileicon.png'

// ==================== Sona 入口按钮 ====================

const BUTTON_ID = 'sona-entry-btn'

/**
 * 创建 Sona 入口按钮 DOM 元素
 */
function createEntryButton(): HTMLElement {
  const btn = document.createElement('div')
  btn.id = BUTTON_ID
  btn.className = 'sona-entry-btn'

  btn.innerHTML = `
    <img class="sona-entry-icon" src="${sonaIcon}" alt="Sona" />
  `

  // 防止客户端底层的 mousedown/mouseup 事件穿透
  btn.addEventListener('mousedown', (e) => e.stopPropagation())
  btn.addEventListener('mouseup', (e) => e.stopPropagation())

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    openModal()
    logger.info('Modal opened')
  })

  // 模态窗口关闭时同步 active 状态
  onModalVisibilityChange((visible) => {
    btn.classList.toggle('sona-entry-btn--active', visible)
  })

  return btn
}

/**
 * 注入任务：Sona 入口按钮
 * 在 Play 按钮左侧注入，支持自愈（被刷掉后自动补回）
 */
function tryInjectSonaButton(): boolean {
  if (document.getElementById(BUTTON_ID)?.isConnected) return true

  const playButtonContainer = document.querySelector('.play-button-container')
  if (!playButtonContainer?.parentElement) return false

  const parent = playButtonContainer.parentElement
  parent.insertBefore(createEntryButton(), playButtonContainer)

  logger.info('Entry button injected ✓ (beside play button)')
  return true
}

// ==================== 注册所有注入点 ====================

/**
 * 注册所有注入任务并启动全局 DOM 守护
 * 在 index.tsx 的 load() 中调用一次即可
 */
export function registerAllInjections() {
  injector.register(tryInjectSonaButton)
  // 未来新增注入点在这里添加：
  // injector.register(tryInjectXxx)

  injector.start()
}
