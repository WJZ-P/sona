/**
 * 本体样式注入
 *
 * 本体以 IIFE 形式由壳执行（可能来自热更新），不能再依赖 Pengu 处理 `import "./index.css"`。
 * 构建时 vite.config.ts 会把打包后的 CSS 文本替换进 __SONA_CORE_CSS__；dev 模式下它是 null，
 * 样式由 Vite 自己注入。
 */
declare const __SONA_CORE_CSS__: string | null

const STYLE_ELEMENT_ID = 'sona-core-style'

export function injectCoreStyle() {
  const css = __SONA_CORE_CSS__
  if (!css || document.getElementById(STYLE_ELEMENT_ID)) return

  const append = () => {
    if (document.getElementById(STYLE_ELEMENT_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ELEMENT_ID
    style.textContent = css
    ;(document.head ?? document.documentElement).appendChild(style)
  }

  if (document.head) {
    append()
  } else {
    document.addEventListener('DOMContentLoaded', append, { once: true })
  }
}
