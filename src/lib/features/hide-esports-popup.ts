/**
 * 关闭右下角赛事直播弹窗
 *
 * 客户端右下角会弹出官方赛事直播浮窗，本体是一个 iframe#tv-official-pop。
 * 借助全局 InjectorManager 持续守护，一旦检测到该 iframe 就直接移除，
 * 客户端反复弹出也会被持续清掉。
 */

import { logger } from '@/index'
import { injector } from '@/lib/InjectorManager'

const POPUP_SELECTOR = 'iframe#tv-official-pop'

function tryRemoveEsportsPopup(): boolean {
  const popup = document.querySelector(POPUP_SELECTOR)
  if (popup) {
    popup.remove()
    logger.info('[HideEsportsPopup] Đã xóa cửa sổ giải đấu ở góc dưới bên phải')
  }
  return true
}

let registered = false

export function updateHideEsportsPopup(enabled: boolean) {
  if (enabled && !registered) {
    registered = true
    injector.register(tryRemoveEsportsPopup)
    logger.info('Hide esports popup enabled ✓')
  } else if (!enabled && registered) {
    registered = false
    injector.unregister(tryRemoveEsportsPopup)
    logger.info('Hide esports popup disabled')
  }
}
