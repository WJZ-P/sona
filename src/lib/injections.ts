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
import { lcu, LcuEventUri, type LCUEventMessage } from '@/lib/lcu'
import type { Availability, ChatMe } from '@/lib/lcu'
import { sleep } from '@/lib/utils'

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
 *
 * 【重要防御】只在"游戏流程空闲"阶段（None / Lobby）才恢复，否则会和拳头底层状态机打架：
 *   - 玩家在 ChampSelect / InProgress / EndOfGame 等阶段时，客户端 C++ 层会接管
 *     lol 对象（写入"选人中/游戏中"），这时如果我们强行 PUT availability=chat，
 *     XMPP payload 会变成"绿色圆点 + 游戏中文字"的缝合怪状态，可能麦克风自动断开
 *     也和这个有关？
 *
 * 另外：LCU 启动初期聊天服务器（XMPP）尚未连接完成，getChatMe 可能返回假 offline。
 * 所以恢复操作只做一次，不做周期性校正。
 */
async function restoreAvailabilityAndStatus() {
  try {
    // 这里如果是游戏中或者其他在玩的状态，就直接放行，不改，不然怕关麦克风的bug。
    const phase = await lcu.getGameflowPhase()
    if (phase !== 'None' && phase !== 'Lobby') {
      logger.info('[Availability] 当前阶段 %s，跳过状态恢复（避免与底层状态机冲突）', phase)
      return
    }

    const me = await lcu.getChatMe()
    const savedAvailability = store.get('availability') as Availability
    const savedStatus = store.get('statusMessage')

    // 2. 恢复在线状态（带验证重试）
    if (savedAvailability && savedAvailability !== me.availability) {
      await persistWithVerify({
        label: 'availability',
        target: savedAvailability,
        write: () => lcu.setAvailability(savedAvailability),
        read: async () => (await lcu.getChatMe()).availability,
      })
      currentAvailability = savedAvailability
    } else {
      currentAvailability = me.availability
    }

    // 3. 签名处理（同样只在空闲阶段做，且带验证重试）
    //    - 客户端无签名（null / 非字符串 / 空字符串） + store 有有效签名 → 恢复
    //    - 客户端有有效签名 → 同步到 store
    //    - 非字符串 / 空字符串 一律不写入 store，避免空值污染
    const clientStatus = hasContent(me.statusMessage) ? (me.statusMessage as string) : ''
    if (clientStatus === '' && hasContent(savedStatus)) {
      await persistWithVerify({
        label: 'statusMessage',
        target: savedStatus,
        write: () => lcu.setStatusMessage(savedStatus),
        read: async () => {
          const v = (await lcu.getChatMe()).statusMessage
          return hasContent(v) ? (v as string) : ''
        },
      })
    } else if (clientStatus !== '') {
      store.set('statusMessage', clientStatus)
    }
  } catch (err) {
    logger.warn('[Availability] Failed to restore availability/status:', err)
  }
}

/**
 * 通用的"写入→验证→重试"流程。
 *
 * 为什么需要？
 *   LCU 启动初期 XMPP 连接尚未稳定，`PUT /lol-chat/v1/me` 有时响应成功但实际并未生效
 *   （返回旧值 / 空值 / 默认值）。只打一次"Restored"日志但不验证，等于盲写——
 *   玩家看到的仍是默认状态，还会以为 Sona 修好了。
 *
 * 策略：
 *   1. 调 write() 写入
 *   2. 等 500ms 让客户端把变化推给 XMPP
 *   3. 重新 read() 拉最新值
 *   4. 和 target 对比：
 *        - 一致 → ✅ 打成功日志，退出
 *        - 不一致 → 重试（最多 3 次）
 *   5. 3 次都失败 → 打警告日志（不抛异常，不影响其它逻辑）
 */
