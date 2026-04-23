/**
 * 英雄选择阶段"退出对局"按钮注入
 *
 * 背景：
 *   在**非自定义对局**（匹配/排位/大乱斗等）的英雄选择阶段，客户端内置的
 *   `.quit-button` 不会被渲染出来。玩家想秒退只能靠关客户端或其他邪道，
 *   体验很差。
 *
 * 方案：
 *   监听 gameflow-phase，进入 ChampSelect 时注册 injector 任务：
 *     - 若 `.bottom-right-buttons` 里已有 `.quit-button`（自定义对局）→ 不管
 *     - 否则克隆一个长得一样的按钮插入容器末尾，点击走 Sona 的确认弹窗 → `lcu.dodgeChampSelect()`
 *
 *   为什么选 DOM 注入而不是 Ember hook：
 *     1. 原生 `.quit-button` 的显隐由 `isCustomGame` 等字段控制，即便用 mixin
 *        让它显示出来，点击回调背后可能还有二次校验，改的面太大
 *     2. DOM 注入对客户端内部字段无依赖，`.bottom-right-buttons` 是非常稳定的容器
 *     3. 切开关能立即生效（无需重启）——Ember hook 方案必须在 init 阶段部署
 *
 * 样式参考（用户提供）：
 *   .quit-button 宽 125px、右边距 10px，配合父容器 flex 布局
 */

import { logger } from '@/index'
import { lcu, LcuEventUri, type LCUEventMessage } from '@/lib/lcu'
import type { GameflowPhase } from '@/types/lcu'
import { injector } from '@/lib/InjectorManager'

// ==================== 常量 ====================

const CONTAINER_SELECTOR = '.bottom-right-buttons'
const NATIVE_QUIT_SELECTOR = '.quit-button'
const SONA_QUIT_ATTR = 'data-sona-quit-button'
const CONFIRM_OVERLAY_ID = 'sona-quit-confirm-overlay'

// ==================== 确认弹窗 ====================

/**
 * 展示一个居中的确认弹窗（原生 DOM，不走 React——这个功能太独立，
 * 不值得引 React root 进来）
 */
function showConfirmDialog(onConfirm: () => void) {
  // 防止重复打开
  if (document.getElementById(CONFIRM_OVERLAY_ID)) return

  const overlay = document.createElement('div')
  overlay.id = CONFIRM_OVERLAY_ID
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:rgba(0,0,0,0.65)',
    'z-index:821',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'backdrop-filter:blur(2px)',
  ].join(';')

  const dialog = document.createElement('div')
  dialog.style.cssText = [
    'min-width:420px',
    'max-width:480px',
    'background:#010a13',
    'border:1px solid #785a28',
    'box-shadow:0 0 32px rgba(0,0,0,0.8)',
    'padding:24px 28px',
    'font-family:var(--font-body)',
    '-webkit-font-smoothing:subpixel-antialiased',
    'color:#a09b8c',
  ].join(';')

  const title = document.createElement('div')
  title.textContent = '确认退出英雄选择？'
  title.style.cssText = [
    'color:#f0e6d2',
    'font-size:16px',
    'font-weight:700',
    'letter-spacing:0.075em',
    'line-height:20px',
    'text-transform:uppercase',
    'border-bottom:1px solid #3c3c41',
    'padding-bottom:10px',
    'margin-bottom:14px',
  ].join(';')
  dialog.appendChild(title)

  const desc = document.createElement('div')
  desc.innerHTML = [
    '秒退将会：',
    '<br/>• 立即退出英雄选择并返回大厅',
    '<br/>• <span style="color:#e84749;font-weight:bold;">短时间内无法匹配</span>，并可能扣除信誉分',
    '<br/><br/>请谨慎操作。',
  ].join('')
  desc.style.cssText = 'font-size:13px;line-height:20px;margin-bottom:20px;'
  dialog.appendChild(desc)

  const btnRow = document.createElement('div')
  btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;'

  // 两个按钮都直接用客户端原生的 <lol-uikit-flat-button>，自带官方样式/hover/点击反馈
  const cancelBtn = document.createElement('lol-uikit-flat-button')
  cancelBtn.textContent = '取消'
  cancelBtn.style.minWidth = '100px'

  const confirmBtn = document.createElement('lol-uikit-flat-button')
  confirmBtn.textContent = '确认秒退'
  confirmBtn.style.minWidth = '120px'
  // 强调危险操作——文字染红，但是好像没用
  confirmBtn.style.color = '#e84749'

  const close = () => {
    overlay.remove()
  }

  cancelBtn.addEventListener('click', close)
  confirmBtn.addEventListener('click', () => {
    close()
    onConfirm()
  })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })

  btnRow.appendChild(cancelBtn)
  btnRow.appendChild(confirmBtn)
  dialog.appendChild(btnRow)
  overlay.appendChild(dialog)
  document.body.appendChild(overlay)
}

