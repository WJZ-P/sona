/**
 * Ember Hook —— 基于 Pengu Loader 官方 RCP API 实现
 *
 * 原理：
 *   1. 客户端所有 Ember 组件都通过 `rcp-fe-ember-libs` 模块的 getEmber() 获取 Ember 实例
 *   2. Pengu Loader 提供 context.rcp.postInit(name, cb) 让插件在该模块初始化后拿到其 api
 *   3. 劫持 api.getEmber：等客户端调用时，在返回的 Ember 上再劫持 Component.extend
 *   4. 每当客户端 Ember.Component.extend({ classNames: ['xxx'], ... }) 创建组件类时，
 *      我们检查 classNames 是否匹配已注册的规则，匹配则：
 *        - 用 Mixin 覆盖成员（包括属性、computed getter、方法）
 *        - 或 wrap 指定方法
 *
 * window.Ember 那些被完全封死了，搞不到Ember对象。还是走RCP优雅。
 */

import { logger } from '@/index'

/** Ember.Component 的简单建模（runtime 里实际是 Ember 对象，这里只标注我们用到的部分） */
type EmberComponentClass = {
  extend: (...mixins: unknown[]) => EmberComponentClass
  proto: () => Record<string, unknown>
}

type EmberNamespace = {
  Component: EmberComponentClass
  [key: string]: unknown
}

/** 方法劫持器：调用原函数的包装，你可以改参数/改返回值 */
export type MethodWrap = {
  /** 实例方法名（存在于 Component prototype 上） */
  name: string
  /**
   * 替换体。第一个参数是调用原方法的函数，第二个是原参数数组。
   * 你想调原函数就 `original(...args)` 或自己传改过的 args。
   */
  replacement: (this: unknown, original: (...args: unknown[]) => unknown, args: unknown[]) => unknown
}

/** Mixin 工厂：返回会被 Component.extend(...) 合并进去的对象 */
export type MixinFactory = (Ember: EmberNamespace, extendArgs: unknown[]) => Record<string, unknown>

/** 规则定义 */
export type EmberRule = {
  /** 用于日志/去重的名字 */
  name: string
  /** 要匹配的组件 classNames[0]（例如 'collections-sub-nav-component'） */
  matcher: string
  /** 可选：覆盖/追加成员的 Mixin 工厂 */
  mixin?: MixinFactory
  /** 可选：劫持 prototype 上的方法 */
  wraps?: MethodWrap[]
}

// ========== 内部状态 ==========

const rules: EmberRule[] = []
let installed = false

/** 防止同一个函数被重复包裹 */
const WRAPPED_MARK = Symbol('SonaEmberWrapped')

/** 防止同一个组件 prototype 被同一规则重复处理 */
const APPLIED_RULES_KEY = '__sonaAppliedRules'

// ========== 核心工具 ==========

/**
 * 包裹一个对象上的方法：让 `replacement` 接到 `(original, args)`，
 * 既能调 original，也能改参数改返回值。幂等（用 Symbol 标记）。
 */
function wrapMethod(
  target: Record<string | symbol, unknown>,
  name: string,
  replacement: MethodWrap['replacement'],
): boolean {
  const fn = target[name]
  if (typeof fn !== 'function') return false

  // 若同一个 name 已被我们包过就跳过（target 维度的标记）
  const wrappedSet = (target[WRAPPED_MARK] as Set<string> | undefined) ?? new Set<string>()
  if (wrappedSet.has(name)) return false

  const original = fn as (...args: unknown[]) => unknown
  target[name] = function (this: unknown, ...args: unknown[]) {
    const caller = (...callArgs: unknown[]) => original.apply(this, callArgs)
    return replacement.call(this, caller, args)
  }

  wrappedSet.add(name)
  target[WRAPPED_MARK] = wrappedSet
  return true
}

/**
 * 从 Ember.Component.extend(...args) 的 args 里抽出 classNames。
 * 客户端典型写法：Component.extend(MixinA, MixinB, { classNames: ['foo-bar'], ... })
 */
function extractClassNames(args: unknown[]): string[] {
  const collected: string[] = []
  for (const a of args) {
    if (a && typeof a === 'object') {
      const cn = (a as { classNames?: unknown }).classNames
      if (Array.isArray(cn)) {
        for (const c of cn) {
          if (typeof c === 'string') collected.push(c)
        }
      }
    }
  }
  return collected
}

/**
 * 对一个 extend 的结果 klass 应用单条规则。
 * 注意：Ember 的 `.extend(mixin)` 返回新的子类，所以要链式更新 klass。
 */
