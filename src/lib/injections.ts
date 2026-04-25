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
    logger.info('[Availability] 开始恢复持久化状态...')

    // 这里如果是游戏中或者其他在玩的状态，就直接放行，不改，不然怕关麦克风的bug。
    const phase = await lcu.getGameflowPhase()
    if (phase !== 'None' && phase !== 'Lobby') {
      logger.info('[Availability] 当前阶段 %s，跳过状态恢复（避免与底层状态机冲突）', phase)
      return
    }

    const me = await lcu.getChatMe()
    const savedAvailability = store.get('availability') as Availability
    const savedStatus = store.get('statusMessage')

    logger.info(
      '[Availability] 当前状态快照: client.availability=%s, client.statusMessage=%s | saved.availability=%s, saved.statusMessage=%s',
      me.availability, JSON.stringify(me.statusMessage),
      savedAvailability, JSON.stringify(savedStatus),
    )

    // 2. 恢复在线状态（不恢复 away，它是客户端自动设置的，不应作为启动默认值）
    if (savedAvailability && savedAvailability !== 'away' && savedAvailability !== me.availability) {
      try {
        await lcu.setAvailability(savedAvailability)
        logger.info('[Availability] 已写入 availability: %s', savedAvailability)
      } catch (err) {
        logger.warn('[Availability] availability 写入失败（稍后会再校验一次）:', err)
      }
      currentAvailability = savedAvailability
    } else {
      logger.info('[Availability] availability 无需恢复（已与 store 一致 / 未配置）')
      currentAvailability = me.availability
    }

    // 3. 签名处理（同一策略：一次性写入，不校验）
    //    - 客户端无签名（null / 非字符串 / 空字符串） + store 有有效签名 → 写入
    //    - 客户端有有效签名 → 同步到 store
    //    - 非字符串 / 空字符串 一律不写入 store，避免空值污染
    const clientStatus = hasContent(me.statusMessage) ? (me.statusMessage as string) : ''
    if (clientStatus === '' && hasContent(savedStatus)) {
      try {
        await lcu.setStatusMessage(savedStatus)
        logger.info('[Availability] 已写入 statusMessage: %s', savedStatus)
      } catch (err) {
        logger.warn('[Availability] statusMessage 写入失败（稍后会再校验一次）:', err)
      }
    } else if (clientStatus !== '') {
      if (clientStatus !== savedStatus) {
        store.set('statusMessage', clientStatus)
        logger.info('[Availability] 客户端签名与 store 不一致，已回写到 store: %s', clientStatus)
      } else {
        logger.info('[Availability] statusMessage 无需恢复（客户端与 store 一致）')
      }
    } else {
      logger.info('[Availability] 客户端无签名且 store 也无签名，跳过')
    }
  } catch (err) {
    logger.warn('[Availability] Failed to restore availability/status:', err)
  }
}

/**
 * 订阅 WS 后的**延迟校验**。
 *
 * 背景：
 *   完整重启客户端时，存在一个时间窗口：
 *     T0: Sona restore 写入签名 → 客户端 PUT 返回成功
 *     T1: 我们的 WS 监听挂上
 *     T2: 客户端自己晚到的 XMPP 初始化完成，给 chat/me 推了"干净的初始状态"→ 签名被清空
 *   T2 这条推送理论上 WS 能抓到，但客户端可能用本地"同步"而非事件路径，导致我们 listener
 *   根本没被触发——表现就是"写入成功日志打了，但客户端显示还是空"。
 *
 * 解决：
 *   挂上 WS 后等一段时间（让客户端完成所有启动态同步），再重新拉 /lol-chat/v1/me 核对一次：
 *     - 如果和 store 还不一致 → 再写一次（此时客户端已经稳定，写入一定生效）
 *     - 如果一致 → restore 是真成功了，什么都不做
 */
