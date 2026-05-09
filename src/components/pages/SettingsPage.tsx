import { useState, useEffect } from 'react'
import { SettingCard, SettingGroup } from '@/components/ui/SettingCard'
import { SonaSwitch } from '@/components/ui/SonaSwitch'
import { SonaSelect } from '@/components/ui/SonaSelect'
import { store } from '@/lib/store'
import { languageOptions, useI18n, type Locale } from '@/lib/i18n'
import '@/styles/SettingsPage.css'

const hotkeyOptions = [
  { value: 'F1', label: 'F1' },
  { value: 'F2', label: 'F2' },
  { value: 'F3', label: 'F3' },
  { value: 'F4', label: 'F4' },
  { value: 'F5', label: 'F5' },
]

export function SettingsPage() {
  const { locale, setLocale, t } = useI18n()
  const [developerMode, setDeveloperMode] = useState(store.get('developerMode'))
  const [hotkey, setHotkey] = useState(store.get('hotkey'))
  const [globalParticle, setGlobalParticle] = useState(store.get('globalParticle'))

  useEffect(() => {
    const unsubs = [
      store.onChange('developerMode', setDeveloperMode),
      store.onChange('hotkey', setHotkey),
      store.onChange('globalParticle', setGlobalParticle),
    ]
    return () => unsubs.forEach((fn) => fn())
  }, [])

  return (
    <div className="sona-settings">
      <h2 className="sona-settings-title">{t('settings.title')}</h2>

      <SettingGroup title={t('settings.general')}>
        <SettingCard
          title={t('settings.language')}
          description={t('settings.languageDesc')}
        >
          <SonaSelect
            options={[...languageOptions]}
            value={locale}
            onChange={(v) => setLocale(v as Locale)}
          />
        </SettingCard>
        <SettingCard
          title={t('settings.hotkey')}
          description={t('settings.hotkeyDesc')}
        >
          <SonaSelect
            options={hotkeyOptions}
            value={hotkey}
            onChange={(v) => { setHotkey(v); store.set('hotkey', v) }}
          />
        </SettingCard>
        <SettingCard
          title={t('settings.globalParticle')}
          description={t('settings.globalParticleDesc')}
        >
          <SonaSwitch
            checked={globalParticle}
            onChange={(v) => { setGlobalParticle(v); store.set('globalParticle', v) }}
          />
        </SettingCard>
      </SettingGroup>


      <SettingGroup title={t('settings.advanced')}>
        <SettingCard
          title={t('settings.developerMode')}
          description={t('settings.developerModeDesc')}
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
