/**
 * 组队界面快捷开关
 *
 * 背景：
 *   「自动返回」「自动排队」和「自动接受」是日常需要快速调整的功能，
 *   但设置入口在 F1 面板的工具页里，路径较深。
 *
 * 方案：
 *   在任意模式的组队界面（Lobby 阶段）房间标题后方，注入一条
 *   快捷开关条，与工具页里的同名设置共用同一组 store 键：
 *     - 自动返回房间 ↔ autoReturnToLobby（直接双向绑定）
 *     - 自动接受对局 ↔ autoAcceptMatch（直接双向绑定）
 *     - 自动排队     ↔ autoQueueAfterReturn（仅在返回房间后启动匹配）
 *
 * 锚点（来自客户端 rcp-fe-lol-parties 前端模板）：
 *   - 匹配/人机大厅使用 .v2-header-component .lobby-header-content，
 *     开关条插入 .lobby-header-buttons-container 前。
 *   - 自定义大厅使用 .parties-header-container .lobby-header-wrapper，
 *     开关条追加到标题行末尾。
 *   两种结构都是普通 Ember 组件（无 shadow DOM），document 查询可达。
 */

import { logger } from '@/index'
import { injector } from '@/lib/InjectorManager'
import { store } from '@/lib/store'
import { translate } from '@/i18n'

// ==================== 常量 ====================

const BAR_ID = 'sona-lobby-quick-toggles'
const STANDARD_HEADER_SELECTOR = '.v2-header-component .lobby-header-content'
const STANDARD_HEADER_BUTTONS_SELECTOR = ':scope > .lobby-header-buttons-container'
const CUSTOM_HEADER_SELECTOR = '.parties-header-container .lobby-header-wrapper'

type QuickToggleKey = 'autoReturn' | 'autoQueue' | 'autoAccept'

// ==================== 状态读取 ====================

function isAutoAcceptOn(): boolean {
  return store.get('autoAcceptMatch')
}

function isAutoReturnOn(): boolean {
  return store.get('autoReturnToLobby')
}

function isAutoQueueOn(): boolean {
  return store.get('autoQueueAfterReturn')
}

function setAutoAcceptOn(on: boolean) {
  store.set('autoAcceptMatch', on)
}

function setAutoReturnOn(on: boolean) {
  store.set('autoReturnToLobby', on)
}

function setAutoQueueOn(on: boolean) {
  store.set('autoQueueAfterReturn', on)
}

// ==================== DOM 构建 ====================

function buildToggle(key: QuickToggleKey, label: string): HTMLElement {
  const item = document.createElement('div')
  item.className = 'sona-lobby-quick-toggle'
  item.dataset.toggle = key

  const labelEl = document.createElement('span')
  labelEl.className = 'sona-lobby-quick-toggle-label'
  labelEl.textContent = label
  item.appendChild(labelEl)

  // 复用面板 SonaSwitch 的全局样式（CSS 已打进 index.css），保持视觉一致
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'sona-switch'
  btn.setAttribute('role', 'switch')
  btn.setAttribute('aria-label', label)
  const thumb = document.createElement('span')
  thumb.className = 'sona-switch-thumb'
  btn.appendChild(thumb)
  item.appendChild(btn)

  btn.addEventListener('mousedown', (e) => e.stopPropagation())
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    switch (key) {
      case 'autoReturn':
        setAutoReturnOn(!isAutoReturnOn())
        break
      case 'autoQueue':
        setAutoQueueOn(!isAutoQueueOn())
        break
      case 'autoAccept':
        setAutoAcceptOn(!isAutoAcceptOn())
        break
      default: {
        const exhaustive: never = key
        return exhaustive
      }
    }
    // store 订阅会同步按钮状态；这里立即刷一次让反馈无延迟
    syncToggleStates()
  })

  return item
}

function buildBar(): HTMLElement {
  const bar = document.createElement('div')
  bar.id = BAR_ID
  bar.className = 'sona-lobby-quick-toggles'

  bar.appendChild(buildToggle('autoReturn', translate('option.autoReturn.return')))
  bar.appendChild(buildToggle('autoQueue', translate('option.autoReturn.queue')))
  bar.appendChild(buildToggle('autoAccept', translate('tools.autoAccept.title')))

  // 防止事件穿透到客户端底层
  bar.addEventListener('mousedown', (e) => e.stopPropagation())
  bar.addEventListener('mouseup', (e) => e.stopPropagation())

  syncToggleStates(bar)
  return bar
}