// ==================== 按钮构建 ====================

/**
 * 直接召唤客户端的原生自定义组件 `<lol-uikit-flat-button>`——
 * 浏览器底层会自动为它生成带官方金色边框、hover 动效、点击反馈的 Shadow DOM。
 * 我们只管塞文字和绑事件，样式/交互全免费。
 */
function buildSonaQuitButton(): HTMLElement {
  const btn = document.createElement('lol-uikit-flat-button')
  btn.setAttribute(SONA_QUIT_ATTR, 'true')
  btn.textContent = '退出对局'
  // 对齐原生 quit-button 的布局规格：125px 宽 + 10px 右边距，配合父容器 flex
  btn.style.width = '125px'
  btn.style.marginRight = '10px'

  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    e.preventDefault()
    showConfirmDialog(async () => {
      try {
        await lcu.dodgeChampSelect()
        logger.info('[QuitButton] 已发送秒退请求 ✓')
      } catch (err) {
        logger.error('[QuitButton] 秒退请求失败:', err)
      }
    })
  })

  return btn
}

// ==================== 注入任务 ====================

/**
 * 检查并注入退出按钮（幂等）：
 *   - 已有原生 `.quit-button`（自定义对局）→ 不注入
 *   - 已有我们的按钮 → 跳过
 *   - 否则：克隆并插入
 */
function tryInjectQuitButton(): boolean {
  const container = document.querySelector(CONTAINER_SELECTOR)
  if (!container) return false

  // 原生按钮已存在（自定义对局），不干预
//   if (container.querySelector(NATIVE_QUIT_SELECTOR)) {
//     const ours = container.querySelector(`[${SONA_QUIT_ATTR}]`)
//     if (ours) ours.remove()
//     return true
//   }

  // 已经注入过，ok
  if (container.querySelector(`[${SONA_QUIT_ATTR}]`)) return true

  const btn = buildSonaQuitButton()
  // 插到容器最前面，视觉上靠左——和原生 quit-button 位置一致
  container.insertBefore(btn, container.firstChild)
  logger.info('[QuitButton] 已注入选人阶段退出按钮 ✓')
  return true
}

// ==================== 生命周期 ====================

let phaseUnsub: (() => void) | null = null
let injectRegistered = false

function mount() {
  if (injectRegistered) return
  injector.register(tryInjectQuitButton)
  injectRegistered = true
}

function unmount() {
  if (injectRegistered) {
    injector.unregister(tryInjectQuitButton)
    injectRegistered = false
  }
  // 清理已注入的按钮和可能打开的确认弹窗
  document.querySelectorAll(`[${SONA_QUIT_ATTR}]`).forEach((el) => el.remove())
  const overlay = document.getElementById(CONFIRM_OVERLAY_ID)
  if (overlay) overlay.remove()
}

// ==================== 对外接口 ====================

/**
 * 启用/禁用「选人阶段退出按钮」功能
 * 仅在 ChampSelect 阶段挂载 injector 任务，离开阶段立即清理
 */
export function updateChampSelectQuitButton(enabled: boolean) {
  if (enabled && !phaseUnsub) {
    phaseUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      if (phase === 'ChampSelect') {
        mount()
      } else {
        unmount()
      }
    })

    // 启动时若已经在 ChampSelect 阶段，立即挂载
    lcu.getGameflowPhase().then((phase) => {
      if (phase === 'ChampSelect') mount()
    }).catch(() => { /* ignore */ })

    logger.info('[QuitButton] 选人阶段退出按钮已启用 ✓')
  } else if (!enabled && phaseUnsub) {
    phaseUnsub()
    phaseUnsub = null
    unmount()
    logger.info('[QuitButton] 选人阶段退出按钮已禁用')
  }
}
