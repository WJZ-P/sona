import { useEffect, useState } from 'react'
import { SonaButton } from '@/components/ui/SonaButton'
import { checkForUpdates, getReleasePageUrl, getUpdateState, onUpdateStateChange, type UpdateState } from '@/lib/update-checker'
import '@/styles/UpdatePage.css'

const GROUP_FILE_URL = ''
const QUARK_URL = 'https://pan.quark.cn/s/72e3caf2e3d9'

function formatPublishedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

export function UpdatePage() {
  const [updateState, setUpdateState] = useState<UpdateState>(() => getUpdateState())
  const info = updateState.info

  useEffect(() => onUpdateStateChange(setUpdateState), [])

  const openUrl = (url: string) => {
    if (!url) return
    window.open(url, '_blank')
  }

  return (
    <div className="sona-update-page">
      <h2 className="sona-update-title">
        {info ? (
          <>
            检测到Sona新版本：
            <span className="sona-update-title-version">{info.currentVersion}</span>
            <span className="sona-update-title-arrow">→</span>
            <span className="sona-update-title-version sona-update-title-version--latest">{info.latestVersion}</span>
          </>
        ) : (
          '检测到Sona新版本'
        )}
      </h2>

      {info ? (
        <>
          <div className="sona-update-release">
            <div className="sona-update-release-head">
              <span>{info.releaseName}</span>
              {info.publishedAt && <time dateTime={info.publishedAt}>{formatPublishedDate(info.publishedAt)}</time>}
            </div>
            <pre className="sona-update-notes">{info.releaseBody}</pre>
          </div>

          <div className="sona-update-download">
            <h3>下载方式</h3>
            <p>请到 Release 地址、群文件或夸克网盘下载新版 Sona。</p>
            <div className="sona-update-actions">
              <SonaButton variant="primary" onClick={() => openUrl(info.releaseUrl || getReleasePageUrl())}>
                打开 Release
              </SonaButton>
              <SonaButton onClick={() => openUrl(GROUP_FILE_URL)} disabled={!GROUP_FILE_URL}>
                官方QQ群：1097295981
              </SonaButton>
              <SonaButton onClick={() => openUrl(QUARK_URL)} disabled={!QUARK_URL}>
                夸克网盘
              </SonaButton>
            </div>
          </div>
        </>
      ) : (
        <div className="sona-update-empty">
          <p>{updateState.status === 'checking' ? '正在检查更新...' : updateState.status === 'error' ? `检查更新失败：${updateState.error}` : '当前没有检测到新版本。'}</p>
          <SonaButton onClick={() => { void checkForUpdates() }}>
            重新检查
          </SonaButton>
        </div>
      )}
    </div>
  )
}
