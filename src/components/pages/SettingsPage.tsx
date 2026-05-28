import { useState, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { SonaButton } from '@/components/ui/SonaButton'
import { store } from '@/lib/store'
import { checkForUpdates, clearSkippedUpdateVersion } from '@/lib/update-checker'
import { useI18n, type SonaLocaleSetting } from '@/i18n'
import '@/styles/SettingsPage.css'

const hotkeyOptions = [
  { value: 'F1', label: 'F1' },
  { value: 'F2', label: 'F2' },
  { value: 'F3', label: 'F3' },
  { value: 'F4', label: 'F4' },
  { value: 'F5', label: 'F5' },
]

export function SettingsPage() {
  const { localeSetting, setLocaleSetting, t } = useI18n()
  const [developerMode, setDeveloperMode] = useState(store.get('developerMode'))
  const [hotkey, setHotkey] = useState(store.get('hotkey'))
  const [globalParticle, setGlobalParticle] = useState(store.get('globalParticle'))
  const [skippedUpdateVersion, setSkippedUpdateVersion] = useState(store.get('skippedUpdateVersion'))
  const localeOptions = [
    { value: 'auto', label: t('settings.language.auto') },
    { value: 'zh-CN', label: t('settings.language.zhCN') },
    { value: 'en-US', label: t('settings.language.enUS') },
  ]

  useEffect(() => {
    const unsubs = [
      store.onChange('developerMode', setDeveloperMode),
      store.onChange('hotkey', setHotkey),
      store.onChange('globalParticle', setGlobalParticle),
      store.onChange('skippedUpdateVersion', setSkippedUpdateVersion),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [])

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">{t('settings.title')}</h2>

      <SettingGroup title={t('settings.group.general')}>
        <SettingCard
          title={t('settings.language.title')}
          description={t('settings.language.description')}
        >
          <SonaSelect
            options={localeOptions}
            value={localeSetting}
            onChange={(v) => setLocaleSetting(v as SonaLocaleSetting)}
          />
        </SettingCard>
        <SettingCard
          title={t('settings.hotkey.title')}
          description={t('settings.hotkey.description')}
        >
          <SonaSelect
            options={hotkeyOptions}
            value={hotkey}
            onChange={(v) => { setHotkey(v); store.set('hotkey', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('settings.globalParticle.title')}
          description={t('settings.globalParticle.description')}
        >
          <SonaSwitch
            checked={globalParticle}
            onChange={(v) => { setGlobalParticle(v); store.set('globalParticle', v) }}
          />
        </SettingCard>
        {skippedUpdateVersion && (
          <SettingCard
            title={t('settings.skippedUpdate.title', { version: skippedUpdateVersion })}
            description={t('settings.skippedUpdate.description')}
          >
            <SonaButton onClick={() => {
              clearSkippedUpdateVersion()
              void checkForUpdates()
            }}>
              {t('settings.skippedUpdate.clear')}
            </SonaButton>
          </SettingCard>
        )}
      </SettingGroup>


      <SettingGroup title={t('settings.group.advanced')}>
        <SettingCard
          title={t('settings.developerMode.title')}
          description={t('settings.developerMode.description')}
        >
          <SonaSwitch
            checked={developerMode}
            onChange={(v) => { setDeveloperMode(v); store.set('developerMode', v) }}
          />
        </SettingCard>
      </SettingGroup>
    </div>
  )
}
