import { useState, useRef, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { GameAnalysisModal } from '@/components/ui/GameAnalysisModal'
import type { GameAnalysisModalProps } from '@/components/ui/GameAnalysisModal'
import { store } from '@/lib/store'
import { lcu, SGP_SERVERS } from '@/lib/lcu'
import { aramggApi } from '@/lib/aramgg-api'
import { searchChampions, type ChampionInfo, getChampionBalanceMeta, getAllChampionBalances } from '@/lib/assets'
import { openOpggBuildRecommendationDebugPanel } from '@/lib/features/opgg-build-recommendation'
import { opggApi } from '@/lib/opgg-api'
import { getPluginAssetsFolderPath, resolvePluginAssetUrl } from '@/lib/plugin-resolver'
import { uploadImageToHostingServiceForDebug } from '@/lib/image-hosting-service'
import {
  decodeSonaStatusPayload,
  stripAvatarStatusPayload,
} from '@/lib/features/beautify-client/avatar-status-sync'
import { logger } from '@/index'
import { useI18n } from '@/i18n'
import '@/styles/SettingsPage.css'

export function DebugPage() {
  const { t } = useI18n()
  const [output, setOutput] = useState('')
  const [gameId, setGameId] = useState('')
  const [puuid, setPuuid] = useState('')
  const [chatMsg, setChatMsg] = useState('')
  const [chatMsgType, setChatMsgType] = useState('celebration')
  const [riotId, setRiotId] = useState('')
  const [skinId, setSkinId] = useState('')
  const [lobbyQueueId, setLobbyQueueId] = useState('')
  const [corsTestUrl, setCorsTestUrl] = useState('')
  const [imageHostingAssetPath, setImageHostingAssetPath] = useState('')
  const [champSearch, setChampSearch] = useState('')
  const [champSuggestions, setChampSuggestions] = useState<ChampionInfo[]>([])
  const [showChampSuggestions, setShowChampSuggestions] = useState(false)
  const [selectedChampId, setSelectedChampId] = useState(0)
  const [gameAnalysisOpen, setGameAnalysisOpen] = useState(false)
  const [beautifyImagePreview, setBeautifyImagePreview] = useState<{
    src: string
    name: string
    type: string
    size: number
  } | null>(null)
  const champRef = useRef<HTMLDivElement>(null)
  const opggPanelButtonRef = useRef<HTMLDivElement>(null)
  const beautifyImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (champRef.current && !champRef.current.contains(e.target as Node)) setShowChampSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])


  const runAndLog = async (label: string, fn: () => Promise<unknown>) => {
    setOutput(`⏳ ${label}...`)
    try {
      const result = await fn()
      logger.info('%s ↓ \n%o', label, result)
      const text = JSON.stringify(result, null, 2)
      setOutput(`✅ ${label}\n${text}`)
    } catch (err) {
      setOutput(`❌ ${label}\n${String(err)}`)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const handleBeautifyImageSelected = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setOutput(`❌ Vui lòng chọn tệp ảnh, loại tệp hiện tại: ${file.type || 'Không xác định'}`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setOutput('❌ Không thể đọc ảnh: FileReader không trả về Data URL hợp lệ')
        return
      }

      setBeautifyImagePreview({
        src: reader.result,
        name: file.name,
        type: file.type,
        size: file.size,
      })
      setOutput(`✅ Đã đọc ảnh\n${file.name}\n${file.type} · ${formatBytes(file.size)}`)
    }
    reader.onerror = () => {
      setOutput(`❌ Không thể đọc ảnh\n${reader.error?.message ?? 'Lỗi không xác định'}`)
    }
    reader.readAsDataURL(file)
  }

  const testImageHostingUpload = async () => {
    const assetPath = imageHostingAssetPath.trim()
    if (!assetPath) throw new Error('Vui lòng nhập đường dẫn tương đối của ảnh trong thư mục assets')

    const assetUrl = resolvePluginAssetUrl(assetPath)
    console.info('[Sona][ImageHosting] Bắt đầu đọc tài nguyên plugin', { source: 'plugin-assets' })

    try {
      const response = await fetch(assetUrl)
      if (!response.ok) {
        throw new Error(`Không thể đọc tài nguyên plugin: ${response.status} ${response.statusText}`)
      }

      const image = await response.blob()
      const fileName = assetPath.replace(/\\/g, '/').split('/').filter(Boolean).at(-1) || 'sona-debug-image.png'
      if (!image.type.startsWith('image/')) {
        console.warn('[Sona][ImageHosting] Phản hồi tài nguyên không phải image/*, tiếp tục kiểm tra theo phần mở rộng tệp', {
          responseContentType: image.type || '(empty)',
        })
      }

      return await uploadImageToHostingServiceForDebug(image, fileName)
    } catch (err) {
      console.error('[Sona][ImageHosting] Quy trình tải lên thất bại', err)
      throw err
    }
  }

  const testOpggConnectivity = async () => {
    const url = 'https://lol-api-champion.op.gg/api/global/champions/ranked/versions'
    const startedAt = performance.now()
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 10000)

    try {
      const resp = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      })
      const elapsedMs = Math.round(performance.now() - startedAt)
      const contentType = resp.headers.get('content-type') ?? ''
      const bodyText = await resp.text()
      let body: unknown = bodyText

      try {
        body = bodyText ? JSON.parse(bodyText) : null
      } catch {
        body = bodyText.slice(0, 500)
      }

      return {
        url,
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
        contentType,
        elapsedMs,
        dataPreview: Array.isArray(body) ? body.slice(0, 8) : body,
      }
    } catch (err) {
      const elapsedMs = Math.round(performance.now() - startedAt)
      const message = err instanceof Error ? err.message : String(err)
      return {
        url,
        ok: false,
        elapsedMs,
        error: message,
        hint: message.includes('abort')
          ? 'Yêu cầu hết thời gian chờ. Có thể mạng không truy cập được hoặc client chặn yêu cầu bên ngoài.'
          : 'Nếu xuất hiện Failed to fetch / NetworkError và CORS trong DevTools Console, trang được Pengu chèn vào không thể gọi trực tiếp API OP.GG.',
      }
    } finally {
      window.clearTimeout(timer)
    }
  }

  const fetchOpggJson = async (path: string, params?: Record<string, string | number | undefined>) => {
    const url = new URL(`https://lol-api-champion.op.gg${path}`)
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value != null && value !== '') url.searchParams.set(key, String(value))
    })

    const startedAt = performance.now()
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 10000)

    try {
      const resp = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      const elapsedMs = Math.round(performance.now() - startedAt)
      const text = await resp.text()
      let body: unknown = text
      try {
        body = text ? JSON.parse(text) : null
      } catch {
        body = text.slice(0, 1000)
      }

      return {
        url: url.toString(),
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
        elapsedMs,
        contentType: resp.headers.get('content-type') ?? '',
        dataPreview: Array.isArray(body) ? body.slice(0, 10) : body,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        url: url.toString(),
        ok: false,
        elapsedMs: Math.round(performance.now() - startedAt),
        error: message,
        hint: message.includes('abort')
          ? 'Yêu cầu hết thời gian chờ. Có thể mạng không truy cập được hoặc client chặn yêu cầu bên ngoài.'
          : 'Nếu xuất hiện Failed to fetch / NetworkError và CORS trong DevTools Console, trang được chèn hiện tại không thể gọi trực tiếp API OP.GG.',
      }
    } finally {
      window.clearTimeout(timer)
    }
  }

  const fetchCorsTestUrl = async () => {
    const rawUrl = corsTestUrl.trim()
    if (!rawUrl) throw new Error('Vui lòng nhập URL cần kiểm tra')

    const url = new URL(rawUrl)
    const startedAt = performance.now()
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 10000)

    try {
      const resp = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        headers: { Accept: '*/*' },
        signal: controller.signal,
      })
      const text = await resp.text()
      let body: unknown = text
      try {
        body = text ? JSON.parse(text) : null
      } catch {
        body = text
      }

      return {
        url: url.toString(),
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
        elapsedMs: Math.round(performance.now() - startedAt),
        contentType: resp.headers.get('content-type') ?? '',
        body,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        url: url.toString(),
        ok: false,
        elapsedMs: Math.round(performance.now() - startedAt),
        error: message,
        hint: message.includes('abort')
          ? 'Yêu cầu hết thời gian chờ. Có thể mạng không truy cập được hoặc trang đích phản hồi quá chậm.'
          : 'Nếu xuất hiện Failed to fetch / NetworkError và CORS trong DevTools Console, trang được chèn hiện tại không thể gửi yêu cầu khác nguồn trực tiếp tới URL này.',
      }
    } finally {
      window.clearTimeout(timer)
    }
  }

  const fetchAramggAugmentsStats = async () => {
    return aramggApi.getAugmentsStatsRaw()
  }

  const fetchAramggMayhemAugmentsZhCn = async () => {
    return aramggApi.getMayhemAugmentsZhCn()
  }

  const readFetchBody = async (resp: Response) => {
    const text = await resp.text()
    try {
      return text ? JSON.parse(text) : null
    } catch {
      return text
    }
  }

  const previewToken = (token: string) => {
    return token.length > 24 ? `${token.slice(0, 12)}...${token.slice(-8)}` : token
  }

  const normalizeTokenPayload = (payload: unknown): string => {
    if (typeof payload === 'string') return payload.trim().replace(/^"|"$/g, '')
    if (!payload || typeof payload !== 'object') return ''

    const record = payload as Record<string, unknown>
    const candidates = [
      record.accessToken,
      record.access_token,
      record.token,
      record.idToken,
      record.id_token,
    ]

    return candidates.find((value): value is string => typeof value === 'string' && value.length > 0) ?? ''
  }

  const collectTokenFromPayload = (tokens: Array<Record<string, unknown>>, source: string, payload: unknown) => {
    const pushToken = (tokenType: string, value: unknown) => {
      if (typeof value !== 'string' || !value.trim()) return
      const token = value.trim().replace(/^"|"$/g, '')
      if (!token || tokens.some((item) => item.token === token)) return
      tokens.push({
        source,
        tokenType,
        token,
        tokenPreview: previewToken(token),
        length: token.length,
      })
    }

    if (typeof payload === 'string') {
      pushToken('raw', payload)
      return
    }
    if (!payload || typeof payload !== 'object') return

    const record = payload as Record<string, unknown>
    pushToken('accessToken', record.accessToken)
    pushToken('access_token', record.access_token)
    pushToken('token', record.token)
    pushToken('idToken', record.idToken)
    pushToken('id_token', record.id_token)
  }

  const fetchLocalAuthPayload = async (endpoint: string) => {
    const resp = await fetch(endpoint)
    const body = await readFetchBody(resp)

    return {
      endpoint,
      ok: resp.ok,
      status: resp.status,
      statusText: resp.statusText,
      body,
    }
  }

  const fetchRsoAccessToken = async () => {
    const resp = await fetch('/lol-rso-auth/v1/authorization/access-token')
    const body = await readFetchBody(resp)

    return {
      ok: resp.ok,
      status: resp.status,
      statusText: resp.statusText,
      token: resp.ok ? normalizeTokenPayload(body) : '',
      bodyPreview: resp.ok ? undefined : body,
    }
  }

  const fetchRiotUserinfoWithToken = async (source: string, token: string) => {
    if (!token) {
      return { source, ok: false, error: 'Không lấy được token hợp lệ' }
    }

    const startedAt = performance.now()
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 10000)

    try {
      const resp = await fetch('https://auth.riotgames.com/userinfo', {
        method: 'GET',
        mode: 'cors',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      })
      const body = await readFetchBody(resp)

      return {
        source,
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
        elapsedMs: Math.round(performance.now() - startedAt),
        tokenPreview: previewToken(token),
        body,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        source,
        ok: false,
        elapsedMs: Math.round(performance.now() - startedAt),
        tokenPreview: previewToken(token),
        error: message,
        hint: message.includes('abort')
          ? 'Yêu cầu hết thời gian chờ.'
          : 'Nếu xuất hiện Failed to fetch / NetworkError, có thể CORS hoặc client chặn yêu cầu trực tiếp tới auth.riotgames.com.',
      }
    } finally {
      window.clearTimeout(timer)
    }
  }

  const collectUserinfoTokenCandidates = async () => {
    const tokens: Array<Record<string, unknown>> = []
    const endpoints = [
      '/lol-rso-auth/v1/authorization/access-token',
      '/lol-rso-auth/v1/authorization/id-token',
      '/lol-rso-auth/v1/authorization',
      '/lol-league-session/v1/league-session-token',
      '/entitlements/v1/token',
    ]

    const localResults = await Promise.all(
      endpoints.map((endpoint) => fetchLocalAuthPayload(endpoint)
        .then((result) => {
          collectTokenFromPayload(tokens, endpoint, result.body)
          return {
            endpoint,
            ok: result.ok,
            status: result.status,
            statusText: result.statusText,
          }
        })
        .catch((err) => ({
          endpoint,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }))),
    )

    return {
      tips: [
        'Các token này chỉ dùng để debug cục bộ, không gửi cho người khác.',
        'Ưu tiên thử token từ /lol-rso-auth/v1/authorization/access-token trong test/riot-userinfo.mjs.',
        'Nếu tập lệnh Vercel/Node trả về 200, có thể dùng token tương ứng để gọi Riot UserInfo khi xác thực phía máy chủ.',
      ],
      localResults,
      tokens,
    }
  }

  const testRiotUserinfoAuth = async () => {
    const result: Record<string, unknown> = {}

    const [entitlementsToken, rsoTokenResult, localUserinfoResult] = await Promise.all([
      lcu.getEntitlementsToken().catch((err) => ({
        error: err instanceof Error ? err.message : String(err),
        accessToken: '',
      })),
      fetchRsoAccessToken().catch((err) => ({
        ok: false,
        status: 0,
        statusText: '',
        token: '',
        bodyPreview: err instanceof Error ? err.message : String(err),
      })),
      fetch('/lol-rso-auth/v1/authorization/userinfo')
        .then(async (resp) => ({
          ok: resp.ok,
          status: resp.status,
          statusText: resp.statusText,
          body: await readFetchBody(resp),
        }))
        .catch((err) => ({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        })),
    ])

    const entitlementsAccessToken = 'accessToken' in entitlementsToken ? entitlementsToken.accessToken : ''
    const rsoAccessToken = rsoTokenResult.token

    result.localLcuUserinfo = localUserinfoResult
    result.entitlementsAccessToken = entitlementsAccessToken
      ? { tokenPreview: previewToken(entitlementsAccessToken), subject: 'subject' in entitlementsToken ? entitlementsToken.subject : undefined }
      : entitlementsToken
    result.rsoAccessToken = {
      ok: rsoTokenResult.ok,
      status: rsoTokenResult.status,
      statusText: rsoTokenResult.statusText,
      tokenPreview: rsoAccessToken ? previewToken(rsoAccessToken) : '',
      bodyPreview: rsoTokenResult.bodyPreview,
    }
    result.officialUserinfoWithEntitlementsToken = await fetchRiotUserinfoWithToken('entitlements.accessToken', entitlementsAccessToken)
    result.officialUserinfoWithRsoToken = await fetchRiotUserinfoWithToken('rso.authorization.access-token', rsoAccessToken)

    return result
  }

  const fetchOpggDebugBuildData = async () => {
    const championId = await getOpggDebugChampionId()
    const mode = 'ranked'
    const position = 'mid'
    const tier = 'platinum_plus'
    const champion = await opggApi.getChampion({
      id: championId,
      region: 'global',
      mode,
      position,
      tier,
    })
    const data = champion.data

    return {
      request: {
        championId,
        region: 'global',
        mode,
        position,
        tier,
        version: champion.meta.version,
      },
      summary: data.summary,
      starter_items: data.starter_items ?? [],
      boots: data.boots ?? [],
      core_items: data.core_items ?? [],
      prism_items: 'prism_items' in data ? data.prism_items : [],
      last_items: data.last_items ?? [],
      raw: champion,
    }
  }

  const fetchRegaliaBanners = async () => {
    const inventory = await lcu.getRegaliaBannerInventory()

    const banners = inventory.flatMap((entry, groupIndex) => {
      return (entry.items ?? []).map((item) => ({
        groupIndex,
        id: String(item.id),
        idSecondary: item.idSecondary,
        name: item.localizedName || `Banner ${item.id}`,
        assetPath: item.assetPath,
        regaliaType: item.regaliaType,
        isSelectable: item.isSelectable,
        isTencentOnly: item.isTencentOnly,
        isOwned: entry.isOwned,
        purchaseDate: entry.purchaseDate ?? '',
      }))
    })

    return {
      total: banners.length,
      owned: banners.filter((banner) => banner.isOwned).length,
      groups: inventory.length,
      banners,
      raw: inventory,
    }
  }

  const inspectOnlineFriendStatusMessages = async () => {
    const [me, friends] = await Promise.all([
      lcu.getChatMe(),
      lcu.getFriends(),
    ])

    const inspectStatusMessage = (statusMessage: string | null | undefined) => {
      const source = statusMessage ?? ''
      const parsedPayload = decodeSonaStatusPayload(source)

      return {
        statusMessage: source,
        statusMessageLength: source.length,
        visibleStatusMessage: stripAvatarStatusPayload(source),
        parsed: parsedPayload != null,
        parsedPayload,
      }
    }

    const onlineFriends = friends
      .filter((friend) => friend.availability !== 'offline')
      .map((friend) => ({
        gameName: friend.gameName,
        gameTag: friend.gameTag,
        riotId: friend.gameTag ? `${friend.gameName}#${friend.gameTag}` : friend.gameName,
        puuid: friend.puuid,
        friendId: friend.id,
        summonerId: friend.summonerId,
        availability: friend.availability,
        product: friend.product,
        ...inspectStatusMessage(friend.statusMessage),
      }))

    const result = {
      summary: {
        totalFriends: friends.length,
        nonOfflineFriends: onlineFriends.length,
        parsedFriends: onlineFriends.filter((friend) => friend.parsed).length,
      },
      self: {
        gameName: me.gameName,
        gameTag: me.gameTag,
        riotId: me.gameTag ? `${me.gameName}#${me.gameTag}` : me.gameName,
        puuid: me.puuid,
        summonerId: me.summonerId,
        availability: me.availability,
        ...inspectStatusMessage(me.statusMessage),
      },
      friends: onlineFriends,
    }

    console.info('[Sona][StatusMessageDebug] Kết quả phân tích trạng thái của bản thân và bạn bè không ngoại tuyến\n%s', JSON.stringify(result, null, 2))
    return result
  }

  const getOpggDebugChampionId = async () => {
    if (selectedChampId > 0) return selectedChampId
    try {
      const session = await lcu.getChampSelectSession()
      const local = session.myTeam.find((player) => player.cellId === session.localPlayerCellId)
      if (local?.championId) return local.championId
    } catch {
      // ignore
    }
    return 68
  }

  const testChampSelectDodgeViaQuitV2 = async () => {
    const phase = await lcu.getGameflowPhase()
    logger.info('[Sona][DodgeDebug] Giai đoạn Gameflow hiện tại: %s', phase)

    if (phase !== 'ChampSelect') {
      throw new Error(`Giai đoạn hiện tại là ${phase}, chỉ được gửi yêu cầu thoát chọn tướng trong giai đoạn ChampSelect`)
    }

    const endpoint = '/lol-login/v1/session/invoke (lcdsServiceProxy → teambuilder-draft.quitV2)'
    logger.info('[Sona][DodgeDebug] Sắp gọi %s', endpoint)
    const response = await lcu.dodgeChampSelectViaQuitV2()
    const result = {
      success: true,
      phase,
      endpoint,
      response: response ?? null,
    }
    logger.info('[Sona][DodgeDebug] Yêu cầu quitV2 hoàn tất ↓\n%o', result)
    return result
  }

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">{t('debug.title')}</h2>

      <SettingGroup title={t('debug.group.beautify')}>
        <p className="sona-subtitle">
          {t('debug.beautify.description')}
        </p>
        <input
          ref={beautifyImageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(event) => {
            handleBeautifyImageSelected(event.currentTarget.files?.[0] ?? null)
            event.currentTarget.value = ''
          }}
        />
        <div className="sona-debug-actions">
          <SonaButton variant="primary" onClick={() => beautifyImageInputRef.current?.click()}>
            {t('debug.beautify.chooseImage')}
          </SonaButton>
          <SonaButton onClick={() => window.openPluginsFolder(getPluginAssetsFolderPath())}>
            {t('beautify.assets.openFolder')}
          </SonaButton>
          {beautifyImagePreview && (
            <SonaButton variant="secondary" onClick={() => setBeautifyImagePreview(null)}>
              {t('debug.beautify.clearPreview')}
            </SonaButton>
          )}
        </div>
        {beautifyImagePreview && (
          <div className="sona-debug-image-preview">
            <div className="sona-debug-image-meta">
              {beautifyImagePreview.name} · {beautifyImagePreview.type} · {formatBytes(beautifyImagePreview.size)}
            </div>
            <img src={beautifyImagePreview.src} alt={t('debug.beautify.chooseImage')} />
          </div>
        )}
        <p className="sona-subtitle" style={{ marginTop: 14 }}>
          Kiểm tra quy trình lưu trữ ảnh: nhập đường dẫn tương đối của ảnh trong thư mục assets. Console sẽ ghi thông tin từng giai đoạn đã ẩn dữ liệu nhạy cảm.
        </p>
        <div className="sona-debug-actions" style={{ alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <SonaInput
              value={imageHostingAssetPath}
              onChange={setImageHostingAssetPath}
              placeholder="Ví dụ: test/avatar.png hoặc assets/test/avatar.png"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void runAndLog('Kiểm tra tải ảnh lên dịch vụ lưu trữ', testImageHostingUpload)
                }
              }}
            />
          </div>
          <SonaButton
            variant="primary"
            onClick={() => runAndLog('Kiểm tra tải ảnh lên dịch vụ lưu trữ', testImageHostingUpload)}
          >
            Tải lên dịch vụ lưu trữ ảnh
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.lcu')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Lấy thông tin người chơi', () => lcu.getSummonerInfo())}>
            {t('debug.action.summonerInfo')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Lấy trạng thái trực tuyến', () => lcu.getChatMe())}>
            {t('debug.action.chatMe')}
          </SonaButton>
          <SonaButton
            variant="primary"
            onClick={() => runAndLog('Phân tích trạng thái của bản thân và bạn bè không ngoại tuyến', inspectOnlineFriendStatusMessages)}
          >
            Kiểm tra JSON trạng thái
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Lấy giai đoạn trò chơi', () => lcu.getGameflowPhase())}>
            {t('debug.action.gameflow')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Lấy các cuộc trò chuyện', () => lcu.getChatConversations())}>
            {t('debug.action.chatSessions')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Kho cờ hiệu (REGALIA_BANNER)', fetchRegaliaBanners)}>
            {t('debug.action.bannerInventory')}
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.champSelect')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Đổi tướng ngẫu nhiên ARAM', () => lcu.reroll())}>
            {t('debug.action.reroll')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Phiên chọn tướng', () => lcu.getChampSelectSession())}>
            {t('debug.action.champSession')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('GameFlow Session', () => lcu.getGameflowSession())}>
            GameFlow Session
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Tướng trong bể dùng chung', () => lcu.getBenchChampions())}>
            {t('debug.action.bench')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Danh sách tướng có thể chọn', () => lcu.getPickableChampionIds())}>
            {t('debug.action.pickable')}
          </SonaButton>
          <SonaButton variant="secondary" onClick={() => {
            if (!window.confirm(t('debug.confirm.dodgeQuitV2'))) {
              setOutput('Đã hủy kiểm tra thoát chọn tướng bằng quitV2')
              return
            }
            void runAndLog('Kiểm tra thoát chọn tướng bằng quitV2', testChampSelectDodgeViaQuitV2)
          }}>
            {t('debug.action.dodgeQuitV2')}
          </SonaButton>
        </div>
        <p className="sona-subtitle">{t('debug.hint.dodgeQuitV2')}</p>
        <p className="sona-subtitle">{t('debug.hint.benchSlots')}</p>
        <div className="sona-debug-actions">
          {Array.from({ length: 10 }, (_, i) => (
            <SonaButton key={i} style={{ minWidth: 40, padding: '6px 0' }} onClick={() => runAndLog(`Đổi tướng Bench (ô ${i + 1})`, async () => {
              const bench = await lcu.getBenchChampions()
              if (i >= bench.length) throw new Error(`Ô ${i + 1} không tồn tại, Bench hiện có ${bench.length} tướng`)
              const target = bench[i]
              logger.info('Thử đổi lấy tướng ở ô %d → championId: %d', i + 1, target.championId)
              return lcu.benchSwap(target.championId)
            })}>
              {i + 1}
            </SonaButton>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.lookup')}>
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={riotId}
              onChange={setRiotId}
              placeholder={t('debug.placeholder.riotId')}
            />
          </div>
          <SonaButton onClick={() => {
            const parts = riotId.trim().split('#')
            if (parts.length !== 2 || !parts[0] || !parts[1]) { setOutput('❌ Định dạng: Tên#Tag'); return }
            runAndLog(`Tra cứu người chơi ${riotId}`, () => lcu.getSummonerByRiotId(parts[0], parts[1]))
          }}>
            {t('debug.action.queryPuuid')}
          </SonaButton>
          <SonaButton onClick={() => {
            const parts = riotId.trim().split('#')
            if (parts.length !== 2 || !parts[0] || !parts[1]) { setOutput('❌ Định dạng: Tên#Tag'); return }
            runAndLog(`Tra cứu puuid xuyên khu vực ${riotId}`, async () => {
              const resolved = await lcu.resolveSummonerPuuidByRiotId(parts[0], parts[1])
              return resolved ? { riotId, puuid: resolved } : `❌ Không tìm thấy (đã tìm trên tất cả khu vực máy chủ Trung Quốc): ${riotId}`
            })
          }}>
            Tra cứu puuid xuyên khu vực
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.matchHistory')}>
        <div className="sona-debug-actions">
          <SonaButton variant="primary" onClick={() => runAndLog('Lấy toàn bộ 100 trận trong lịch sử', async () => {
            const me = await lcu.getSummonerInfo()
            const puuid = me.puuid
            if (!puuid) return '❌ Không thể lấy PUUID'

            const page = await lcu.getMatchHistory(puuid, 0, 99)
            const games = page.games?.games || []
            return { total: games.length, games }
          })}>
            Lấy toàn bộ lịch sử (100 trận)
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Người chơi cùng gần đây', () => lcu.getRecentlyPlayedSummoners())}>
            Đồng đội gần đây
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8, alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={puuid}
              onChange={setPuuid}
              placeholder={t('debug.placeholder.puuid')}
            />
          </div>
          <SonaButton onClick={() => {
            if (!puuid.trim()) { setOutput('❌ Vui lòng nhập PUUID'); return }
            runAndLog(`Lịch sử đấu (${puuid.slice(0, 8)}...)`, () => lcu.getMatchHistory(puuid.trim()))
          }}>
            {t('debug.action.queryMatch')}
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8, alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={gameId}
              onChange={setGameId}
              placeholder={t('debug.placeholder.gameId')}
            />
          </div>
          <SonaButton onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ Vui lòng nhập Game ID hợp lệ'); return }
            runAndLog(`Chi tiết trận đấu #${id}`, () => lcu.getMatchDetail(id))
          }}>
            {t('debug.action.matchDetail')}
          </SonaButton>
          <SonaButton onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ Vui lòng nhập Game ID hợp lệ'); return }
            runAndLog(`Dòng thời gian #${id}`, () => lcu.getMatchTimeline(id))
          }}>
            {t('debug.action.timeline')}
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.auth')}>
        <p className="sona-subtitle">
          {t('debug.hint.auth')}
        </p>
        <div className="sona-debug-actions">
          <SonaButton variant="primary" onClick={() => runAndLog('Entitlements Token', () => lcu.getEntitlementsToken())}>
            Lấy Entitlements Token
          </SonaButton>
          <SonaButton onClick={() => runAndLog('League Session Token', () => lcu.getLeagueSessionToken())}>
            Lấy Session Token
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Thu thập các token ứng viên cho UserInfo', collectUserinfoTokenCandidates)}>
            Thu thập UserInfo Token
          </SonaButton>
          <SonaButton variant="primary" onClick={() => runAndLog('Kiểm tra xác thực Riot UserInfo', testRiotUserinfoAuth)}>
            Kiểm tra xác thực UserInfo
          </SonaButton>
          <SonaButton onClick={() => runAndLog('SGP Server ID (phân tích từ issuer)', () => lcu.getSgpServerId())}>
            Phân tích SGP Server ID
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('Kết nối trực tiếp SGP: lịch sử đấu của bản thân', async () => {
            const [tokenRes, me, sgpServerId] = await Promise.all([
              lcu.getEntitlementsToken(),
              lcu.getSummonerInfo(),
              lcu.getSgpServerId(),
            ])
            const sgpServer = SGP_SERVERS[sgpServerId.toUpperCase()]
            const baseUrl = sgpServer?.matchHistory
            if (!baseUrl) {
              return { error: `ID máy chủ SGP không xác định: ${sgpServerId}`, issuer: tokenRes.issuer, sgpServerId }
            }
            const url = `${baseUrl}/match-history-query/v1/products/lol/player/${me.puuid}/SUMMARY?startIndex=0&count=10`
            const result: Record<string, unknown> = {
              sgpServerId,
              baseUrl,
              puuid: me.puuid,
              requestUrl: url,
              tokenPreview: tokenRes.accessToken?.slice(0, 40) + '...',
            }
            try {
              const resp = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${tokenRes.accessToken}`,
                  'User-Agent': 'LeagueOfLegendsClient/14.13.596.7996 (rcp-be-lol-match-history)',
                },
              })
              result.status = resp.status
              result.statusText = resp.statusText
              result.ok = resp.ok
              if (resp.ok) {
                const data = await resp.json()
                result.dataPreview = data
              } else {
                result.errorBody = await resp.text().catch(() => '')
              }
            } catch (err: unknown) {
              result.fetchError = err instanceof Error ? err.message : String(err)
              result.hint = 'Nếu thấy lỗi CORS/Network, trình duyệt CEF đã chặn yêu cầu khác nguồn, không thể kết nối trực tiếp SGP'
            }
            return result
          })}>
            Kết nối trực tiếp SGP: lịch sử đấu của bản thân
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.opgg')}>
        <p className="sona-subtitle">
          {t('debug.hint.opgg')}
        </p>
        <div className="sona-debug-actions" style={{ alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={corsTestUrl}
              onChange={setCorsTestUrl}
              placeholder={t('debug.placeholder.corsUrl')}
            />
          </div>
          <SonaButton variant="primary" onClick={() => runAndLog('Kiểm tra GET khác nguồn', fetchCorsTestUrl)}>
            Kiểm tra GET
          </SonaButton>
        </div>
        <div className="sona-debug-actions">
          <SonaButton variant="primary" onClick={() => runAndLog('Khả năng kết nối API phiên bản OP.GG', testOpggConnectivity)}>
            Kiểm tra API OP.GG
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Danh sách phiên bản ranked OP.GG', () =>
            fetchOpggJson('/api/global/champions/ranked/versions')
          )}>
            Phiên bản ranked
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Danh sách tướng ranked OP.GG', () =>
            fetchOpggJson('/api/global/champions/ranked', { tier: 'platinum_plus' })
          )}>
            Danh sách ranked
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('OP.GG Dữ liệu một tướng ranked', async () => {
            const id = await getOpggDebugChampionId()
            return fetchOpggJson(`/api/global/champions/ranked/${id}/mid`, { tier: 'platinum_plus' })
          })}>
            Dữ liệu một tướng ranked
          </SonaButton>
          <SonaButton variant="primary" onClick={() => runAndLog('OP.GG Các trường dữ liệu build ranked/mid', fetchOpggDebugBuildData)}>
            Các trường dữ liệu build
          </SonaButton>
          <SonaButton onClick={() => runAndLog('OP.GG Dữ liệu một tướng ARAM', async () => {
            const id = await getOpggDebugChampionId()
            return fetchOpggJson(`/api/global/champions/aram/${id}/none`, { tier: 'platinum_plus' })
          })}>
            Dữ liệu một tướng ARAM
          </SonaButton>
          <SonaButton onClick={() => runAndLog('OP.GG Dữ liệu một tướng Arena', async () => {
            const id = await getOpggDebugChampionId()
            return fetchOpggJson(`/api/global/champions/arena/${id}`, { tier: 'all' })
          })}>
            Dữ liệu một tướng Arena
          </SonaButton>
          <SonaButton onClick={() => runAndLog('OP.GG ARAM Balance', () =>
            fetchOpggJson('/api/contents/aram-balance')
          )}>
            ARAM Balance
          </SonaButton>
          <SonaButton onClick={() => runAndLog('ARAMGG Thống kê nâng cấp thô', fetchAramggAugmentsStats)}>
            ARAMGG Thống kê nâng cấp
          </SonaButton>
          <SonaButton onClick={() => runAndLog('ARAMGG Thông tin nâng cấp bằng tiếng Trung', fetchAramggMayhemAugmentsZhCn)}>
            ARAMGG Nâng cấp bằng tiếng Trung
          </SonaButton>
          <div ref={opggPanelButtonRef} style={{ display: 'inline-block' }}>
            <SonaButton onClick={async () => {
              const anchor = opggPanelButtonRef.current
              if (!anchor) return

              try {
                const id = await getOpggDebugChampionId()
                await openOpggBuildRecommendationDebugPanel(anchor, id)
                setOutput(`✅ Đã mở bảng gợi ý build OP.GG\nchampionId=${id} · KIWI · queueId=3100`)
              } catch (err) {
                setOutput(`❌ Không thể mở bảng gợi ý build OP.GG\n${err instanceof Error ? err.message : String(err)}`)
              }
            }}>
              Mở bảng gợi ý build
            </SonaButton>
          </div>
          <SonaButton onClick={async () => {
            const anchor = opggPanelButtonRef.current
            if (!anchor) return

            try {
              const id = await getOpggDebugChampionId()
              await openOpggBuildRecommendationDebugPanel(anchor, id, {
                queueId: 420,
                gameMode: 'CLASSIC',
                position: 'mid',
              })
              setOutput(`✅ Đã mở bảng gợi ý build OP.GG\nchampionId=${id} · ranked/mid · queueId=420`)
            } catch (err) {
              setOutput(`❌ Không thể mở bảng gợi ý build ranked\n${err instanceof Error ? err.message : String(err)}`)
            }
          }}>
            Mở bảng ranked
          </SonaButton>
        </div>
        <p className="sona-subtitle">{t('debug.hint.opggChampion')}</p>
      </SettingGroup>

      <SettingGroup title={t('debug.group.chat')}>
        <p className="sona-subtitle">
          {t('debug.hint.chat')}
        </p>
        <div className="sona-debug-actions" style={{ gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={chatMsg}
              onChange={setChatMsg}
              placeholder={t('debug.placeholder.chat')}
            />
          </div>
          <SonaSelect
            value={chatMsgType}
            onChange={setChatMsgType}
            options={[
              { value: 'chat', label: 'chat (mọi người đều thấy)' },
              { value: 'celebration', label: 'celebration (chỉ bản thân thấy)' },
              { value: 'system', label: 'system (chỉ bản thân thấy)' },
              { value: 'information', label: 'information (chỉ bản thân thấy)' },
            ]}
          />
          <SonaButton onClick={() => {
            if (!chatMsg.trim()) { setOutput('❌ Vui lòng nhập tin nhắn'); return }
            runAndLog(`Gửi tin nhắn [${chatMsgType}] (${chatMsg.length} ký tự)`, () => lcu.sendChampSelectMessage(chatMsg, chatMsgType))
          }}>
            {t('debug.action.send')}
          </SonaButton>
        </div>
        <p className="sona-subtitle">{t('debug.label.charCount', { count: chatMsg.length })}</p>
      </SettingGroup>

      <SettingGroup title={t('debug.group.client')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => window.openDevTools()}>
            {t('debug.action.openDevtools')}
          </SonaButton>
          <SonaButton onClick={() => window.openPluginsFolder()}>
            {t('debug.action.openPluginFolder')}
          </SonaButton>
          <SonaButton variant="secondary" onClick={() => window.reloadClient()}>
            {t('debug.action.reloadClient')}
          </SonaButton>
          <SonaButton onClick={() => setGameAnalysisOpen(true)}>
            {t('debug.action.gameAnalysis')}
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.assets')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Danh sách trang bị (items.json)', () => lcu.getItems())}>
            Biểu tượng trang bị
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Phép bổ trợ (summoner-spells.json)', () => lcu.getSummonerSpells())}>
            Biểu tượng phép bổ trợ
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Tóm tắt tướng (champion-summary.json)', () => lcu.getChampionSummary())}>
            Dữ liệu tóm tắt tướng
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8, alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }} ref={champRef}>
            <SonaInput
              value={champSearch}
              onChange={(v) => {
                setChampSearch(v)
                const results = searchChampions(v)
                setChampSuggestions(results)
                setShowChampSuggestions(results.length > 0)
              }}
              placeholder={t('debug.placeholder.champion')}
            />
            {showChampSuggestions && champSuggestions.length > 0 && (
              <div className="sona-champ-suggest">
                {champSuggestions.map((c) => (
                  <button
                    key={c.id}
                    className="sona-champ-suggest-item"
                    type="button"
                    onClick={() => {
                      setChampSearch(`${c.title} ${c.name}`)
                      setSelectedChampId(c.id)
                      setShowChampSuggestions(false)
                    }}
                  >
                    <img className="sona-champ-suggest-icon" src={`/lol-game-data/assets/v1/champion-icons/${c.id}.png`} alt="" />
                    <span className="sona-champ-suggest-title">{c.title}</span>
                    <span className="sona-champ-suggest-name">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <SonaButton onClick={() => {
            if (!selectedChampId) { setOutput('❌ Vui lòng chọn một tướng trước'); return }
            runAndLog(`Dữ liệu đầy đủ của tướng #${selectedChampId}`, async () => {
              const res = await fetch(`/lol-game-data/assets/v1/champions/${selectedChampId}.json`); return res.json()
            })
          }}>
            {t('debug.action.fullChampionData')}
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('Danh sách ngọc (perks.json)', () => lcu.getPerks())}>
            Danh sách ngọc
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Nhánh ngọc (perkstyles.json)', () => lcu.getPerkStyles())}>
            Nhánh ngọc
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Lựa chọn nâng cấp (cherry-augments.json)', () => lcu.getAugments())}>
          Lựa chọn nâng cấp
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Danh sách bạn bè (friends)', () => lcu.getFriends())}>
            Danh sách bạn bè
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('Danh sách hàng chờ (queues)', () => lcu.getQueues())}>
            Danh sách hàng chờ
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Chế độ chơi (game-type-config)', () => lcu.getGameModes())}>
            Chế độ chơi
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Thông tin bản đồ (maps)', () => lcu.getMaps())}>
            Thông tin bản đồ
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Tài nguyên bản đồ (maps.json)', () => lcu.getMapAssets())}>
            Tài nguyên bản đồ
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.replay')}>
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={gameId}
              onChange={setGameId}
              placeholder={t('debug.placeholder.gameId')}
            />
          </div>
          <SonaButton onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ Vui lòng nhập Game ID'); return }
            runAndLog(`Siêu dữ liệu bản xem lại #${id}`, async () => {
              const res = await fetch(`/lol-replays/v1/metadata/${id}`); return res.ok ? res.json() : `❌ ${res.status} ${await res.text()}`
            })
          }}>
            Kiểm tra trạng thái
          </SonaButton>
          <SonaButton onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ Vui lòng nhập Game ID'); return }
            runAndLog(`Xem trực tiếp #${id} (không tải xuống)`, async () => {
              const res = await fetch(`/lol-replays/v1/rofls/${id}/watch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ componentType: 'replay', contextData: 'match-history' }),
              })
              return res.ok ? '✅ Đã gửi yêu cầu xem' : `❌ ${res.status} ${await res.text()}`
            })
          }}>
            {t('debug.action.watchDirectly')}
          </SonaButton>
          <SonaButton variant="secondary" onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ Vui lòng nhập Game ID'); return }
            runAndLog(`Tải bản xem lại #${id}`, async () => {
              const res = await fetch(`/lol-replays/v1/rofls/${id}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ componentType: 'replay', contextData: 'match-history' }),
              })
              return res.ok ? '✅ Đã gửi yêu cầu tải xuống' : `❌ ${res.status} ${await res.text()}`
            })
          }}>
            {t('debug.action.download')}
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.honor')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Phiếu vinh danh (ballot)', async () => {
            const res = await fetch('/lol-honor-v2/v1/ballot'); return res.json()
          })}>
            Xem phiếu
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Cấu hình vinh danh', async () => {
            const res = await fetch('/lol-honor-v2/v1/config'); return res.json()
          })}>
            Cấu hình vinh danh
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Vinh danh gần đây', async () => {
            const res = await fetch('/lol-honor-v2/v1/latest-eligible-game'); return res.json()
          })}>
            Trận gần nhất có thể vinh danh
          </SonaButton>
          <SonaButton variant="primary" onClick={() => runAndLog('Dùng tất cả phiếu để vinh danh ngẫu nhiên', async () => {
            const ballotRes = await fetch('/lol-honor-v2/v1/ballot')
            if (!ballotRes.ok) return `❌ Hiện không có trận chờ vinh danh ${ballotRes.status}`
            const ballot = await ballotRes.json()
            const allies = ballot.eligibleAllies || []
            if (allies.length === 0) return '⚠️ Không có đồng đội có thể vinh danh'
            const votes = ballot.votePool?.votes ?? 1
            const cats = ['HEART', 'COOL', 'SHOTCALLER']
            const results: string[] = []
            for (let i = 0; i < votes; i++) {
              const lucky = allies[Math.floor(Math.random() * allies.length)]
              const cat = cats[Math.floor(Math.random() * cats.length)]
              const res = await fetch('/lol-honor-v2/v1/honor-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ puuid: lucky.puuid, summonerId: lucky.summonerId, gameId: ballot.gameId, honorCategory: cat }),
              })
              results.push(res.ok ? `✅ [${cat}] → ${lucky.championName}` : `❌ ${res.status}`)
            }
            return results.join('\n')
          })}>
            Vinh danh ngẫu nhiên
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.lobby')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Thông tin phòng (lobby)', async () => {
            const res = await fetch('/lol-lobby/v2/lobby'); return res.json()
          })}>
            Thông tin phòng
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Thành viên phòng (members)', async () => {
            const res = await fetch('/lol-lobby/v2/lobby/members'); return res.json()
          })}>
            Danh sách thành viên
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Danh sách lời mời (invitations)', async () => {
            const res = await fetch('/lol-lobby/v2/lobby/invitations'); return res.json()
          })}>
            Danh sách lời mời
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8, alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={lobbyQueueId}
              onChange={setLobbyQueueId}
              placeholder={t('debug.placeholder.queueId')}
            />
          </div>
          <SonaButton variant="primary" onClick={() => {
            const id = Number(lobbyQueueId)
            if (!id) { setOutput('❌ Vui lòng nhập Queue ID hợp lệ'); return }
            runAndLog(`Tạo phòng queueId=${id}`, () => lcu.createLobby(id))
          }}>
            Tạo phòng
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.avatar')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Regalia v2', () => lcu.getRegalia())}>
            Xem Regalia
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Ảnh đại diện hiện tại', async () => {
            const res = await fetch('/lol-summoner/v1/current-summoner'); return res.json()
          })}>
            Người chơi hiện tại
          </SonaButton>
          <SonaButton variant="primary" onClick={() => runAndLog('Khôi phục ảnh đại diện mặc định (id=29)', async () => {
            const res = await fetch('/lol-summoner/v1/current-summoner/icon', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileIconId: 29 }),
            }); return res.json()
          })}>
            Khôi phục ảnh đại diện mặc định
          </SonaButton>
        </div>
      </SettingGroup>


      <SettingGroup title={t('debug.group.profileBg')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('summoner-profile', async () => {
            const res = await fetch('/lol-summoner/v1/current-summoner/summoner-profile'); return res.json()
          })}>
            Profile hiện tại
          </SonaButton>
          <SonaButton onClick={() => runAndLog('backdrop', async () => {
            const res = await fetch('/lol-collections/v1/inventories/local/backdrop'); return res.json()
          })}>
            Backdrop
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Lấy kho skin', async () => {
            const meRes = await fetch('/lol-summoner/v1/current-summoner')
            if (!meRes.ok) return '❌ Không thể lấy thông tin cá nhân'
            const me = await meRes.json()
            const skinsRes = await fetch(`/lol-champions/v1/inventories/${me.summonerId}/skins-minimal`)
            if (!skinsRes.ok) return `❌ ${skinsRes.status} Không thể lấy skin`
            const skins = await skinsRes.json()
            const ownedSkins = skins.filter((s: { ownership?: { owned?: boolean } }) => s.ownership?.owned)
            return ownedSkins
          })}>
            Kho skin
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8, alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={skinId}
              onChange={setSkinId}
              placeholder={t('debug.placeholder.skinId')}
            />
          </div>
          <SonaButton variant="primary" onClick={() => {
            const id = Number(skinId)
            if (!id && id !== 0) { setOutput('❌ Vui lòng nhập ID skin hợp lệ'); return }
            runAndLog(`Đặt nền hồ sơ skinId=${id}`, async () => {
              const postRes = await fetch('/lol-summoner/v1/current-summoner/summoner-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'backgroundSkinId', value: id }),
              })
              return postRes.ok ? `✅ Đã đặt nền thành ${id}` : `❌ ${postRes.status} ${await postRes.text()}`
            })
          }}>
            Đặt nền
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.clientConfig')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Cài đặt chung (game-settings)', () => lcu.getGameSettings())}>
            Cài đặt chung
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Cài đặt phím tắt (input-settings)', () => lcu.getInputSettings())}>
            Cài đặt phím tắt
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Phiên bản trò chơi (game-version)', () => lcu.getGameVersion())}>
            Phiên bản trò chơi
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Dữ liệu cân bằng tướng (meta + count)', () =>
            Promise.resolve({ meta: getChampionBalanceMeta(), count: getAllChampionBalances().length })
          )}>
            Dữ liệu cân bằng tướng
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.region')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Khu vực và ngôn ngữ', async () => {
            const res = await fetch('/riotclient/region-locale'); return res.json()
          })}>
            Khu vực và ngôn ngữ
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Danh mục đa sắc', async () => {
            const res = await fetch('/lol-store/v1/catalog?inventoryType=CHROMA'); return res.json()
          })}>
            Danh mục đa sắc
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Công tắc tính năng', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces/FeatureToggles'); return res.json()
          })}>
            Công tắc tính năng
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('Không gian tên cấu hình', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces'); return res.json()
          })}>
            Không gian tên cấu hình
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Cấu hình Chromas', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces/Chromas'); return res.json()
          })}>
            Cấu hình Chromas
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Cấu hình cửa hàng', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces/LcuStore'); return res.json()
          })}>
            Cấu hình cửa hàng
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.store')}>
        <SettingCard title="Ảnh chụp cấu hình hiện tại" description="Xem giá trị hiện tại của tất cả cấu hình đã lưu">
          <SonaButton onClick={() => setOutput(JSON.stringify(store.getAll(), null, 2))}>
            {t('debug.action.view')}
          </SonaButton>
        </SettingCard>
        <SettingCard title="Đặt lại tất cả cấu hình" description="Khôi phục tất cả cấu hình về giá trị mặc định">
          <SonaButton variant="secondary" onClick={() => { store.resetAll(); setOutput('✅ Đã đặt lại tất cả cấu hình') }}>
            {t('common.reset')}
          </SonaButton>
        </SettingCard>
      </SettingGroup>

      {/* 输出区 */}
      {output && (
        <div className="sona-debug-output">
          <pre>{output}</pre>
        </div>
      )}

      <GameAnalysisModal open={gameAnalysisOpen} onClose={() => setGameAnalysisOpen(false)} mockData={GAME_ANALYSIS_MOCK} />
    </div>
  )
}

const GAME_ANALYSIS_MOCK: NonNullable<GameAnalysisModalProps['mockData']> = {
  gameInfo: {
    queueName: 'Xếp hạng Đơn/Đôi',
    gameMode: 'CLASSIC',
    mapName: 'Summoner’s Rift',
    isBlueTeam: true,
    queueId: 420,
  },
  blueTeam: [
    {
      puuid: 'mock-blue-1', summonerId: 1, summonerName: 'Thợ Săn Bóng Đêm #CN1', championId: 67, teamParticipantId: 1, selectedPosition: 'top',
      winRate: 75, wins: 30, total: 40, kdaNum: 5.2, avgK: 8.2, avgD: 4.1, avgA: 13.1,
      rankText: 'Thách Đấu Đơn/Đôi', rankColor: '#f1c40f', rating: 'Chiến Thần', premadeGroup: 'A', isBroadcaster: false,
      recentGames: [
        { championId: 67, win: true, kills: 12, deaths: 3, assists: 8 },
        { championId: 67, win: true, kills: 7, deaths: 5, assists: 11 },
        { championId: 22, win: false, kills: 4, deaths: 8, assists: 6 },
        { championId: 67, win: true, kills: 9, deaths: 2, assists: 14 },
        { championId: 51, win: true, kills: 6, deaths: 4, assists: 9 },
      ],
    },
    {
      puuid: 'mock-blue-2', summonerId: 2, summonerName: 'Kẻ Bất Dung Thứ #JP2', championId: 157, teamParticipantId: 1, selectedPosition: 'mid',
      winRate: 62, wins: 31, total: 50, kdaNum: 2.1, avgK: 9.5, avgD: 7.8, avgA: 6.9,
      rankText: 'Đại Cao Thủ Đơn/Đôi', rankColor: '#e74c3c', rating: 'Mãnh Tướng', premadeGroup: 'A', isBroadcaster: false,
      recentGames: [
        { championId: 157, win: false, kills: 11, deaths: 9, assists: 3 },
        { championId: 157, win: true, kills: 15, deaths: 5, assists: 4 },
        { championId: 157, win: false, kills: 3, deaths: 12, assists: 2 },
        { championId: 238, win: true, kills: 8, deaths: 6, assists: 5 },
        { championId: 157, win: false, kills: 6, deaths: 10, assists: 4 },
      ],
    },
    {
      puuid: 'mock-blue-3', summonerId: 3, summonerName: 'Tiểu Thư Ánh Sáng #KR3', championId: 99, teamParticipantId: 3, selectedPosition: 'jungle',
      winRate: 55, wins: 22, total: 40, kdaNum: 4.8, avgK: 5.1, avgD: 3.2, avgA: 10.3,
      rankText: 'Cao Thủ Đơn/Đôi', rankColor: '#9b59b6', rating: 'Thần Xạ', premadeGroup: null, isBroadcaster: false,
      recentGames: [
        { championId: 99, win: true, kills: 4, deaths: 2, assists: 16 },
        { championId: 99, win: true, kills: 7, deaths: 3, assists: 12 },
        { championId: 161, win: false, kills: 3, deaths: 6, assists: 8 },
        { championId: 99, win: true, kills: 6, deaths: 4, assists: 11 },
        { championId: 143, win: false, kills: 2, deaths: 5, assists: 9 },
      ],
    },
    {
      puuid: 'mock-blue-4', summonerId: 4, summonerName: 'Thầy Tu Mù #SEA4', championId: 64, teamParticipantId: 4, selectedPosition: 'bot',
      winRate: 48, wins: 24, total: 50, kdaNum: 3.3, avgK: 7.3, avgD: 5.8, avgA: 11.8,
      rankText: 'Kim Cương II Đơn/Đôi', rankColor: '#3498db', rating: 'Tiên Phong', premadeGroup: null, isBroadcaster: false,
      recentGames: [
        { championId: 64, win: true, kills: 8, deaths: 4, assists: 14 },
        { championId: 64, win: false, kills: 5, deaths: 7, assists: 9 },
        { championId: 64, win: true, kills: 10, deaths: 3, assists: 12 },
        { championId: 120, win: true, kills: 6, deaths: 5, assists: 10 },
        { championId: 64, win: false, kills: 3, deaths: 9, assists: 7 },
      ],
    },
    {
      puuid: 'mock-blue-5', summonerId: 5, summonerName: 'Thresh #EU5', championId: 412, teamParticipantId: 5, selectedPosition: 'utility',
      winRate: 25, wins: 8, total: 32, kdaNum: 2.8, avgK: 2.1, avgD: 5.3, avgA: 12.8,
      rankText: 'Lục Bảo IV Linh Hoạt', rankColor: '#00d084', rating: 'Kiên Thủ', premadeGroup: null, isBroadcaster: false,
      recentGames: [
        { championId: 412, win: false, kills: 1, deaths: 7, assists: 14 },
        { championId: 412, win: false, kills: 3, deaths: 4, assists: 18 },
        { championId: 201, win: false, kills: 0, deaths: 8, assists: 10 },
        { championId: 412, win: true, kills: 2, deaths: 3, assists: 16 },
        { championId: 89, win: false, kills: 1, deaths: 6, assists: 9 },
      ],
    },
  ],
  redTeam: [
    {
      puuid: 'mock-red-1', summonerId: 6, summonerName: 'Chúa Tể Bóng Tối #CN6', championId: 238, teamParticipantId: 6, selectedPosition: 'top',
      winRate: 58, wins: 29, total: 50, kdaNum: 4.5, avgK: 10.2, avgD: 4.8, avgA: 11.3,
      rankText: 'Bạch Kim I Đơn/Đôi', rankColor: '#b8c4cc', rating: 'Sát Thủ', premadeGroup: 'B', isBroadcaster: false,
      recentGames: [
        { championId: 238, win: true, kills: 14, deaths: 3, assists: 6 },
        { championId: 238, win: true, kills: 11, deaths: 5, assists: 8 },
        { championId: 91, win: false, kills: 6, deaths: 9, assists: 3 },
        { championId: 238, win: true, kills: 9, deaths: 4, assists: 7 },
        { championId: 238, win: false, kills: 5, deaths: 8, assists: 4 },
      ],
    },
    {
      puuid: 'mock-red-2', summonerId: 7, summonerName: 'Hoàng Đế Sa Mạc #KR7', championId: 268, teamParticipantId: 6, selectedPosition: 'mid',
      winRate: 44, wins: 17, total: 39, kdaNum: 3.9, avgK: 6.5, avgD: 3.8, avgA: 8.3,
      rankText: 'Vàng III Đơn/Đôi', rankColor: '#c8aa6e', rating: 'Thống Soái', premadeGroup: 'B', isBroadcaster: false,
      recentGames: [
        { championId: 268, win: true, kills: 7, deaths: 3, assists: 10 },
        { championId: 268, win: false, kills: 4, deaths: 6, assists: 7 },
        { championId: 69, win: true, kills: 8, deaths: 2, assists: 9 },
        { championId: 268, win: true, kills: 5, deaths: 4, assists: 11 },
        { championId: 112, win: false, kills: 3, deaths: 7, assists: 5 },
      ],
    },
    {
      puuid: 'mock-red-3', summonerId: 8, summonerName: 'Không xác định', championId: 119, teamParticipantId: 0, selectedPosition: 'jungle',
      winRate: 35, wins: 13, total: 37, kdaNum: 2.5, avgK: 8.8, avgD: 7.2, avgA: 9.1,
      rankText: 'Bạc II Linh Hoạt', rankColor: '#a09b8c', rating: 'Dũng Mãnh', premadeGroup: null,
      recentGames: [
        { championId: 119, win: false, kills: 9, deaths: 8, assists: 5 },
        { championId: 119, win: true, kills: 14, deaths: 4, assists: 6 },
        { championId: 119, win: false, kills: 5, deaths: 10, assists: 3 },
        { championId: 22, win: true, kills: 7, deaths: 5, assists: 8 },
        { championId: 119, win: false, kills: 3, deaths: 9, assists: 4 },
      ],
      isBroadcaster: true,
    },
    {
      puuid: 'mock-red-4', summonerId: 9, summonerName: 'Xin Zhao #TW9', championId: 5, teamParticipantId: 9, selectedPosition: 'bot',
      winRate: 22, wins: 7, total: 32, kdaNum: 2.9, avgK: 6.8, avgD: 6.1, avgA: 10.9,
      rankText: 'Đồng I Đơn/Đôi', rankColor: '#cd7f32', rating: 'Xung Phong', premadeGroup: 'C', isBroadcaster: false,
      recentGames: [
        { championId: 5, win: false, kills: 8, deaths: 5, assists: 13 },
        { championId: 5, win: false, kills: 4, deaths: 8, assists: 7 },
        { championId: 120, win: false, kills: 7, deaths: 4, assists: 12 },
        { championId: 5, win: true, kills: 9, deaths: 3, assists: 11 },
        { championId: 113, win: false, kills: 3, deaths: 9, assists: 6 },
      ],
    },
    {
      puuid: 'mock-red-5', summonerId: 10, summonerName: 'Alistar #JP10', championId: 12, teamParticipantId: 9, selectedPosition: 'utility',
      winRate: 15, wins: 4, total: 27, kdaNum: 3.1, avgK: 1.8, avgD: 4.5, avgA: 12.1,
      rankText: 'Sắt IV Đơn/Đôi', rankColor: '#7e7e7e', rating: 'Kiên Thủ', premadeGroup: 'C', isBroadcaster: false,
      recentGames: [
        { championId: 12, win: false, kills: 2, deaths: 3, assists: 18 },
        { championId: 12, win: false, kills: 0, deaths: 6, assists: 11 },
        { championId: 201, win: false, kills: 1, deaths: 4, assists: 15 },
        { championId: 89, win: true, kills: 3, deaths: 5, assists: 13 },
        { championId: 12, win: false, kills: 1, deaths: 7, assists: 8 },
      ],
    },
  ],
}