/** 同步三个开关的亮灭状态（store → DOM 单向同步，点击路径也会调用） */
function syncToggleStates(root: ParentNode = document) {
  const bar = root instanceof HTMLElement && root.id === BAR_ID ? root : document.getElementById(BAR_ID)
  if (!bar) return

  const states: Record<QuickToggleKey, boolean> = {
    autoReturn: isAutoReturnOn(),
    autoQueue: isAutoQueueOn(),
    autoAccept: isAutoAcceptOn(),
  }
  for (const [key, on] of Object.entries(states) as [QuickToggleKey, boolean][]) {
    const btn = bar.querySelector(`.sona-lobby-quick-toggle[data-toggle="${key}"] .sona-switch`)
    if (!btn) continue
    btn.classList.toggle('sona-switch--on', on)
    btn.setAttribute('aria-checked', String(on))
  }
}

/** 语言切换时刷新开关文字（translate 读取时的语言来自 store） */
function refreshLabels() {
  const bar = document.getElementById(BAR_ID)
  if (!bar) return
  const labels: Record<QuickToggleKey, string> = {
    autoReturn: translate('option.autoReturn.return'),
    autoQueue: translate('option.autoReturn.queue'),
    autoAccept: translate('tools.autoAccept.title'),
  }
  for (const [key, text] of Object.entries(labels) as [QuickToggleKey, string][]) {
    const item = bar.querySelector(`.sona-lobby-quick-toggle[data-toggle="${key}"]`)
    const labelEl = item?.querySelector('.sona-lobby-quick-toggle-label')
    if (labelEl) labelEl.textContent = text
    item?.querySelector('.sona-switch')?.setAttribute('aria-label', text)
  }
}

// ==================== 注入任务 ====================

/**
 * 注入任务（幂等）：
 *   - 标题栏不存在（当前不在组队窗口）→ 清理开关条
 *   - 匹配/人机大厅 → 插入到原生按钮组前；自定义大厅 → 追加到标题行末尾
 *   - 标题栏元素被替换 → 将现有开关条移动到新标题栏
 */
function tryInjectLobbyQuickToggles(): boolean {
  // 客户端可能同时保留隐藏的标准大厅分支和当前自定义大厅分支；只选连接且有布局框的标题栏。
  const standardHeader = Array.from(document.querySelectorAll(STANDARD_HEADER_SELECTOR)).find(
    (candidate) => candidate.isConnected && candidate.getClientRects().length > 0,
  )
  const customHeader = Array.from(document.querySelectorAll(CUSTOM_HEADER_SELECTOR)).find(
    (candidate) => candidate.isConnected && candidate.getClientRects().length > 0,
  )
  const header = standardHeader ?? customHeader
  if (!header) {
    document.getElementById(BAR_ID)?.remove()
    return false
  }

  const nextSibling = standardHeader?.querySelector(STANDARD_HEADER_BUTTONS_SELECTOR) ?? null

  const bar = document.getElementById(BAR_ID)
  if (bar) {
    if (bar.parentElement === header && bar.nextElementSibling === nextSibling && bar.isConnected) return true
    header.insertBefore(bar, nextSibling)
    return true
  }

  header.insertBefore(buildBar(), nextSibling)
  logger.info('[LobbyQuickToggles] 快捷开关条已注入标题栏 ✓')
  return true
}

// ==================== 生命周期 ====================

let storeUnsubs: (() => void)[] = []
let injectRegistered = false

function removeInjection() {
  if (injectRegistered) {
    injector.unregister(tryInjectLobbyQuickToggles)
    injectRegistered = false
  }
  document.getElementById(BAR_ID)?.remove()
}

// ==================== 对外接口 ====================

/**
 * 启用/禁用「组队界面快捷开关」
 * 启用期间持续由 InjectorManager 检测组队窗口 DOM，离开后立即清理；
 * 订阅相关 store 键，保证工具页改动实时反映到开关条上。
 */
export function updateLobbyQuickToggles(enabled: boolean) {
  if (enabled && !injectRegistered) {
    injector.register(tryInjectLobbyQuickToggles)
    injectRegistered = true
    storeUnsubs = [
      store.onChange('autoReturnToLobby', () => syncToggleStates()),
      store.onChange('autoAcceptMatch', () => syncToggleStates()),
      store.onChange('autoQueueAfterReturn', () => syncToggleStates()),
      store.onChange('locale', refreshLabels),
    ]
    logger.info('[LobbyQuickToggles] 组队界面快捷开关已启用 ✓')
  } else if (!enabled && injectRegistered) {
    storeUnsubs.forEach((unsub) => unsub())
    storeUnsubs = []
    removeInjection()
    logger.info('[LobbyQuickToggles] 组队界面快捷开关已禁用')
  }
}
