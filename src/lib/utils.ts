/** 延迟指定毫秒 */
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
