import { useEffect, useState } from 'react'
import { SonaButton } from '@/components/ui/SonaButton'
import { checkForUpdates, getReleasePageUrl, getUpdateState, onUpdateStateChange, skipUpdateVersion, type UpdateState } from '@/lib/update-checker'
import { useI18n } from '@/i18n'
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
  const { t } = useI18n()
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
            {t('update.titleWithVersion')}
            <span className="sona-update-title-version">{info.currentVersion}</span>
            <span className="sona-update-title-arrow">→</span>
            <span className="sona-update-title-version sona-update-title-version--latest">{info.latestVersion}</span>
          </>
        ) : (
          t('update.title')
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
            <h3>{t('update.downloadTitle')}</h3>
            <p>{t('update.downloadDescription')}</p>
            <div className="sona-update-actions">
              <SonaButton variant="primary" onClick={() => openUrl(info.releaseUrl || getReleasePageUrl())}>
                {t('update.openRelease')}
              </SonaButton>
              <SonaButton onClick={() => openUrl(GROUP_FILE_URL)} disabled={!GROUP_FILE_URL}>
                {t('update.groupFile')}
              </SonaButton>
              <SonaButton onClick={() => openUrl(QUARK_URL)} disabled={!QUARK_URL}>
                {t('update.quark')}
              </SonaButton>
              <SonaButton onClick={() => skipUpdateVersion(info.latestVersion)}>
                {t('update.skipVersion', { version: info.latestVersion })}
              </SonaButton>
            </div>
          </div>
        </>
      ) : (
        <div className="sona-update-empty">
          <p>{updateState.status === 'checking' ? t('update.checking') : updateState.status === 'error' ? t('update.checkFailed', { error: updateState.error ?? '' }) : t('update.none')}</p>
          <SonaButton onClick={() => { void checkForUpdates() }}>
            {t('update.recheck')}
          </SonaButton>
        </div>
      )}
    </div>
  )
}