async function persistWithVerify<T>(opts: {
  label: string
  target: T
  write: () => Promise<unknown>
  read: () => Promise<T>
  maxAttempts?: number
  delayMs?: number
}): Promise<boolean> {
  const { label, target, write, read, maxAttempts = 3, delayMs = 500 } = opts

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await write()
    } catch (err) {
      logger.warn('[Availability] %s 写入失败 (attempt %d/%d): %o', label, attempt, maxAttempts, err)
      // 写入本身失败也继续重试——XMPP 刚连上时偶尔会 502
      await sleep(delayMs)
      continue
    }

    // 等客户端把变化同步到 XMPP
    await sleep(delayMs)

    let actual: T
    try {
      actual = await read()
    } catch (err) {
      logger.warn('[Availability] %s 验证读取失败 (attempt %d/%d): %o', label, attempt, maxAttempts, err)
      continue
    }

    if (actual === target) {
      logger.info('[Availability] %s 恢复成功 ✓ → %s (验证通过, attempt %d)', label, String(target), attempt)
      return true
    }

    logger.warn(
      '[Availability] %s 恢复验证失败 (attempt %d/%d): 期望=%s 实际=%s，%dms 后重试',
      label, attempt, maxAttempts, String(target), String(actual), delayMs,
    )
  }

  logger.warn(
    '[Availability] %s 恢复 %d 次均未生效，放弃（目标值=%s）。可能原因：LCU 被其它插件抢写 / 服务器拒绝 / 网络抖动',
    label, maxAttempts, String(target),
  )
  return false
}

/** 判定一个值是否算"有效签名内容"：必须是非空字符串 */
function hasContent(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0
}

/**
 * 订阅 /lol-chat/v1/me 的实时变化，把客户端 availability/statusMessage 同步到 store。
 *
 * 解决的场景：
 *   玩家在**客户端原生签名输入框**里修改签名（由 unlockStatus 解锁）→ 客户端 PUT /lol-chat/v1/me
 *   → 我们之前只在启动时拉一次快照，玩家改完签名后若没重启 Sona，store 永远不会更新。
 *
 * 同步策略：
 *   - 和 restoreAvailabilityAndStatus 一样，仅在 None/Lobby 阶段同步，避免捕获"选人中/游戏中XX"等自动签名
 *   - availability 的写入已经在菜单点击逻辑里做了，这里只负责"客户端自发变化"的单向同步
 */
let chatMeUnsub: (() => void) | null = null

function subscribeChatMeSync() {
  if (chatMeUnsub) return // 已订阅

  chatMeUnsub = lcu.observe(LcuEventUri.CHAT_ME, async (event: LCUEventMessage) => {
    const me = event.data as ChatMe | null
    if (!me) return

    // 仅空闲阶段同步，避免把"选人中XX"之类的自动签名误存进去
    try {
      const phase = await lcu.getGameflowPhase()
      if (phase !== 'None' && phase !== 'Lobby') return
    } catch {
      // 拉不到 phase 保守不同步
      return
    }

    // 同步签名：只有"有效字符串"（非空、非 null、非其他类型）才写 store，
    // 避免客户端偶尔推送 null/undefined/'' 时覆盖掉已有的有效签名
    if (hasContent(me.statusMessage) && store.get('statusMessage') !== me.statusMessage) {
      store.set('statusMessage', me.statusMessage)
      logger.info('[Availability] 签名变化 → 已持久化: %s', me.statusMessage)
    }

    // 同步在线状态（菜单点击那条路已经写过一次 store，这里是兜底：比如玩家在别的插件/
    // 命令行工具里改了 availability，我们也捕获）
    if (me.availability && store.get('availability') !== me.availability) {
      store.set('availability', me.availability)
      currentAvailability = me.availability
      logger.info('[Availability] 在线状态变化 → 已持久化: %s', me.availability)
    }
  })

  logger.info('[Availability] 已订阅 /lol-chat/v1/me 实时同步')
}