async function verifyAfterSubscribe() {
  // 给客户端足够时间完成启动期所有 presence 同步，实测两秒左右比较合适
  await sleep(2000)

  try {
    const phase = await lcu.getGameflowPhase()
    if (phase !== 'None' && phase !== 'Lobby') {
      logger.info('[Availability] 延迟校验时阶段为 %s，跳过', phase)
      return
    }

    const me = await lcu.getChatMe()
    const savedAvailability = store.get('availability') as Availability
    const savedStatus = store.get('statusMessage')

    const clientStatus = hasContent(me.statusMessage) ? (me.statusMessage as string) : ''

    logger.info(
      '[Availability] 延迟校验快照: client.availability=%s, client.statusMessage=%s | saved.availability=%s, saved.statusMessage=%s',
      me.availability, JSON.stringify(me.statusMessage),
      savedAvailability, JSON.stringify(savedStatus),
    )

    // 校验 availability
    if (savedAvailability && savedAvailability !== me.availability) {
      logger.warn('[Availability] 延迟校验发现 availability 被客户端回退，再次写入: %s', savedAvailability)
      await lcu.setAvailability(savedAvailability).catch((err) => {
        logger.warn('[Availability] 延迟校验写 availability 失败:', err)
      })
    }

    // 校验 statusMessage
    if (hasContent(savedStatus) && clientStatus !== savedStatus) {
      logger.warn('[Availability] 延迟校验发现 statusMessage 被客户端回退（"%s" → "%s"），再次写入', savedStatus, clientStatus)
      await lcu.setStatusMessage(savedStatus).catch((err) => {
        logger.warn('[Availability] 延迟校验写 statusMessage 失败:', err)
      })
    }
  } catch (err) {
    logger.warn('[Availability] 延迟校验失败:', err)
  }
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
    // 注意：不持久化 away 状态，因为它是客户端自动设置的（玩家一段时间不操作），
    // 不应作为下次启动的默认状态
    if (me.availability && me.availability !== 'away' && store.get('availability') !== me.availability) {
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
        // 同样不持久化 away 状态，它是客户端自动设置的（玩家一段时间不操作），
        // 不应作为下次启动的默认状态。
        lcu.getGameflowPhase()
          .then((phase) => {
            if ((phase === 'None' || phase === 'Lobby') && option.value !== 'away') {
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
  const hitbox = document.querySelector(`.social-identity-block .lol-social-availability-hitbox:not([${HIJACKED_ATTR}])`) as HTMLElement | null
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

// ==================== 隐藏云顶之弈入口 ====================

/** 是否启用"隐藏云顶之弈入口"功能 */
let hideTFTEnabled = false

/** 设置开关状态（供 features.ts 调用） */
export function setHideTFTEnabled(enabled: boolean) {
  hideTFTEnabled = enabled
  if (enabled) {
    injector.register(tryRemoveTFT)
  } else {
    injector.unregister(tryRemoveTFT)
    // 恢复被隐藏的元素：移除 data-sona-hidden 标记，让元素重新显示
    document.querySelectorAll(`[${HIJACKED_ATTR}-tft]`).forEach((el) => {
      (el as HTMLElement).style.display = ''
      el.removeAttribute(`${HIJACKED_ATTR}-tft`)
    })
  }
}

const TFT_HIDDEN_ATTR = `${HIJACKED_ATTR}-tft`

/**
 * 注入任务：隐藏云顶之弈入口
 * 隐藏顶部导航栏 TFT 菜单项
 */
function tryRemoveTFT(): boolean {
  if (!hideTFTEnabled) return true

  // 顶部导航栏 TFT 菜单项
  const navItem = document.querySelector(`.menu_item_navbar_tft:not([${TFT_HIDDEN_ATTR}])`)
  if (navItem) {
    navItem.setAttribute(TFT_HIDDEN_ATTR, 'true')
    ;(navItem as HTMLElement).style.display = 'none'
  }

  // 主界面 TFT 游戏模式卡片
  // const gameCard = document.querySelector(`[data-game-mode="TFT"].game-type-card:not([${TFT_HIDDEN_ATTR}])`)
  // if (gameCard) {
  //   gameCard.setAttribute(TFT_HIDDEN_ATTR, 'true')
  //   ;(gameCard as HTMLElement).style.display = 'none'
  // }

  return true
}

// ==================== 隐藏右侧导航栏文字 ====================

/** 是否启用"隐藏右侧导航栏文字"功能 */
let hideRightNavTextEnabled = false

const NAV_TEXT_HIDDEN_ATTR = `${HIJACKED_ATTR}-nav-text`

/** 设置开关状态（供 features.ts 调用） */
export function setHideRightNavTextEnabled(enabled: boolean) {
  hideRightNavTextEnabled = enabled
  if (enabled) {
    injector.register(tryHideRightNavText)
  } else {
    injector.unregister(tryHideRightNavText)
    // 恢复被隐藏的文字
    const nav = document.querySelector('.right-nav-menu')
    if (nav) {
      nav.removeAttribute(NAV_TEXT_HIDDEN_ATTR)
      nav.querySelectorAll('lol-uikit-navigation-item').forEach((item) => {
        const text = (item as HTMLElement).querySelector('.menu-item-small-text') as HTMLElement | null
        if (text) text.style.display = ''
      })
    }
  }
}

/**
 * 注入任务：隐藏主页右侧导航栏文字
 * 查找 right-nav-menu 内所有 lol-uikit-navigation-item，访问 shadowRoot 隐藏 menu-item-small-text
 */
function tryHideRightNavText(): boolean {
  if (!hideRightNavTextEnabled) return true

  const nav = document.querySelector('.right-nav-menu')
  if (!nav || nav.hasAttribute(NAV_TEXT_HIDDEN_ATTR)) return true

  const navItems = nav.querySelectorAll('lol-uikit-navigation-item')
  let hiddenCount = 0
  navItems.forEach((item) => {
    const el = item as HTMLElement
    const text = el.querySelector('.menu-item-small-text') as HTMLElement | null
    if (text) {
      text.style.display = 'none'
      hiddenCount++
      logger.info(`[HideRightNavText] Hide right nav text: ${el.textContent}`)
    }
  })
  // 只有所有 item 都成功隐藏了 text 才打 tag，否则下帧继续尝试
  if (hiddenCount > 0) {
    nav.setAttribute(NAV_TEXT_HIDDEN_ATTR, 'true')
  }
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
  //   ① 先主动拉一次 ChatMe 快照做 restore：对齐 store 和客户端状态（只写不校验）
  //   ② 再订阅 /lol-chat/v1/me 实时事件：处理后续所有变化
  //   ③ 订阅后延迟 3s 做一次校验：兜住"restore 写入成功但客户端之后又把签名清掉"的时间窗口
  //
  // 为什么把校验放到 subscribe 之后？
  //   完整重启客户端时，客户端自己的 XMPP 初始化比 Sona 晚，它可能在 T2 时把 /lol-chat/v1/me
  //   推成"干净的初始状态"（签名被清空）。这条推送理论上我们 WS 能抓，但客户端有时会走
  //   "本地同步"而非事件路径，导致 listener 根本没触发。所以最稳的办法是：订阅后主动再核一次。
  restoreAvailabilityAndStatus().finally(() => {
    // 无论 restore 成功或失败，都要挂监听——否则玩家之后改签名就没法捕获
    subscribeChatMeSync()
    // 挂监听后再做一次延迟校验（fire-and-forget，不阻塞 injector.start）
    verifyAfterSubscribe()
  })

  injector.start()
}

/** 供测试/清理用（实际不会调用，因为插件生命周期是进程级） */
export function unregisterAllInjections() {
  unsubscribeChatMeSync()
}
