/**
 * 炫彩分页解锁（国服）
 *
 * 问题：国服 LoL 客户端在生涯藏品页隐藏了"炫彩"子分页——不是 CSS 隐藏，
 *       而是在 rcp-fe-lol-collections 的 collections-sub-nav 组件模板里
 *       用 {{#unless isChromasDisabled}} 判断条件，直接不渲染那个 <a href="/chromas">。
 *
 * 方案：通过 Ember hook 劫持 Component.extend，匹配组件 classNames =
 *       'collections-sub-nav-component'，用 mixin 把这两个属性覆盖成 false：
 *         - isChromasDisabled  控制炫彩 tab 是否禁用渲染（国服默认 true）
 *         - isTencentRegion    标识腾讯区，通常是 isChromasDisabled 的上游计算依赖
 *
 * 为什么是 false 而不是 true：
 *       Disabled=true 表示被禁用，所以要显示就得改成 false。
 *
 * 注意：Ember hook 只在 init 阶段注册一次，且组件类创建也是一次性的——
 *       因此开关状态在**插件加载时**被读取，运行时切换开关**不会**立即生效，
 *       需要重启客户端。UI 里的 description 已注明。
 */

import { registerEmberRule } from '@/lib/ember-hook'
import { store } from '@/lib/store'
import { logger } from '@/index'

export function registerChromaRules() {
  // 开关关闭就不注册规则，彻底不劫持
  if (!store.get('unlockChromas')) {
    logger.info('[ChromaUnlock] 开关已关闭，跳过注册')
    return
  }

  registerEmberRule({
    name: 'unlock-chromas',
    matcher: 'collections-sub-nav-component',
    mixin: () => ({
      // 覆盖为普通属性（会遮蔽同名的 computed getter）
      isChromasDisabled: false,
      isTencentRegion: false,
    }),
  })
}
