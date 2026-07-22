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
      setOutput(`❌ 请选择图片文件，当前文件类型: ${file.type || '未知'}`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setOutput('❌ 图片读取失败：FileReader 没有返回可用的 Data URL')
        return
      }

      setBeautifyImagePreview({
        src: reader.result,
        name: file.name,
        type: file.type,
        size: file.size,
      })
      setOutput(`✅ 已读取图片\n${file.name}\n${file.type} · ${formatBytes(file.size)}`)
    }
    reader.onerror = () => {
      setOutput(`❌ 图片读取失败\n${reader.error?.message ?? '未知错误'}`)
    }
    reader.readAsDataURL(file)
  }

  const testImageHostingUpload = async () => {
    const assetPath = imageHostingAssetPath.trim()
    if (!assetPath) throw new Error('请输入 assets 目录下的图片相对路径')

    const assetUrl = resolvePluginAssetUrl(assetPath)
    console.info('[Sona][ImageHosting] 开始读取插件资源', { source: 'plugin-assets' })

    try {
      const response = await fetch(assetUrl)
      if (!response.ok) {
        throw new Error(`读取插件资源失败: ${response.status} ${response.statusText}`)
      }

      const image = await response.blob()
      const fileName = assetPath.replace(/\\/g, '/').split('/').filter(Boolean).at(-1) || 'sona-debug-image.png'
      if (!image.type.startsWith('image/')) {
        console.warn('[Sona][ImageHosting] 资源响应不是 image/*，将按文件扩展名继续测试', {
          responseContentType: image.type || '(empty)',
        })
      }

      return await uploadImageToHostingServiceForDebug(image, fileName)
    } catch (err) {
      console.error('[Sona][ImageHosting] 上传链路失败', err)
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
          ? '请求超时。可能是网络不可达，或客户端环境阻止了外部请求。'
          : '如果这里是 Failed to fetch / NetworkError，且 DevTools Console 有 CORS 字样，说明 Pengu 注入页不能直接请求 OP.GG 接口。',
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
          ? '请求超时。可能是网络不可达，或客户端环境阻止了外部请求。'
          : '如果这里是 Failed to fetch / NetworkError，且 DevTools Console 有 CORS 字样，说明当前注入页不能直接请求 OP.GG 接口。',
      }
    } finally {
      window.clearTimeout(timer)
    }
  }

  const fetchCorsTestUrl = async () => {
    const rawUrl = corsTestUrl.trim()
    if (!rawUrl) throw new Error('请输入要测试的 URL')

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
          ? '请求超时。可能是网络不可达，或目标站点响应太慢。'
          : '如果这里是 Failed to fetch / NetworkError，且 DevTools Console 有 CORS 字样，说明当前注入页不能直接跨域请求这个 URL。',
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
      return { source, ok: false, error: '没有拿到可用 token' }
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
          ? '请求超时。'
          : '如果是 Failed to fetch / NetworkError，可能是 CORS 或客户端环境阻止了直接请求 auth.riotgames.com。',
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
        '这些 token 只用于本地调试，不要发给别人。',
        '优先把 /lol-rso-auth/v1/authorization/access-token 的 token 填进 test/riot-userinfo.mjs 测试。',
        '如果 Vercel/Node 脚本返回 200，后续服务端鉴权可以用对应 token 请求 Riot UserInfo。',
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
    logger.info('[Sona][DodgeDebug] 当前 Gameflow 阶段: %s', phase)

    if (phase !== 'ChampSelect') {
      throw new Error(`当前阶段为 ${phase}，仅在 ChampSelect 阶段允许发送秒退请求`)
    }

    const endpoint = '/lol-login/v1/session/invoke (lcdsServiceProxy → teambuilder-draft.quitV2)'
    logger.info('[Sona][DodgeDebug] 即将调用 %s', endpoint)
    const response = await lcu.dodgeChampSelectViaQuitV2()
    const result = {
      success: true,
      phase,
      endpoint,
      response: response ?? null,
    }
    logger.info('[Sona][DodgeDebug] quitV2 请求完成 ↓\n%o', result)
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
          图床链路测试：输入 assets 目录下的图片相对路径，控制台会输出脱敏后的分阶段信息。
        </p>
        <div className="sona-debug-actions" style={{ alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <SonaInput
              value={imageHostingAssetPath}
              onChange={setImageHostingAssetPath}
              placeholder="例如：test/avatar.png 或 assets/test/avatar.png"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void runAndLog('图床上传测试', testImageHostingUpload)
                }
              }}
            />
          </div>
          <SonaButton
            variant="primary"
            onClick={() => runAndLog('图床上传测试', testImageHostingUpload)}
          >
            上传到图床
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.lcu')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('获取召唤师信息', () => lcu.getSummonerInfo())}>
            {t('debug.action.summonerInfo')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('获取在线状态', () => lcu.getChatMe())}>
            {t('debug.action.chatMe')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('获取游戏流程', () => lcu.getGameflowPhase())}>
            {t('debug.action.gameflow')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('获取聊天会话', () => lcu.getChatConversations())}>
            {t('debug.action.chatSessions')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('旗帜库存 (REGALIA_BANNER)', fetchRegaliaBanners)}>
            {t('debug.action.bannerInventory')}
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.champSelect')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('ARAM 重随', () => lcu.reroll())}>
            {t('debug.action.reroll')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('英雄选择会话', () => lcu.getChampSelectSession())}>
            {t('debug.action.champSession')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('GameFlow Session', () => lcu.getGameflowSession())}>
            GameFlow Session
          </SonaButton>
          <SonaButton onClick={() => runAndLog('共享池英雄', () => lcu.getBenchChampions())}>
            {t('debug.action.bench')}
          </SonaButton>
          <SonaButton onClick={() => runAndLog('可选英雄列表', () => lcu.getPickableChampionIds())}>
            {t('debug.action.pickable')}
          </SonaButton>
          <SonaButton variant="secondary" onClick={() => {
            if (!window.confirm(t('debug.confirm.dodgeQuitV2'))) {
              setOutput('已取消 quitV2 秒退测试')
              return
            }
            void runAndLog('quitV2 秒退测试', testChampSelectDodgeViaQuitV2)
          }}>
            {t('debug.action.dodgeQuitV2')}
          </SonaButton>
        </div>
        <p className="sona-subtitle">{t('debug.hint.dodgeQuitV2')}</p>
        <p className="sona-subtitle">{t('debug.hint.benchSlots')}</p>
        <div className="sona-debug-actions">
          {Array.from({ length: 10 }, (_, i) => (
            <SonaButton key={i} style={{ minWidth: 40, padding: '6px 0' }} onClick={() => runAndLog(`Bench 换英雄 (槽位 ${i + 1})`, async () => {
              const bench = await lcu.getBenchChampions()
              if (i >= bench.length) throw new Error(`槽位 ${i + 1} 不存在，当前 Bench 共 ${bench.length} 个英雄`)
              const target = bench[i]
              logger.info('尝试换取槽位 %d 的英雄 → championId: %d', i + 1, target.championId)
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
            if (parts.length !== 2 || !parts[0] || !parts[1]) { setOutput('❌ 格式: 名字#Tag'); return }
            runAndLog(`查询召唤师 ${riotId}`, () => lcu.getSummonerByRiotId(parts[0], parts[1]))
          }}>
            {t('debug.action.queryPuuid')}
          </SonaButton>
          <SonaButton onClick={() => {
            const parts = riotId.trim().split('#')
            if (parts.length !== 2 || !parts[0] || !parts[1]) { setOutput('❌ 格式: 名字#Tag'); return }
            runAndLog(`跨大区解析 puuid ${riotId}`, async () => {
              const resolved = await lcu.resolveSummonerPuuidByRiotId(parts[0], parts[1])
              return resolved ? { riotId, puuid: resolved } : `❌ 未找到（含国服全大区搜集）: ${riotId}`
            })
          }}>
            跨大区解析 puuid
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.matchHistory')}>
        <div className="sona-debug-actions">
          <SonaButton variant="primary" onClick={() => runAndLog('贪婪拉取 100 条战绩', async () => {
            const me = await lcu.getSummonerInfo()
            const puuid = me.puuid
            if (!puuid) return '❌ 无法获取 PUUID'

            const page = await lcu.getMatchHistory(puuid, 0, 99)
            const games = page.games?.games || []
            return { total: games.length, games }
          })}>
            贪婪拉取战绩 (100场)
          </SonaButton>
          <SonaButton onClick={() => runAndLog('最近一起玩的人', () => lcu.getRecentlyPlayedSummoners())}>
            最近队友
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
            if (!puuid.trim()) { setOutput('❌ 请输入 PUUID'); return }
            runAndLog(`战绩 (${puuid.slice(0, 8)}...)`, () => lcu.getMatchHistory(puuid.trim()))
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
            if (!id) { setOutput('❌ 请输入有效的 Game ID'); return }
            runAndLog(`对局详情 #${id}`, () => lcu.getMatchDetail(id))
          }}>
            {t('debug.action.matchDetail')}
          </SonaButton>
          <SonaButton onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ 请输入有效的 Game ID'); return }
            runAndLog(`时间线 #${id}`, () => lcu.getMatchTimeline(id))
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
            获取 Entitlements Token
          </SonaButton>
          <SonaButton onClick={() => runAndLog('League Session Token', () => lcu.getLeagueSessionToken())}>
            获取 Session Token
          </SonaButton>
          <SonaButton onClick={() => runAndLog('收集 UserInfo Token 候选', collectUserinfoTokenCandidates)}>
            收集 UserInfo Token
          </SonaButton>
          <SonaButton variant="primary" onClick={() => runAndLog('Riot UserInfo 鉴权测试', testRiotUserinfoAuth)}>
            测试 UserInfo 鉴权
          </SonaButton>
          <SonaButton onClick={() => runAndLog('SGP Server ID (从 issuer 解析)', () => lcu.getSgpServerId())}>
            解析 SGP Server ID
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('SGP 直连: 自己战绩', async () => {
            const [tokenRes, me, sgpServerId] = await Promise.all([
              lcu.getEntitlementsToken(),
              lcu.getSummonerInfo(),
              lcu.getSgpServerId(),
            ])
            const sgpServer = SGP_SERVERS[sgpServerId.toUpperCase()]
            const baseUrl = sgpServer?.matchHistory
            if (!baseUrl) {
              return { error: `未知 SGP 服务器 ID: ${sgpServerId}`, issuer: tokenRes.issuer, sgpServerId }
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
              result.hint = '如果看到 CORS/Network 错误，说明 CEF 浏览器拦截了跨域请求，SGP 直连走不通'
            }
            return result
          })}>
            SGP 直连: 自己战绩
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
          <SonaButton variant="primary" onClick={() => runAndLog('跨域 GET 测试', fetchCorsTestUrl)}>
            GET 测试
          </SonaButton>
        </div>
        <div className="sona-debug-actions">
          <SonaButton variant="primary" onClick={() => runAndLog('OP.GG 版本接口连通性', testOpggConnectivity)}>
            测试 OP.GG API
          </SonaButton>
          <SonaButton onClick={() => runAndLog('OP.GG ranked 版本列表', () =>
            fetchOpggJson('/api/global/champions/ranked/versions')
          )}>
            ranked 版本
          </SonaButton>
          <SonaButton onClick={() => runAndLog('OP.GG ranked 英雄列表', () =>
            fetchOpggJson('/api/global/champions/ranked', { tier: 'platinum_plus' })
          )}>
            ranked 列表
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('OP.GG 单英雄 ranked', async () => {
            const id = await getOpggDebugChampionId()
            return fetchOpggJson(`/api/global/champions/ranked/${id}/mid`, { tier: 'platinum_plus' })
          })}>
            单英雄 ranked
          </SonaButton>
          <SonaButton variant="primary" onClick={() => runAndLog('OP.GG 配装字段 ranked/mid', fetchOpggDebugBuildData)}>
            配装字段
          </SonaButton>
          <SonaButton onClick={() => runAndLog('OP.GG 单英雄 ARAM', async () => {
            const id = await getOpggDebugChampionId()
            return fetchOpggJson(`/api/global/champions/aram/${id}/none`, { tier: 'platinum_plus' })
          })}>
            单英雄 ARAM
          </SonaButton>
          <SonaButton onClick={() => runAndLog('OP.GG 单英雄 Arena', async () => {
            const id = await getOpggDebugChampionId()
            return fetchOpggJson(`/api/global/champions/arena/${id}`, { tier: 'all' })
          })}>
            单英雄 Arena
          </SonaButton>
          <SonaButton onClick={() => runAndLog('OP.GG ARAM Balance', () =>
            fetchOpggJson('/api/contents/aram-balance')
          )}>
            ARAM Balance
          </SonaButton>
          <SonaButton onClick={() => runAndLog('ARAMGG 海克斯原始统计', fetchAramggAugmentsStats)}>
            ARAMGG 海克斯统计
          </SonaButton>
          <SonaButton onClick={() => runAndLog('ARAMGG 海克斯中文信息', fetchAramggMayhemAugmentsZhCn)}>
            ARAMGG 海克斯中文
          </SonaButton>
          <div ref={opggPanelButtonRef} style={{ display: 'inline-block' }}>
            <SonaButton onClick={async () => {
              const anchor = opggPanelButtonRef.current
              if (!anchor) return

              try {
                const id = await getOpggDebugChampionId()
                await openOpggBuildRecommendationDebugPanel(anchor, id)
                setOutput(`✅ 已拉起 OP.GG 配装推荐面板\nchampionId=${id} · KIWI · queueId=3100`)
              } catch (err) {
                setOutput(`❌ 拉起 OP.GG 配装推荐面板失败\n${err instanceof Error ? err.message : String(err)}`)
              }
            }}>
              拉起配装推荐面板
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
              setOutput(`✅ 已拉起 OP.GG 配装推荐面板\nchampionId=${id} · ranked/mid · queueId=420`)
            } catch (err) {
              setOutput(`❌ 拉起 ranked 配装推荐面板失败\n${err instanceof Error ? err.message : String(err)}`)
            }
          }}>
            拉起 ranked 面板
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
              { value: 'chat', label: 'chat (所有人可见)' },
              { value: 'celebration', label: 'celebration (仅自己可见)' },
              { value: 'system', label: 'system (仅自己可见)' },
              { value: 'information', label: 'information (仅自己可见)' },
            ]}
          />
          <SonaButton onClick={() => {
            if (!chatMsg.trim()) { setOutput('❌ 请输入消息'); return }
            runAndLog(`发送聊天 [${chatMsgType}] (${chatMsg.length}字)`, () => lcu.sendChampSelectMessage(chatMsg, chatMsgType))
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
          <SonaButton onClick={() => runAndLog('物品列表 (items.json)', () => lcu.getItems())}>
            物品图标
          </SonaButton>
          <SonaButton onClick={() => runAndLog('召唤师技能 (summoner-spells.json)', () => lcu.getSummonerSpells())}>
            技能图标
          </SonaButton>
          <SonaButton onClick={() => runAndLog('英雄摘要 (champion-summary.json)', () => lcu.getChampionSummary())}>
            英雄摘要数据
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
            if (!selectedChampId) { setOutput('❌ 请先选择一个英雄'); return }
            runAndLog(`英雄完整数据 #${selectedChampId}`, async () => {
              const res = await fetch(`/lol-game-data/assets/v1/champions/${selectedChampId}.json`); return res.json()
            })
          }}>
            {t('debug.action.fullChampionData')}
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('符文列表 (perks.json)', () => lcu.getPerks())}>
            符文列表
          </SonaButton>
          <SonaButton onClick={() => runAndLog('符文系 (perkstyles.json)', () => lcu.getPerkStyles())}>
            符文系
          </SonaButton>
          <SonaButton onClick={() => runAndLog('海克斯选择 (cherry-augments.json)', () => lcu.getAugments())}>
          海克斯选择
          </SonaButton>
          <SonaButton onClick={() => runAndLog('好友列表 (friends)', () => lcu.getFriends())}>
            好友列表
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('队列列表 (queues)', () => lcu.getQueues())}>
            队列列表
          </SonaButton>
          <SonaButton onClick={() => runAndLog('游戏模式 (game-type-config)', () => lcu.getGameModes())}>
            游戏模式
          </SonaButton>
          <SonaButton onClick={() => runAndLog('地图信息 (maps)', () => lcu.getMaps())}>
            地图信息
          </SonaButton>
          <SonaButton onClick={() => runAndLog('地图资源 (maps.json)', () => lcu.getMapAssets())}>
            地图资源
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
            if (!id) { setOutput('❌ 请输入 Game ID'); return }
            runAndLog(`回放元数据 #${id}`, async () => {
              const res = await fetch(`/lol-replays/v1/metadata/${id}`); return res.ok ? res.json() : `❌ ${res.status} ${await res.text()}`
            })
          }}>
            查状态
          </SonaButton>
          <SonaButton onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ 请输入 Game ID'); return }
            runAndLog(`直接观看 #${id} (不下载)`, async () => {
              const res = await fetch(`/lol-replays/v1/rofls/${id}/watch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ componentType: 'replay', contextData: 'match-history' }),
              })
              return res.ok ? '✅ 已发送观看请求' : `❌ ${res.status} ${await res.text()}`
            })
          }}>
            {t('debug.action.watchDirectly')}
          </SonaButton>
          <SonaButton variant="secondary" onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ 请输入 Game ID'); return }
            runAndLog(`下载回放 #${id}`, async () => {
              const res = await fetch(`/lol-replays/v1/rofls/${id}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ componentType: 'replay', contextData: 'match-history' }),
              })
              return res.ok ? '✅ 已发送下载请求' : `❌ ${res.status} ${await res.text()}`
            })
          }}>
            {t('debug.action.download')}
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.honor')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('荣誉选票 (ballot)', async () => {
            const res = await fetch('/lol-honor-v2/v1/ballot'); return res.json()
          })}>
            查看选票
          </SonaButton>
          <SonaButton onClick={() => runAndLog('荣誉配置', async () => {
            const res = await fetch('/lol-honor-v2/v1/config'); return res.json()
          })}>
            荣誉配置
          </SonaButton>
          <SonaButton onClick={() => runAndLog('最近荣誉', async () => {
            const res = await fetch('/lol-honor-v2/v1/latest-eligible-game'); return res.json()
          })}>
            最近可荣誉
          </SonaButton>
          <SonaButton variant="primary" onClick={() => runAndLog('随机点赞全部票数', async () => {
            const ballotRes = await fetch('/lol-honor-v2/v1/ballot')
            if (!ballotRes.ok) return `❌ 当前没有待点赞对局 ${ballotRes.status}`
            const ballot = await ballotRes.json()
            const allies = ballot.eligibleAllies || []
            if (allies.length === 0) return '⚠️ 没有可点赞的队友'
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
            随机点赞
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.lobby')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('房间信息 (lobby)', async () => {
            const res = await fetch('/lol-lobby/v2/lobby'); return res.json()
          })}>
            房间信息
          </SonaButton>
          <SonaButton onClick={() => runAndLog('房间成员 (members)', async () => {
            const res = await fetch('/lol-lobby/v2/lobby/members'); return res.json()
          })}>
            成员列表
          </SonaButton>
          <SonaButton onClick={() => runAndLog('邀请列表 (invitations)', async () => {
            const res = await fetch('/lol-lobby/v2/lobby/invitations'); return res.json()
          })}>
            邀请列表
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
            if (!id) { setOutput('❌ 请输入有效的 Queue ID'); return }
            runAndLog(`创建房间 queueId=${id}`, () => lcu.createLobby(id))
          }}>
            创建房间
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.avatar')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Regalia v2', () => lcu.getRegalia())}>
            查看 Regalia
          </SonaButton>
          <SonaButton onClick={() => runAndLog('当前头像', async () => {
            const res = await fetch('/lol-summoner/v1/current-summoner'); return res.json()
          })}>
            当前召唤师
          </SonaButton>
          <SonaButton variant="primary" onClick={() => runAndLog('恢复默认头像 (id=29)', async () => {
            const res = await fetch('/lol-summoner/v1/current-summoner/icon', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profileIconId: 29 }),
            }); return res.json()
          })}>
            恢复默认头像
          </SonaButton>
        </div>
      </SettingGroup>


      <SettingGroup title={t('debug.group.profileBg')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('summoner-profile', async () => {
            const res = await fetch('/lol-summoner/v1/current-summoner/summoner-profile'); return res.json()
          })}>
            当前 Profile
          </SonaButton>
          <SonaButton onClick={() => runAndLog('backdrop', async () => {
            const res = await fetch('/lol-collections/v1/inventories/local/backdrop'); return res.json()
          })}>
            Backdrop
          </SonaButton>
          <SonaButton onClick={() => runAndLog('获取皮肤库存', async () => {
            const meRes = await fetch('/lol-summoner/v1/current-summoner')
            if (!meRes.ok) return '❌ 获取个人信息失败'
            const me = await meRes.json()
            const skinsRes = await fetch(`/lol-champions/v1/inventories/${me.summonerId}/skins-minimal`)
            if (!skinsRes.ok) return `❌ ${skinsRes.status} 获取皮肤失败`
            const skins = await skinsRes.json()
            const ownedSkins = skins.filter((s: { ownership?: { owned?: boolean } }) => s.ownership?.owned)
            return ownedSkins
          })}>
            皮肤库存
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
            if (!id && id !== 0) { setOutput('❌ 请输入有效的皮肤 ID'); return }
            runAndLog(`设置生涯背景 skinId=${id}`, async () => {
              const postRes = await fetch('/lol-summoner/v1/current-summoner/summoner-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'backgroundSkinId', value: id }),
              })
              return postRes.ok ? `✅ 背景已设置为 ${id}` : `❌ ${postRes.status} ${await postRes.text()}`
            })
          }}>
            设置背景
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.clientConfig')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('常规设置 (game-settings)', () => lcu.getGameSettings())}>
            常规设置
          </SonaButton>
          <SonaButton onClick={() => runAndLog('热键设置 (input-settings)', () => lcu.getInputSettings())}>
            热键设置
          </SonaButton>
          <SonaButton onClick={() => runAndLog('游戏版本 (game-version)', () => lcu.getGameVersion())}>
            游戏版本
          </SonaButton>
          <SonaButton onClick={() => runAndLog('英雄平衡数据 (meta + count)', () =>
            Promise.resolve({ meta: getChampionBalanceMeta(), count: getAllChampionBalances().length })
          )}>
            英雄平衡数据
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.region')}>
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('区域语言', async () => {
            const res = await fetch('/riotclient/region-locale'); return res.json()
          })}>
            区域语言
          </SonaButton>
          <SonaButton onClick={() => runAndLog('炫彩目录', async () => {
            const res = await fetch('/lol-store/v1/catalog?inventoryType=CHROMA'); return res.json()
          })}>
            炫彩目录
          </SonaButton>
          <SonaButton onClick={() => runAndLog('功能开关', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces/FeatureToggles'); return res.json()
          })}>
            功能开关
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('配置命名空间', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces'); return res.json()
          })}>
            配置命名空间
          </SonaButton>
          <SonaButton onClick={() => runAndLog('Chromas 配置', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces/Chromas'); return res.json()
          })}>
            Chromas 配置
          </SonaButton>
          <SonaButton onClick={() => runAndLog('商店配置', async () => {
            const res = await fetch('/lol-platform-config/v3/namespaces/LcuStore'); return res.json()
          })}>
            商店配置
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title={t('debug.group.store')}>
        <SettingCard title="当前配置快照" description="查看所有持久化配置的当前值">
          <SonaButton onClick={() => setOutput(JSON.stringify(store.getAll(), null, 2))}>
            {t('debug.action.view')}
          </SonaButton>
        </SettingCard>
        <SettingCard title="重置所有配置" description="将所有配置恢复为默认值">
          <SonaButton variant="secondary" onClick={() => { store.resetAll(); setOutput('✅ 已重置所有配置') }}>
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
    queueName: '排位赛 单双排',
    gameMode: 'CLASSIC',
    mapName: '召唤师峡谷',
    isBlueTeam: true,
    queueId: 420,
  },
  blueTeam: [
    {
      puuid: 'mock-blue-1', summonerId: 1, summonerName: '暗夜猎手 #CN1', championId: 67, teamParticipantId: 1, selectedPosition: 'top',
      winRate: 75, wins: 30, total: 40, kdaNum: 5.2, avgK: 8.2, avgD: 4.1, avgA: 13.1,
      rankText: '最强王者 单双', rankColor: '#f1c40f', rating: '战神', premadeGroup: 'A', isBroadcaster: false,
      recentGames: [
        { championId: 67, win: true, kills: 12, deaths: 3, assists: 8 },
        { championId: 67, win: true, kills: 7, deaths: 5, assists: 11 },
        { championId: 22, win: false, kills: 4, deaths: 8, assists: 6 },
        { championId: 67, win: true, kills: 9, deaths: 2, assists: 14 },
        { championId: 51, win: true, kills: 6, deaths: 4, assists: 9 },
      ],
    },
    {
      puuid: 'mock-blue-2', summonerId: 2, summonerName: '疾风剑豪 #JP2', championId: 157, teamParticipantId: 1, selectedPosition: 'mid',
      winRate: 62, wins: 31, total: 50, kdaNum: 2.1, avgK: 9.5, avgD: 7.8, avgA: 6.9,
      rankText: '傲世宗师 单双', rankColor: '#e74c3c', rating: '猛将', premadeGroup: 'A', isBroadcaster: false,
      recentGames: [
        { championId: 157, win: false, kills: 11, deaths: 9, assists: 3 },
        { championId: 157, win: true, kills: 15, deaths: 5, assists: 4 },
        { championId: 157, win: false, kills: 3, deaths: 12, assists: 2 },
        { championId: 238, win: true, kills: 8, deaths: 6, assists: 5 },
        { championId: 157, win: false, kills: 6, deaths: 10, assists: 4 },
      ],
    },
    {
      puuid: 'mock-blue-3', summonerId: 3, summonerName: '光辉女郎 #KR3', championId: 99, teamParticipantId: 3, selectedPosition: 'jungle',
      winRate: 55, wins: 22, total: 40, kdaNum: 4.8, avgK: 5.1, avgD: 3.2, avgA: 10.3,
      rankText: '超凡大师 单双', rankColor: '#9b59b6', rating: '神射', premadeGroup: null, isBroadcaster: false,
      recentGames: [
        { championId: 99, win: true, kills: 4, deaths: 2, assists: 16 },
        { championId: 99, win: true, kills: 7, deaths: 3, assists: 12 },
        { championId: 161, win: false, kills: 3, deaths: 6, assists: 8 },
        { championId: 99, win: true, kills: 6, deaths: 4, assists: 11 },
        { championId: 143, win: false, kills: 2, deaths: 5, assists: 9 },
      ],
    },
    {
      puuid: 'mock-blue-4', summonerId: 4, summonerName: '盲僧 #SEA4', championId: 64, teamParticipantId: 4, selectedPosition: 'bot',
      winRate: 48, wins: 24, total: 50, kdaNum: 3.3, avgK: 7.3, avgD: 5.8, avgA: 11.8,
      rankText: '璀璨钻石 II 单双', rankColor: '#3498db', rating: '先锋', premadeGroup: null, isBroadcaster: false,
      recentGames: [
        { championId: 64, win: true, kills: 8, deaths: 4, assists: 14 },
        { championId: 64, win: false, kills: 5, deaths: 7, assists: 9 },
        { championId: 64, win: true, kills: 10, deaths: 3, assists: 12 },
        { championId: 120, win: true, kills: 6, deaths: 5, assists: 10 },
        { championId: 64, win: false, kills: 3, deaths: 9, assists: 7 },
      ],
    },
    {
      puuid: 'mock-blue-5', summonerId: 5, summonerName: '锤石 #EU5', championId: 412, teamParticipantId: 5, selectedPosition: 'utility',
      winRate: 25, wins: 8, total: 32, kdaNum: 2.8, avgK: 2.1, avgD: 5.3, avgA: 12.8,
      rankText: '流光翡翠 IV 灵活', rankColor: '#00d084', rating: '坚守', premadeGroup: null, isBroadcaster: false,
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
      puuid: 'mock-red-1', summonerId: 6, summonerName: '影流之主 #CN6', championId: 238, teamParticipantId: 6, selectedPosition: 'top',
      winRate: 58, wins: 29, total: 50, kdaNum: 4.5, avgK: 10.2, avgD: 4.8, avgA: 11.3,
      rankText: '华贵铂金 I 单双', rankColor: '#b8c4cc', rating: '刺客', premadeGroup: 'B', isBroadcaster: false,
      recentGames: [
        { championId: 238, win: true, kills: 14, deaths: 3, assists: 6 },
        { championId: 238, win: true, kills: 11, deaths: 5, assists: 8 },
        { championId: 91, win: false, kills: 6, deaths: 9, assists: 3 },
        { championId: 238, win: true, kills: 9, deaths: 4, assists: 7 },
        { championId: 238, win: false, kills: 5, deaths: 8, assists: 4 },
      ],
    },
    {
      puuid: 'mock-red-2', summonerId: 7, summonerName: '沙漠皇帝 #KR7', championId: 268, teamParticipantId: 6, selectedPosition: 'mid',
      winRate: 44, wins: 17, total: 39, kdaNum: 3.9, avgK: 6.5, avgD: 3.8, avgA: 8.3,
      rankText: '荣耀黄金 III 单双', rankColor: '#c8aa6e', rating: '统帅', premadeGroup: 'B', isBroadcaster: false,
      recentGames: [
        { championId: 268, win: true, kills: 7, deaths: 3, assists: 10 },
        { championId: 268, win: false, kills: 4, deaths: 6, assists: 7 },
        { championId: 69, win: true, kills: 8, deaths: 2, assists: 9 },
        { championId: 268, win: true, kills: 5, deaths: 4, assists: 11 },
        { championId: 112, win: false, kills: 3, deaths: 7, assists: 5 },
      ],
    },
    {
      puuid: 'mock-red-3', summonerId: 8, summonerName: '未知', championId: 119, teamParticipantId: 0, selectedPosition: 'jungle',
      winRate: 35, wins: 13, total: 37, kdaNum: 2.5, avgK: 8.8, avgD: 7.2, avgA: 9.1,
      rankText: '不屈白银 II 灵活', rankColor: '#a09b8c', rating: '勇武', premadeGroup: null,
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
      puuid: 'mock-red-4', summonerId: 9, summonerName: '赵信 #TW9', championId: 5, teamParticipantId: 9, selectedPosition: 'bot',
      winRate: 22, wins: 7, total: 32, kdaNum: 2.9, avgK: 6.8, avgD: 6.1, avgA: 10.9,
      rankText: '英勇青铜 I 单双', rankColor: '#cd7f32', rating: '冲锋', premadeGroup: 'C', isBroadcaster: false,
      recentGames: [
        { championId: 5, win: false, kills: 8, deaths: 5, assists: 13 },
        { championId: 5, win: false, kills: 4, deaths: 8, assists: 7 },
        { championId: 120, win: false, kills: 7, deaths: 4, assists: 12 },
        { championId: 5, win: true, kills: 9, deaths: 3, assists: 11 },
        { championId: 113, win: false, kills: 3, deaths: 9, assists: 6 },
      ],
    },
    {
      puuid: 'mock-red-5', summonerId: 10, summonerName: '牛头 #JP10', championId: 12, teamParticipantId: 9, selectedPosition: 'utility',
      winRate: 15, wins: 4, total: 27, kdaNum: 3.1, avgK: 1.8, avgD: 4.5, avgA: 12.1,
      rankText: '坚韧黑铁 IV 单双', rankColor: '#7e7e7e', rating: '坚守', premadeGroup: 'C', isBroadcaster: false,
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
