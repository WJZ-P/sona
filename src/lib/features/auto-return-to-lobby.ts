import { logger } from '@/index'
import { store } from '@/lib/store'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'
import { sleep } from '@/lib/utils'

// ==================== 对局结束自动返回房间 ====================

let autoReturnUnsub: (() => void) | null = null

export function updateAutoReturnToLobby(enabled: boolean) {
  if (enabled && !autoReturnUnsub) {
    autoReturnUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, async (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase

      if (phase === 'EndOfGame') {
        const mode = store.get('autoReturnMode')
        logger.info('[AutoReturn] Phát hiện trận đấu kết thúc, chuẩn bị tự động quay về...')

        // 延迟等待：刚进入结算时，服务器可能还在结算荣誉，给点缓冲时间
        await sleep(2000);

        try {
          // 统一使用 playAgain 重建房间
          await lcu.playAgain()
          logger.info('[AutoReturn] Đã tạo lại phòng qua play-again (giữ nguyên đội hình ban đầu) ✓')

          // 自动排队模式：额外调用 startMatchmaking（带重试，队友可能还没准备好）
          if (mode === 'queue') {
            logger.info('[AutoReturn] Đang ở chế độ tự động tìm trận, chuẩn bị bắt đầu tìm trận...')
            const MAX_RETRIES = 15
            for (let i = 1; i <= MAX_RETRIES; i++) {
              await sleep(1000)
              try {
                await lcu.startMatchmaking()
                logger.info('[AutoReturn] Đang tự động tìm trận... ✓ (lần thử thứ %d)', i)
                break
              } catch (err) {
                if (i < MAX_RETRIES) {
                  logger.info('[AutoReturn] Bắt đầu tìm trận thất bại (đồng đội có thể chưa sẵn sàng), thử lại sau 1 giây... (%d/%d)', i, MAX_RETRIES)
                } else {
                  logger.error('[AutoReturn] Bắt đầu tìm trận thất bại, đã đạt số lần thử lại tối đa %d:', MAX_RETRIES, err)
                }
              }
            }
          }
        } catch (err) {
          logger.error('[AutoReturn] Lỗi trong quá trình tự động quay về:', err)
        }
      }
    })
    logger.info('Auto return to lobby enabled ✓')
  } else if (!enabled && autoReturnUnsub) {
    autoReturnUnsub()
    autoReturnUnsub = null
    logger.info('Auto return to lobby disabled')
  }
}
