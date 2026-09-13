import { logger } from '@/index'
import { lcu, LcuEventUri } from '@/lib/lcu'
import type { LCUEventMessage, GameflowPhase } from '@/lib/lcu'

// ==================== 调试：Gameflow 阶段日志 ====================

let debugGameflowUnsub: (() => void) | null = null

const PHASE_LABELS: Partial<Record<GameflowPhase, string>> = {
  ReadyCheck: 'Xác nhận trận đấu',
  ChampSelect: 'Chọn tướng',
  GameStart: 'Khởi động trò chơi',
  InProgress: 'Trận đấu đang diễn ra',
  Reconnect: 'Kết nối lại',
  WaitingForStats: 'Chờ kết quả',
  PreEndOfGame: 'Chuẩn bị kết quả',
  EndOfGame: 'Trận đấu kết thúc',
}

export function updateDebugGameflow(enabled: boolean) {
  if (enabled && !debugGameflowUnsub) {
    debugGameflowUnsub = lcu.observe(LcuEventUri.GAMEFLOW_PHASE_CHANGE, (event: LCUEventMessage) => {
      const phase = event.data as GameflowPhase
      const label = PHASE_LABELS[phase]

      logger.info('Gameflow phase → %s%s', phase, label ? ` (${label})` : '')

      if (!label) return

      lcu.getGameflowSession()
        .then((session) => {
          logger.info('=== %s ===', label)
          logger.info('Chế độ chơi: %s | Hàng chờ: %s (ID: %d)', session.gameData.queue.gameMode, session.gameData.queue.name, session.gameData.queue.id)
          logger.info('ID trận: %d | Tùy chỉnh: %s', session.gameData.gameId, session.gameData.isCustomGame)
          logger.info('Bản đồ: %s (ID: %d)', session.map.name, session.map.id)
          logger.info('Đội ta:', session.gameData.teamOne)
          logger.info('Đội địch:', session.gameData.teamTwo)
          if (phase === 'InProgress') {
            logger.info('Client trò chơi: running=%s, server=%s:%d', session.gameClient.running, session.gameClient.serverIp, session.gameClient.serverPort)
          }
          logger.info('Toàn bộ session: %o', session)

          // 英雄选择阶段：拉取 champ select session 打印队友信息
          if (phase === 'ChampSelect') {
            lcu.getChampSelectSession()
              .then((champSelect) => {
                logger.info('--- Chi tiết chọn tướng ---')
                logger.info('cellId người chơi hiện tại: %d', champSelect.localPlayerCellId)
                champSelect.myTeam.forEach((p, i) => {
                  logger.info('Đội ta #%d → summonerId: %d, championId: %d, cellId: %d, position: %s', i + 1, p.summonerId, p.championId, p.cellId, p.assignedPosition || 'Không')
                })
                champSelect.theirTeam.forEach((p, i) => {
                  logger.info('Đội địch #%d → summonerId: %d, championId: %d, cellId: %d, position: %s', i + 1, p.summonerId, p.championId, p.cellId, p.assignedPosition || 'Không')
                })
                logger.info('Toàn bộ champSelect: %o', champSelect)
              })
              .catch((err) => logger.error('Lấy chi tiết chọn tướng thất bại:', err))
          }
        })
        .catch((err) => logger.error('Lấy thông tin trận %s thất bại:', label, err))
    })
    logger.info('Debug gameflow logging enabled ✓')
  } else if (!enabled && debugGameflowUnsub) {
    debugGameflowUnsub()
    debugGameflowUnsub = null
    logger.info('Debug gameflow logging disabled')
  }
}
