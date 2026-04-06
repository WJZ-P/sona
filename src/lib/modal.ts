/**
 * 模态窗口状态管理
 * 纯状态逻辑，零 DOM 操作，可被任何模块安全 import。
 */

import { store } from '@/lib/store'

type VisibilityListener = (visible: boolean) => void
const listeners: Set<VisibilityListener> = new Set()

let modalVisible = false

export function isModalVisible() {
  return modalVisible
}

export function openModal() {
  modalVisible = true
  listeners.forEach((fn) => fn(modalVisible))
}

export function closeModal() {
  modalVisible = false
  listeners.forEach((fn) => fn(modalVisible))
}

export function toggleModal() {
  if (modalVisible) closeModal()
  else openModal()
}

/**
 * 监听模态窗口可见性变化
 * @returns 取消监听的函数
 */
export function onModalVisibilityChange(fn: VisibilityListener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// ==================== 快捷键 ====================

let currentHotkey = ''

function onKeyDown(e: KeyboardEvent) {
  if (e.key === currentHotkey) {
    e.preventDefault()
    e.stopPropagation()
    toggleModal()
  }
}

/**
 * 注册全局快捷键，并监听 store 变化自动换绑
 */
export function registerHotkey() {
  currentHotkey = store.get('hotkey')
  document.addEventListener('keydown', onKeyDown, true)

  store.onChange('hotkey', (newKey) => {
    currentHotkey = newKey
  })
}
