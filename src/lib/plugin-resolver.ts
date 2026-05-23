const FALLBACK_PLUGIN_FOLDER = 'sona'

let pluginBaseUrl = `//plugins/${FALLBACK_PLUGIN_FOLDER}/`
let pluginFolderName = FALLBACK_PLUGIN_FOLDER

function logResolver(reason: string, details: Record<string, unknown> = {}) {
  console.info('[Sona][PluginResolver] %s', reason, {
    ...details,
    pluginBaseUrl,
    pluginFolderName,
  })
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/')
}

function trimQueryAndHash(value: string): string {
  return value.split(/[?#]/, 1)[0] ?? value
}

function extractPluginBaseUrl(value: string): string | null {
  const normalized = trimQueryAndHash(normalizePath(value))
  const pluginsIndex = normalized.match(/(?:^|\/)plugins\/([^/]+)\//i)
  if (!pluginsIndex) return null

  const pluginRootEnd = pluginsIndex.index! + pluginsIndex[0].length
  return normalized.substring(0, pluginRootEnd)
}

function extractPluginFolderName(baseUrl: string): string | null {
  const normalized = normalizePath(baseUrl).replace(/\/+$/, '')
  const parts = normalized.split('/')
  const folder = parts.at(-1)
  return folder ? decodeURIComponent(folder) : null
}

function getContextPluginName(context?: PenguContext): string | null {
  const metaName = context?.meta?.name
  return typeof metaName === 'string' && metaName ? metaName : null
}

export function initPluginResolver(metaUrl?: string, context?: PenguContext) {
  const scriptPath = typeof window.getScriptPath === 'function' ? window.getScriptPath() : ''
  const scriptBaseUrl = scriptPath ? extractPluginBaseUrl(scriptPath) : null
  const scriptPluginFolderName = scriptBaseUrl ? extractPluginFolderName(scriptBaseUrl) : null
  if (scriptPluginFolderName) {
    pluginFolderName = scriptPluginFolderName
    pluginBaseUrl = `//plugins/${encodeURIComponent(pluginFolderName)}/`
    logResolver('initialized from window.getScriptPath() plugin folder', {
      metaUrl,
      scriptPath,
      scriptBaseUrl,
    })
    return
  }

  const baseUrl = metaUrl ? extractPluginBaseUrl(metaUrl) : null
  const metaPluginFolderName = baseUrl ? extractPluginFolderName(baseUrl) : null
  if (metaPluginFolderName) {
    pluginFolderName = metaPluginFolderName
    pluginBaseUrl = `//plugins/${encodeURIComponent(pluginFolderName)}/`
    logResolver('initialized from import.meta.url plugin folder', {
      metaUrl,
      scriptPath,
      baseUrl,
    })
    return
  }

  pluginFolderName = getContextPluginName(context) ?? pluginFolderName
  pluginBaseUrl = `//plugins/${encodeURIComponent(pluginFolderName)}/`
  logResolver('initialized from context fallback', {
    metaUrl,
    contextPluginName: getContextPluginName(context),
    scriptPath,
  })
}

export function resolvePluginAssetUrl(assetPath: string): string {
  const normalizedPath = normalizePath(assetPath)
    .replace(/^\.\/+/, '')
    .replace(/^assets\/+/i, '')
    .replace(/^\/+/, '')

  return `${pluginBaseUrl}assets/${normalizedPath.split('/').map(encodeURIComponent).join('/')}`
}

export function getPluginAssetsFolderPath(): string {
  return `${pluginFolderName}/assets`
}