function applyRuleToClass(
  Ember: EmberNamespace,
  klass: EmberComponentClass,
  extendArgs: unknown[],
  rule: EmberRule,
): EmberComponentClass {
  let cur = klass

  // 1. Mixin 覆盖
  if (rule.mixin) {
    try {
      const mixinObj = rule.mixin(Ember, extendArgs)
      cur = cur.extend(mixinObj)
      logger.info('[EmberHook] mixin applied: %s', rule.name)
    } catch (e) {
      logger.warn('[EmberHook] mixin failed: %s, %o', rule.name, e)
    }
  }

  // 2. wraps 劫持方法
  if (rule.wraps?.length) {
    try {
      const proto = cur.proto() as Record<string | symbol, unknown>

      // proto 维度防重：同一 proto + 同一 rule 只处理一次
      const applied = (proto[APPLIED_RULES_KEY] as Set<string> | undefined) ?? new Set<string>()
      if (!applied.has(rule.name)) {
        for (const w of rule.wraps) {
          if (wrapMethod(proto, w.name, w.replacement)) {
            logger.info('[EmberHook] wrap applied: %s.%s', rule.name, w.name)
          }
        }
        applied.add(rule.name)
        proto[APPLIED_RULES_KEY] = applied
      }
    } catch (e) {
      logger.warn('[EmberHook] wraps failed: %s, %o', rule.name, e)
    }
  }

  return cur
}

/** 劫持 Ember.Component.extend，每次创建组件类时匹配规则 */
function hookComponentExtend(Ember: EmberNamespace) {
  const Component = Ember.Component
  if (!Component || typeof Component.extend !== 'function') {
    logger.warn('[EmberHook] Ember.Component.extend 不存在，放弃')
    return
  }

  const target = Component as unknown as Record<string | symbol, unknown>
  if (target[WRAPPED_MARK]) {
    //logger.info('[EmberHook] Component.extend 已被包裹过，跳过')
    return
  }

  const originalExtend = Component.extend.bind(Component)
  Component.extend = function (this: unknown, ...args: unknown[]): EmberComponentClass {
    // 先调原始 extend 得到基础 klass
    let klass = originalExtend(...args) as EmberComponentClass

    // 匹配规则
    const classNames = extractClassNames(args)
    if (classNames.length > 0 && rules.length > 0) {
      for (const rule of rules) {
        if (classNames.includes(rule.matcher)) {
          klass = applyRuleToClass(Ember, klass, args, rule)
        }
      }
    }

    return klass
  } as EmberComponentClass['extend']

  target[WRAPPED_MARK] = true
  logger.info('[EmberHook] ✅ Ember.Component.extend 已被劫持（当前规则数: %d）', rules.length)
}

// ========== 公开 API ==========

/**
 * 在 init(context) 阶段调用。必须早于客户端脚本初始化，
 * 所以只能在 Sona 的 init() 里执行，不能在 load() 里。
 */
export function installEmberHook(context: PenguContext) {
  if (installed) {
    logger.warn('[EmberHook] installEmberHook 已经被调用过，忽略')
    return
  }
  installed = true

  logger.info('[EmberHook] 注册 rcp-fe-ember-libs postInit...')

  // blocking=true 很关键！
  //   - false（默认）：只捕获"未来的初始化事件"，Pengu HMR/reload 后注册会错过时机
  //   - true：若 rcp-fe-ember-libs 已初始化，用缓存 api 立即补跑一次；
  //           并且目标模块会等回调完成才继续，确保劫持窗口不会被跳过
  context.rcp.postInit('rcp-fe-ember-libs', (api: unknown) => {
    const emberLibs = api as { getEmber?: (...a: unknown[]) => Promise<EmberNamespace> }
    if (!emberLibs || typeof emberLibs.getEmber !== 'function') {
      logger.warn('[EmberHook] rcp-fe-ember-libs 里没有 getEmber，放弃')
      return
    }

    // 劫持 getEmber：客户端调用它拿 Ember 时，我们在中间插入 extend 劫持
    const target = emberLibs as unknown as Record<string | symbol, unknown>
    if (target[WRAPPED_MARK]) {
      logger.info('[EmberHook] getEmber 已被劫持过，跳过')
      return
    }

    const originalGetEmber = emberLibs.getEmber.bind(emberLibs)
    emberLibs.getEmber = function (this: unknown, ...args: unknown[]): Promise<EmberNamespace> {
      const p = originalGetEmber(...args)
      return Promise.resolve(p).then((Ember: EmberNamespace) => {
        try {
          hookComponentExtend(Ember)
        } catch (e) {
          logger.warn('[EmberHook] hookComponentExtend 异常: %o', e)
        }
        return Ember
      })
    }
    target[WRAPPED_MARK] = true

    logger.info('[EmberHook] 🎯 已劫持 rcp-fe-ember-libs.getEmber，等客户端首次调用...')
  }, true)
}

/**
 * 注册一条 Ember 组件规则。
 * 可以在任意时机调用：
 *   - 如果此时 extend 还没跑过，后续触发时自动匹配
 *   - 如果此时 extend 已经跑过（组件已经创建），该条规则对"已存在的类"不生效，
 *     但对"将来再创建的同类组件"依然生效（Ember 会在路由切换时重建组件）
 */
export function registerEmberRule(rule: EmberRule) {
  // 简单去重
  const i = rules.findIndex((r) => r.name === rule.name)
  if (i >= 0) {
    rules[i] = rule
    logger.info('[EmberHook] 更新规则: %s', rule.name)
  } else {
    rules.push(rule)
    logger.info('[EmberHook] 新增规则: %s (matcher=%s)，当前共 %d 条', rule.name, rule.matcher, rules.length)
  }
}

/** 调试用：当前已注册的规则数 */
export function getEmberRulesCount() {
  return rules.length
}
