/**
 * InjectorManager - 集中式注入管理器
 *
 * 设计理念：一个全局 MutationObserver 守护所有注入任务。
 *
 * - 永不掉线：不调用 disconnect()，任何注入点被客户端刷掉后，
 *   下一次 DOM 变动时自动补回。
 * - 绝对流畅：整个插件只有一个 Observer，配合 requestAnimationFrame
 *   节流，一帧最多检查一次，不会因 Ember.js 的大量 DOM 变动而卡顿。
 * - 易于扩展：未来新增注入点只需 injector.register(task) 即可。
 */

import { logger } from '@/index'

/** 注入任务：返回 true 表示注入成功/已存在，false 表示还没找到位置 */
type InjectTask = () => boolean

class InjectorManager {
  private tasks: Set<InjectTask> = new Set()
  private observer: MutationObserver | null = null
  private isThrottled = false

  /**
   * 注册一个新的注入任务
   * 注册后立即尝试执行一次
   */
  register(task: InjectTask) {
    this.tasks.add(task)
    try {
      task()
    } catch (e) {
      logger.error('[Injector] Task failed on register:', e)
    }
  }

  /**
   * 取消注册一个注入任务
   */
  unregister(task: InjectTask) {
    this.tasks.delete(task)
  }

  /**
   * 启动全局 DOM 守护者
   * 只会启动一次，重复调用无效
   */
  start() {
    if (this.observer) return

    logger.info('[Injector] Starting global DOM observer...')

    this.observer = new MutationObserver(() => {
      if (this.isThrottled) return
      this.isThrottled = true

      requestAnimationFrame(() => {
        for (const task of this.tasks) {
          try {
            task()
          } catch (e) {
            logger.error('[Injector] Task failed:', e)
          }
        }
        this.isThrottled = false
      })
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  /**
   * 停止全局守护（一般不需要调用）
   */
  stop() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
      logger.info('[Injector] Global DOM observer stopped')
    }
  }
}

/** 全局注入管理器单例 */
export const injector = new InjectorManager()
