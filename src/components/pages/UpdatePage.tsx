import { useEffect, useState } from 'react'
import { SonaButton } from '@/components/ui/SonaButton'
import { checkForUpdates, getReleasePageUrl, getUpdateState, onUpdateStateChange, type UpdateState } from '@/lib/update-checker'
import { useI18n } from '@/lib/i18n'
import '@/styles/UpdatePage.css'

const GROUP_FILE_URL = ''
const QUARK_URL = 'https://pan.quark.cn/s/72e3caf2e3d9'

function formatPublishedDate(value: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return t('update.date', { year, month, day })
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
              {info.publishedAt && <time dateTime={info.publishedAt}>{formatPublishedDate(info.publishedAt, t)}</time>}
            </div>
            <pre className="sona-update-notes">{info.releaseBody}</pre>
          </div>

          <div className="sona-update-download">
            <h3>{t('update.downloadMethods')}</h3>
            <p>{t('update.downloadDesc')}</p>
            <div className="sona-update-actions">
              <SonaButton variant="primary" onClick={() => openUrl(info.releaseUrl || getReleasePageUrl())}>
                {t('update.openRelease')}
              </SonaButton>
              <SonaButton onClick={() => openUrl(GROUP_FILE_URL)} disabled={!GROUP_FILE_URL}>
                {t('update.officialGroup')}
              </SonaButton>
              <SonaButton onClick={() => openUrl(QUARK_URL)} disabled={!QUARK_URL}>
                {t('update.quark')}
              </SonaButton>
            </div>
          </div>
        </>
      ) : (
        <div className="sona-update-empty">
          <p>{updateState.status === 'checking' ? t('update.checking') : updateState.status === 'error' ? t('update.checkFailed', { error: updateState.error ?? '' }) : t('update.noUpdate')}</p>
          <SonaButton onClick={() => { void checkForUpdates() }}>
            {t('update.checkAgain')}
          </SonaButton>
        </div>
      )}
    </div>
  )
}
