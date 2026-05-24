import { useEffect, useMemo, useState } from 'react'
import { store } from '@/lib/store'
import { locales, type SonaLocale, type SonaLocaleSetting, type TranslationKey } from '@/i18n/locales'

function normalizeLocale(value: string | null | undefined): SonaLocale {
  const normalized = (value ?? '').trim().replace('_', '-').toLowerCase()
  if (normalized.startsWith('zh')) return 'zh-CN'
  return 'en-US'
}

function normalizeLocaleSetting(value: string | null | undefined): SonaLocaleSetting {
  if (value === 'auto' || value === 'zh-CN' || value === 'en-US') return value
  return 'auto'
}

export function resolveAutoLocale(): SonaLocale {
  return normalizeLocale(document.documentElement.lang)
}

export function resolveLocale(setting: SonaLocaleSetting | string): SonaLocale {
  const normalizedSetting = normalizeLocaleSetting(setting)
  return normalizedSetting === 'auto' ? resolveAutoLocale() : normalizedSetting
}

export function getCurrentLocaleSetting(): SonaLocaleSetting {
  return normalizeLocaleSetting(store.get('locale'))
}

export function getCurrentLocale(): SonaLocale {
  return resolveLocale(getCurrentLocaleSetting())
}

export function translate(key: TranslationKey, params?: Record<string, string | number>): string {
  const locale = getCurrentLocale()
  const template = locales[locale][key] ?? locales['zh-CN'][key] ?? key
  if (!params) return template

  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const value = params[name]
    return value == null ? match : String(value)
  })
}

export function useI18n() {
  const [localeSetting, setLocaleSettingState] = useState<SonaLocaleSetting>(() => getCurrentLocaleSetting())
  const [documentLanguage, setDocumentLanguage] = useState(() => document.documentElement.lang)

  useEffect(() => {
    const unsubscribe = store.onChange('locale', (value) => {
      setLocaleSettingState(normalizeLocaleSetting(value))
    })
    const observer = new MutationObserver(() => {
      setDocumentLanguage(document.documentElement.lang)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    })

    return () => {
      unsubscribe()
      observer.disconnect()
    }
  }, [])

  const locale = useMemo(() => {
    return resolveLocale(localeSetting === 'auto' ? documentLanguage : localeSetting)
  }, [documentLanguage, localeSetting])

  const t = useMemo(() => {
    return (key: TranslationKey, params?: Record<string, string | number>) => {
      const template = locales[locale][key] ?? locales['zh-CN'][key] ?? key
      if (!params) return template

      return template.replace(/\{(\w+)\}/g, (match, name) => {
        const value = params[name]
        return value == null ? match : String(value)
      })
    }
  }, [locale])

  const setLocaleSetting = (nextLocaleSetting: SonaLocaleSetting) => {
    store.set('locale', nextLocaleSetting)
  }

  return {
    locale,
    localeSetting,
    setLocaleSetting,
    t,
  }
}

export type { SonaLocale, SonaLocaleSetting, TranslationKey }