function unsubscribeChatMeSync() {
  if (chatMeUnsub) {
    chatMeUnsub()
    chatMeUnsub = null
    logger.info('[Availability] 已取消订阅 /lol-chat/v1/me')
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

        // 写 store 前先看当前阶段：只在空闲阶段（None/Lobby）持久化。
        // 游戏中/选人中/结算中临时切一下不该被当成"下次启动的默认状态"，
        // 否则会造成"玩家游戏中切了一下勿扰 → 下次启动恢复成勿扰 → 又触发缝合怪"的滚雪球。
        lcu.getGameflowPhase()
          .then((phase) => {
            if (phase === 'None' || phase === 'Lobby') {
              store.set('availability', option.value)
              logger.info('[Availability] 持久化: %s (phase=%s)', option.value, phase)
            } else {
              logger.info('[Availability] 仅临时切换（阶段 %s，不持久化）', phase)
            }
          })
          .catch(() => {
            // phase 拉不到时保守起见不写 store
            logger.warn('[Availability] 无法获取 gameflow phase，跳过持久化')
          })

        // PUT availability 请求本身不受阶段限制——用户点了就按用户意图发
        lcu.setAvailability(option.value)
          .then(() => logger.info('[Availability] 已切换: %s', option.value))
          .catch((err) => logger.error('[Availability] 切换失败:', err))
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

/** 是否启用"解锁在线状态切换"功能（由 features.ts 的开关控制） */
let availabilityHijackEnabled = false

/** 设置开关状态（供 features.ts 调用） */
export function setAvailabilityHijackEnabled(enabled: boolean) {
  availabilityHijackEnabled = enabled
  if (enabled) {
    // 启用时：注入状态菜单接管任务。restore 由 registerAllInjections 统一负责，这里不重复。
    injector.register(tryHijackAvailabilityHitbox)
  } else {
    // 禁用时：取消注入任务，并关闭可能已打开的菜单
    injector.unregister(tryHijackAvailabilityHitbox)
    closeAvailabilityMenu()
  }
}

/**
 * 注入任务：接管 .lol-social-availability-hitbox 的点击事件
 * 阻止客户端原有逻辑，替换为自定义的状态选择菜单
 *
 * 注：事件监听只能绑定一次（用 HIJACKED_ATTR 保证幂等），
 *    开关关闭时通过 availabilityHijackEnabled flag 让 listener 放行客户端原逻辑。
 */
function tryHijackAvailabilityHitbox(): boolean {
  const hitbox = document.querySelector(`.lol-social-availability-hitbox:not([${HIJACKED_ATTR}])`) as HTMLElement | null
  if (!hitbox) return true

  hitbox.setAttribute(HIJACKED_ATTR, 'true')

  hitbox.addEventListener('click', (e) => {
    // 开关未开时：放行，走客户端默认行为
    if (!availabilityHijackEnabled) return

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
  // tryHijackAvailabilityHitbox 由 features.ts 的 unlockAvailability 开关按需注册

  // 状态同步启动顺序（重要！）：
  //   ① 先主动拉一次 ChatMe 快照做 restore：对齐 store 和客户端状态
  //   ② 再订阅 /lol-chat/v1/me 实时事件：处理后续所有变化
  //
  // 为什么不能颠倒？
  //   LCU 启动初期（XMPP 未完全连接）会推几条 presence 初始事件，字段可能是 null 或空。
  //   如果先订阅，那些初始事件会走我们的 listener——虽然 hasContent 已经挡住空值，
  //   但先 restore 再订阅的语义更干净："先对齐 → 再监听后续变化"。
  restoreAvailabilityAndStatus().finally(() => {
    // 无论 restore 成功或失败，都要挂监听——否则玩家之后改签名就没法捕获
    subscribeChatMeSync()
  })

  injector.start()
}

/** 供测试/清理用（实际不会调用，因为插件生命周期是进程级） */
export function unregisterAllInjections() {
  unsubscribeChatMeSync()
}
