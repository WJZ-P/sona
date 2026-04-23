import { useState, useRef, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaButton } from '@/components/ui/SonaButton'
import { SonaInput } from '@/components/ui/SonaInput'
import { store } from '@/lib/store'
import { lcu } from '@/lib/lcu'
import { searchChampions, type ChampionInfo, getChampionBalanceMeta, getAllChampionBalances } from '@/lib/assets'
import { logger } from '@/index'
import '@/styles/SettingsPage.css'

export function DebugPage() {
  const [output, setOutput] = useState('')
  const [gameId, setGameId] = useState('')
  const [puuid, setPuuid] = useState('')
  const [chatMsg, setChatMsg] = useState('')
  const [riotId, setRiotId] = useState('')
  const [skinId, setSkinId] = useState('')
  const [lobbyQueueId, setLobbyQueueId] = useState('')
  const [champSearch, setChampSearch] = useState('')
  const [champSuggestions, setChampSuggestions] = useState<ChampionInfo[]>([])
  const [showChampSuggestions, setShowChampSuggestions] = useState(false)
  const [selectedChampId, setSelectedChampId] = useState(0)
  const champRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">调试面板</h2>

      <SettingGroup title="LCU API 测试">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('获取召唤师信息', () => lcu.getSummonerInfo())}>
            获取召唤师信息
          </SonaButton>
          <SonaButton onClick={() => runAndLog('获取在线状态', () => lcu.getChatMe())}>
            获取在线状态
          </SonaButton>
          <SonaButton onClick={() => runAndLog('获取游戏流程', () => lcu.getGameflowPhase())}>
            游戏流程阶段
          </SonaButton>
          <SonaButton onClick={() => runAndLog('获取聊天会话', () => lcu.getChatConversations())}>
            聊天会话列表
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="英雄选择 (ARAM)">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('ARAM 重随', () => lcu.reroll())}>
            重随英雄
          </SonaButton>
          <SonaButton onClick={() => runAndLog('英雄选择会话', () => lcu.getChampSelectSession())}>
            选人 Session
          </SonaButton>
          <SonaButton onClick={() => runAndLog('共享池英雄', () => lcu.getBenchChampions())}>
            Bench 英雄
          </SonaButton>
          <SonaButton onClick={() => runAndLog('可选英雄列表', () => lcu.getPickableChampionIds())}>
            可选英雄
          </SonaButton>
          <SonaButton onClick={() => runAndLog('秒退（英雄选择阶段）', async () => {
            const phase = await lcu.getGameflowPhase()
            if (phase !== 'ChampSelect') {
              return `⚠️ 当前阶段为 ${phase}，仅在 ChampSelect 阶段可秒退`
            }
            await lcu.leaveLobby()
            return '✅ 已秒退选人'
          })}>
            秒退
          </SonaButton>
        </div>
        <p className="sona-subtitle">点击选取共享池对应槽位的英雄</p>
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

      <SettingGroup title="信息查询">
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={riotId}
              onChange={setRiotId}
              placeholder="名字#Tag (例: 丨一疾风剑豪一丨#77772)"
            />
          </div>
          <SonaButton onClick={() => {
            const parts = riotId.trim().split('#')
            if (parts.length !== 2 || !parts[0] || !parts[1]) { setOutput('❌ 格式: 名字#Tag'); return }
            runAndLog(`查询召唤师 ${riotId}`, () => lcu.getSummonerByRiotId(parts[0], parts[1]))
          }}>
            查询 PUUID
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="战绩查询">
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
              placeholder="输入 PUUID 查他人战绩..."
            />
          </div>
          <SonaButton onClick={() => {
            if (!puuid.trim()) { setOutput('❌ 请输入 PUUID'); return }
            runAndLog(`战绩 (${puuid.slice(0, 8)}...)`, () => lcu.getMatchHistory(puuid.trim()))
          }}>
            查询战绩
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8, alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={gameId}
              onChange={setGameId}
              placeholder="输入 Game ID..."
            />
          </div>
          <SonaButton onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ 请输入有效的 Game ID'); return }
            runAndLog(`对局详情 #${id}`, () => lcu.getMatchDetail(id))
          }}>
            对局详情
          </SonaButton>
          <SonaButton onClick={() => {
            const id = Number(gameId)
            if (!id) { setOutput('❌ 请输入有效的 Game ID'); return }
            runAndLog(`时间线 #${id}`, () => lcu.getMatchTimeline(id))
          }}>
            时间线
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="聊天调试">
        <div className="sona-debug-actions" style={{ gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={chatMsg}
              onChange={setChatMsg}
              placeholder="输入要发送到选人聊天的消息..."
            />
          </div>
          <SonaButton onClick={() => {
            if (!chatMsg.trim()) { setOutput('❌ 请输入消息'); return }
            runAndLog(`发送聊天 (${chatMsg.length}字)`, () => lcu.sendChampSelectMessage(chatMsg))
          }}>
            发送
          </SonaButton>
        </div>
        <p className="sona-subtitle">字数: {chatMsg.length}</p>
      </SettingGroup>

      <SettingGroup title="客户端操作">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => window.openDevTools()}>
            打开 DevTools
          </SonaButton>
          <SonaButton onClick={() => window.openPluginsFolder()}>
            打开插件目录
          </SonaButton>
          <SonaButton variant="secondary" onClick={() => window.reloadClient()}>
            重载客户端
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="游戏资源">
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
              placeholder="搜索英雄 (名字/称号/英文名)"
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
            查询完整数据
          </SonaButton>
        </div>
        <div className="sona-debug-actions" style={{ marginTop: 8 }}>
          <SonaButton onClick={() => runAndLog('符文列表 (perks.json)', () => lcu.getPerks())}>
            符文列表
          </SonaButton>
          <SonaButton onClick={() => runAndLog('符文系 (perkstyles.json)', () => lcu.getPerkStyles())}>
            符文系
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

      <SettingGroup title="回放调试">
        <div className="sona-debug-actions" style={{ alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <SonaInput
              value={gameId}
              onChange={setGameId}
              placeholder="输入 Game ID..."
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
            直接观看
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
            下载
          </SonaButton>
        </div>
      </SettingGroup>

      <SettingGroup title="荣誉 & 点赞">
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

      <SettingGroup title="房间 & 组队">
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
              placeholder="输入 Queue ID (如 450=大乱斗)"
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

      <SettingGroup title="头像框 & 头像">
        <div className="sona-debug-actions">
          <SonaButton onClick={() => runAndLog('Regalia v2', async () => {
            const res = await fetch('/lol-regalia/v2/current-summoner/regalia'); return res.json()
          })}>
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


      <SettingGroup title="生涯背景">
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
              placeholder="输入皮肤 ID (如 777058)"
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

      <SettingGroup title="客户端配置">
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

      <SettingGroup title="区域 & 炫彩">
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

      <SettingGroup title="Store 调试">
        <SettingCard title="当前配置快照" description="查看所有持久化配置的当前值">
          <SonaButton onClick={() => setOutput(JSON.stringify(store.getAll(), null, 2))}>
            查看
          </SonaButton>
        </SettingCard>
        <SettingCard title="重置所有配置" description="将所有配置恢复为默认值">
          <SonaButton variant="secondary" onClick={() => { store.resetAll(); setOutput('✅ 已重置所有配置') }}>
            重置
          </SonaButton>
        </SettingCard>
      </SettingGroup>

      {/* 输出区 */}
      {output && (
        <div className="sona-debug-output">
          <pre>{output}</pre>
        </div>
      )}
    </div>
  )
}
