/** 延迟指定毫秒 */
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * 给 Promise 套一层超时保护
 *
 * 注意：超时只是让调用方能继续往下走，底层请求（如 fetch）不会被真正取消——
 * 这是刻意的取舍，避免为了取消而改动所有 LCU 调用点。
 *
 * @param promise 原始 Promise
 * @param ms      超时毫秒数
 * @param label   超时报错里带上的标识，方便定位卡在哪一步
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[Timeout] ${label} 超过 ${ms}ms 未返回`))
    }, ms)

    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (error) => { clearTimeout(timer); reject(error) },
    )
  })
}
