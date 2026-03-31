/**
 * 插件公用日志工具
 * 支持 banner 打印、多日志级别、console 格式化占位符（%s, %d, %o 等）
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LoggerOptions {
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 名称区域背景色 */
  primaryColor?: string
  /** 版本区域背景色 */
  accentColor?: string
}

const LEVEL_CONFIG: Record<LogLevel, { badge: string; color: string; method: keyof Console }> = {
  info:  { badge: 'INFO',  color: '#43b581', method: 'log'   },
  warn:  { badge: 'WARN',  color: '#faa61a', method: 'warn'  },
  error: { badge: 'ERROR', color: '#f04747', method: 'error' },
  debug: { badge: 'DEBUG', color: '#7289da', method: 'debug' },
}

export function createLogger(options: LoggerOptions) {
  const {
    name,
    version,
    primaryColor = '#5865F2',
    accentColor = '#43b581',
  } = options

  const prefix = `[${name}]`

  /** 打印带样式的 banner */
  function printBanner() {
    const nameStyle = [
      'color: #fff',
      `background: ${primaryColor}`,
      'padding: 4px 8px',
      'border-radius: 4px 0 0 4px',
      'font-weight: bold',
      'font-size: 14px',
    ].join(';')

    const versionStyle = [
      'color: #fff',
      `background: ${accentColor}`,
      'padding: 4px 8px',
      'border-radius: 0 4px 4px 0',
      'font-weight: bold',
      'font-size: 14px',
    ].join(';')

    console.log(
      `%c ${name} ଘ(੭ˊᵕˋ)੭* ੈ✩‧₊˚♫ %c v${version} `,
      nameStyle,
      versionStyle,
    )
  }

  /**
   * 带级别标签的日志输出
   * 支持 console 原生格式化占位符：%s, %d, %i, %f, %o, %O, %c
   *
   * @example
   *   logger.info('loaded in %dms', 42)
   *   logger.warn('missing key: %s', key)
   *   logger.error('request failed %o', err)
   */
  function log(level: LogLevel, message: string, ...args: unknown[]) {
    const { badge, color, method } = LEVEL_CONFIG[level]

    const badgeStyle = [
      'color: #fff',
      `background: ${color}`,
      'padding: 2px 6px',
      'border-radius: 3px',
      'font-weight: bold',
      'font-size: 11px',
    ].join(';')

    const resetStyle = 'color: inherit; background: inherit;'

    // %c badge %c 之后拼接用户的 message（保留占位符让浏览器处理）
    ;(console[method] as (...a: unknown[]) => void)(
      `%c${badge}%c ${prefix} ${message}`,
      badgeStyle,
      resetStyle,
      ...args,
    )
  }

  return {
    printBanner,
    info:  (msg: string, ...args: unknown[]) => log('info',  msg, ...args),
    warn:  (msg: string, ...args: unknown[]) => log('warn',  msg, ...args),
    error: (msg: string, ...args: unknown[]) => log('error', msg, ...args),
    debug: (msg: string, ...args: unknown[]) => log('debug', msg, ...args),
  }
}
