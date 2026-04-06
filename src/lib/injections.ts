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
import { store } from '@/lib/store'
import { openModal, onModalVisibilityChange } from '@/lib/modal'
import sonaIcon from '../../assets/Champie_Sona_profileicon.png'
import { lcu } from '@/lib/lcu'
import type { Availability } from '@/lib/lcu'

/** 通用标记：标识已被 Sona 接管的 DOM 元素，防止重复绑定 */
const HIJACKED_ATTR = 'data-sona-hijacked'

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


// ==================== 接管在线状态切换按钮 ====================




const MENU_ID = 'sona-availability-menu'

const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: 'chat', label: '在线' },
  { value: 'away', label: '离开' },
  //{ value: 'dnd', label: '勿扰' }, 勿扰跟离开看起来是一样的，留一个就行了
  { value: 'offline', label: '隐身' },
  { value: 'mobile', label: '手机在线' },
]

/** 当前状态缓存（从 store 初始化） */
let currentAvailability: Availability = store.get('availability') as Availability

/**
 * 启动时恢复持久化的在线状态和签名
 * - 将 store 中保存的 availability 设置到客户端
 * - 检测到签名为空时，自动恢复 store 中保存的签名
 */
async function restoreAvailabilityAndStatus() {
  try {
    const me = await lcu.getChatMe()
    const savedAvailability = store.get('availability') as Availability
    const savedStatus = store.get('statusMessage')

    // 恢复在线状态
    if (savedAvailability && savedAvailability !== me.availability) {
      await lcu.setAvailability(savedAvailability)
      currentAvailability = savedAvailability
      logger.info('Restored availability: %s', savedAvailability)
    } else {
      currentAvailability = me.availability
    }

    // 签名为空且有保存的签名时，自动恢复
    if (me.statusMessage.length === 0 && savedStatus) {
      await lcu.setStatusMessage(savedStatus)
      logger.info('Restored status message: %s', savedStatus)
    } else if (me.statusMessage) {
      // 客户端有签名，同步到 store
      store.set('statusMessage', me.statusMessage)
    }
  } catch (err) {
    logger.warn('Failed to restore availability/status:', err)
  }
}

/** 关闭已有的菜单 */
function closeAvailabilityMenu() {
  document.getElementById(MENU_ID)?.remove()
}

/** 创建并显示状态选择菜单 */
function showAvailabilityMenu(anchor: HTMLElement) {
  closeAvailabilityMenu()

  const menu = document.createElement('div')
  menu.id = MENU_ID
  menu.className = 'sona-availability-menu'

  for (const option of AVAILABILITY_OPTIONS) {
    const btn = document.createElement('button')
    btn.className = `sona-availability-option${currentAvailability === option.value ? ' sona-availability-option--active' : ''}`
    btn.type = 'button'
    btn.innerHTML = `
      <span class="sona-availability-dot sona-availability-dot--${option.value}"></span>
      <span>${option.label}</span>
    `

    btn.addEventListener('mousedown', (e) => e.stopPropagation())
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      e.stopImmediatePropagation()

      if (option.value !== currentAvailability) {
        currentAvailability = option.value
        store.set('availability', option.value)
        lcu.setAvailability(option.value)
          .then(() => logger.info('Status changed to: %s', option.value))
          .catch((err) => logger.error('Failed to set status:', err))
      }
      closeAvailabilityMenu()
    }, true)

    menu.appendChild(btn)
  }

  // 计算 fixed 定位坐标，基于 anchor 的位置
  const rect = anchor.getBoundingClientRect()
  menu.style.top = `${rect.bottom + 6}px`
  menu.style.left = `${rect.left + rect.width / 2 - 6}px` // 60 ≈ min-width/2

  document.body.appendChild(menu)

  // 点击外部关闭
  const onOutsideClick = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      closeAvailabilityMenu()
      document.removeEventListener('mousedown', onOutsideClick, true)
    }
  }
  // 延迟一帧再绑定，避免当前这次点击立刻触发关闭
  requestAnimationFrame(() => {
    document.addEventListener('mousedown', onOutsideClick, true)
  })
}

/**
 * 注入任务：接管 .lol-social-availability-hitbox 的点击事件
 * 阻止客户端原有逻辑，替换为自定义的状态选择菜单
 */
function tryHijackAvailabilityHitbox(): boolean {
  const hitbox = document.querySelector(`.lol-social-availability-hitbox:not([${HIJACKED_ATTR}])`) as HTMLElement | null
  if (!hitbox) return true

  hitbox.setAttribute(HIJACKED_ATTR, 'true')

  // 启动时恢复持久化的在线状态和签名
  restoreAvailabilityAndStatus()

  hitbox.addEventListener('click', (e) => {
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()
    logger.debug('Availability hitbox clicked')
    // 已经打开则关闭，否则打开
    if (document.getElementById(MENU_ID)) {
      closeAvailabilityMenu()
      logger.debug('Availability menu closed')
    } else {
      showAvailabilityMenu(hitbox)
      logger.debug('Availability menu shown')
    }
  }, true)

  logger.info('Availability hitbox hijacked ✓')
  return true
}

// ==================== 注册所有注入点 ====================

/**
 * 注册所有注入任务并启动全局 DOM 守护
 * 在 index.tsx 的 load() 中调用一次即可
 */
export function registerAllInjections() {
  injector.register(tryInjectSonaButton)
  injector.register(tryHijackAvailabilityHitbox)

  injector.start()
}
