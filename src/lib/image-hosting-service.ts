function decodeImageHostConfig(encodedValue: string): string {
  const binary = atob(encodedValue)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const GET_UPLOAD_PARAMS_URL = decodeImageHostConfig('aHR0cHM6Ly9hcGktdGFrdW1pLm1paG95b2dpZnQuY29tL3VwbG9hZC9vdXRlci9nZXRQYXJhbXNCeUFjY291bnQ=')
const DEFAULT_OSS_HOST = decodeImageHostConfig('aHR0cHM6Ly9wbGF0LXNoLW9wZXJhdGlvbi1wcm9kLXVwbG9hZC11Z2MuY24tc2hhbmdoYWkub3NzLmFsaXl1bmNzLmNvbS8=')
const PUBLIC_IMAGE_BASE_URL = decodeImageHostConfig('aHR0cHM6Ly9vcGVyYXRpb24tdXBsb2FkLm1paG95by5jb20=')
const UPLOAD_BIZ = 'mall-im-user'
const MAX_IMAGE_SIZE = 50 * 1024 * 1024
const IMAGE_HOST_WEB_ORIGIN = decodeImageHostConfig('aHR0cHM6Ly93ZWJzdGF0aWMubWlob3lvZ2lmdC5jb20=')
const IMAGE_HOST_WEB_REFERER = `${IMAGE_HOST_WEB_ORIGIN}/`
const IMAGE_HOST_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/147.0.0.0'
const CORS_PROXY_URL = decodeImageHostConfig('aHR0cHM6Ly9jb3JzcHJveHkuaW8v')

/**
 * 图床服务的登录凭据。日志和返回结果严禁包含该值。
 */
const IMAGE_HOST_AUTH_COOKIE = decodeImageHostConfig('X01IWVVVSUQ9NWY3NjNlMTYtMjA2Ny00NDhhLTliMzQtN2Q5NmVmMjQ0MmE5OyBNSUhPWU9fTE9HSU5fUExBVEZPUk1fTElGRUNZQ0xFX0lEPTkyYjRjODhlOTA7IERFVklDRUZQX1NFRURfSUQ9ODlhNGM3MjRlYzhmZGNlNzsgREVWSUNFRlBfU0VFRF9USU1FPTE3NzczNDY1NjM4NjU7IERFVklDRUZQPTM4ZDgxN2RiYTA1Zjc7IGNvb2tpZV90b2tlbl92Mj12Ml9iZ253NG80WmRCSS0zZEJCM2h4YTNIQ3BfZF9uS0FRSy1iYjd1ZmEtX1FVbkZjUE1pRFdSTHdBcnNEdFU0RU83S0VwbFNrWktTMk5WdW9lNjhLbTN4b2huQ2pQSnJLNDFIQkllVkRMd0gzTDZxTkxHcTU5QzZjVG90WW9iek1ZTU5jNUR5cEN2bk9hR2xaX25QdmZELkNBRT07IGFjY291bnRfbWlkX3YyPTBwYzNtNHJraTJfbWh5OyBhY2NvdW50X2lkX3YyPTI4MjcwNjA5NDsgbHRva2VuX3YyPXYyX09ZUUpvYzlLUkNpQkUzNEdTaW01aDNndEdFZ29rU1FHQy13aU01RjJXRUt4YTV1Z0RHeUU4cWhoUGpjRzlibHZtU0ZENU5yd3hoNkhWcGZnNkQwWmxRNTd3UmRnZE1QRlRsRThVM3NvOEdJM3lGN2JfcjRkUDhxcm8tRmN3eGFKSlZ3dDJwMzZtNHJhenlaYlM1MnEuQ0FFPTsgbHRtaWRfdjI9MHBjM200cmtpMl9taHk7IGx0dWlkX3YyPTI4MjcwNjA5NDsgY29va2llX3Rva2VuPTkycG90NTN5UEh3V3RnemdRb0JMWllNem1kbGo4NGFpOElsbzV3OU87IGFjY291bnRfaWQ9MjgyNzA2MDk0OyBsdG9rZW49WnBrWkM2bmxTVzdLdEhaZVI0ZURHUlZBN002NFhoY29GYURUUFBTRzsgbHR1aWQ9MjgyNzA2MDk0OyBhbGl5dW5nZl90Yz0zNDBmZTYxZmUyMGJhN2RmYjhiNzY0Mzk2NDUxYTU3MDU1NTg5NjMxMTU0NmVhMzNjM2E3ZGI0ZDc2ZWRhODBm')

interface UploadParamsResponse {
  retcode?: number
  message?: string
  data?: {
    file_name?: string
    oss?: {
      host?: string
      policy?: string
      signature?: string
      accessid?: string
    }
  }
}

interface ObjectStorageParams {
  host: string
  key: string
  policy: string
  signature: string
  accessId: string
}

export interface ImageHostingUploadDebugResult {
  url: string
  key: string
  md5: string
  size: number
  contentType: string
  extension: string
  cookieForwardedByProxy: boolean
  paramsBrowserHeaderAcceptance: Record<string, boolean>
  uploadBrowserHeaderAcceptance: Record<string, boolean>
  paramsStatus: number
  uploadStatus: number
  elapsedMs: number
}

function debugLog(enabled: boolean, step: string, details: Record<string, unknown> = {}) {
  if (enabled) console.info(`[Sona][ImageHosting] ${step}`, details)
}

function getHeaderAcceptance(request: Request): Record<string, boolean> {
  return {
    origin: request.headers.has('Origin'),
    referer: request.headers.has('Referer'),
    userAgent: request.headers.has('User-Agent'),
  }
}

/**
 * 浏览器禁止脚本直接设置 Cookie / Origin / Referer / User-Agent。
 * corsproxy.io 的 reqHeaders 参数会在代理服务器请求目标地址前覆盖这些请求头。
 */
function buildCorsProxyUrl(targetUrl: string, requestHeaders: Record<string, string> = {}): string {
  const proxyUrl = new URL(CORS_PROXY_URL)
  proxyUrl.searchParams.set('url', targetUrl)
  Object.entries(requestHeaders).forEach(([name, value]) => {
    proxyUrl.searchParams.append('reqHeaders', `${name}:${value}`)
  })
  return proxyUrl.toString()
}

function rotateLeft(value: number, shift: number): number {
  return (value << shift) | (value >>> (32 - shift))
}

function wordToLittleEndianHex(word: number): string {
  let output = ''
  for (let index = 0; index < 4; index += 1) {
    output += ((word >>> (index * 8)) & 0xff).toString(16).padStart(2, '0')
  }
  return output
}

/** 浏览器 WebCrypto 不提供 MD5，这里为图床上传协议计算文件摘要。 */
export function computeMd5(data: ArrayBuffer): string {
  const input = new Uint8Array(data)
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64
  const padded = new Uint8Array(paddedLength)
  padded.set(input)
  padded[input.length] = 0x80

  const bitLengthLow = (input.length * 8) >>> 0
  const bitLengthHigh = Math.floor(input.length / 0x20000000) >>> 0
  const paddedView = new DataView(padded.buffer)
  paddedView.setUint32(paddedLength - 8, bitLengthLow, true)
  paddedView.setUint32(paddedLength - 4, bitLengthHigh, true)

  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]
  const constants = Array.from({ length: 64 }, (_, index) =>
    Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0,
  )

  let hashA = 0x67452301
  let hashB = 0xefcdab89
  let hashC = 0x98badcfe
  let hashD = 0x10325476

  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = Array.from({ length: 16 }, (_, index) =>
      paddedView.getUint32(offset + index * 4, true),
    )
    let a = hashA
    let b = hashB
    let c = hashC
    let d = hashD

    for (let index = 0; index < 64; index += 1) {
      let mixed: number
      let wordIndex: number

      if (index < 16) {
        mixed = (b & c) | (~b & d)
        wordIndex = index
      } else if (index < 32) {
        mixed = (d & b) | (~d & c)
        wordIndex = (5 * index + 1) % 16
      } else if (index < 48) {
        mixed = b ^ c ^ d
        wordIndex = (3 * index + 5) % 16
      } else {
        mixed = c ^ (b | ~d)
        wordIndex = (7 * index) % 16
      }

      const nextB = (b + rotateLeft(
        (a + mixed + constants[index] + words[wordIndex]) | 0,
        shifts[index],
      )) | 0
      a = d
      d = c
      c = b
      b = nextB
    }

    hashA = (hashA + a) | 0
    hashB = (hashB + b) | 0
    hashC = (hashC + c) | 0
    hashD = (hashD + d) | 0
  }

  return [hashA, hashB, hashC, hashD].map(wordToLittleEndianHex).join('')
}

function getImageExtension(fileName: string, contentType: string): string {
  const pathExtension = fileName.split(/[?#]/, 1)[0]?.split('.').pop()?.toLowerCase()
  if (pathExtension && /^[a-z0-9]+$/.test(pathExtension)) {
    return pathExtension === 'jpeg' ? 'jpg' : pathExtension
  }

  const mimeExtension = contentType.split('/')[1]?.split(';')[0]?.toLowerCase()
  if (mimeExtension) return mimeExtension === 'jpeg' ? 'jpg' : mimeExtension
  return 'png'
}

function getContentType(extension: string, blobType: string): string {
  if (blobType.startsWith('image/')) return blobType
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  if (extension === 'svg') return 'image/svg+xml'
  return `image/${extension}`
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text.slice(0, 1000)
  }
}

async function getUploadParams(md5: string, extension: string, enableDebug: boolean) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  })
  const proxiedEndpoint = buildCorsProxyUrl(GET_UPLOAD_PARAMS_URL, {
    Cookie: IMAGE_HOST_AUTH_COOKIE,
    Origin: IMAGE_HOST_WEB_ORIGIN,
    Referer: IMAGE_HOST_WEB_REFERER,
    'User-Agent': IMAGE_HOST_USER_AGENT,
  })
  const request = new Request(proxiedEndpoint, {
    method: 'POST',
    mode: 'cors',
    headers,
    body: JSON.stringify({
      md5,
      ext: extension,
      biz: UPLOAD_BIZ,
      support_content_type: true,
    }),
  })
  const browserHeaderAcceptance = getHeaderAcceptance(request)

  debugLog(enableDebug, 'Step 1/2 请求上传凭证', {
    endpoint: GET_UPLOAD_PARAMS_URL,
    proxy: CORS_PROXY_URL,
    md5,
    extension,
    biz: UPLOAD_BIZ,
    cookieConfigured: Boolean(IMAGE_HOST_AUTH_COOKIE),
    cookieLength: IMAGE_HOST_AUTH_COOKIE.length,
    cookieForwardedByProxy: true,
    browserHeaderAcceptance,
  })

  const response = await fetch(request)
  const body = await readResponseBody(response) as UploadParamsResponse | string | null

  if (!response.ok || !body || typeof body === 'string' || body.retcode !== 0) {
    const message = body && typeof body !== 'string' ? body.message : body
    throw new Error(`图床上传凭证请求失败: ${response.status} ${response.statusText}${message ? ` → ${message}` : ''}`)
  }

  const oss = body.data?.oss
  const key = body.data?.file_name
  if (!key || !oss?.policy || !oss.signature || !oss.accessid) {
    throw new Error('图床上传凭证响应缺少 file_name / policy / signature / accessid')
  }

  const params: ObjectStorageParams = {
    host: oss.host || DEFAULT_OSS_HOST,
    key,
    policy: oss.policy,
    signature: oss.signature,
    accessId: oss.accessid,
  }
  debugLog(enableDebug, 'Step 1/2 上传凭证获取成功', {
    status: response.status,
    host: params.host,
    key: params.key,
    hasPolicy: Boolean(params.policy),
    hasSignature: Boolean(params.signature),
    hasAccessId: Boolean(params.accessId),
  })

  return {
    params,
    status: response.status,
    cookieForwardedByProxy: true,
    browserHeaderAcceptance,
  }
}

function makePublicImageUrl(key: string): string {
  return `${PUBLIC_IMAGE_BASE_URL}/${key.replace(/^\/+/, '')}`
}

async function uploadImage(
  image: Blob,
  sourceFileName: string,
  enableDebug: boolean,
): Promise<ImageHostingUploadDebugResult> {
  if (image.size <= 0) throw new Error('图片内容为空')
  if (image.size > MAX_IMAGE_SIZE) throw new Error(`图片超过 50MB：${image.size} bytes`)

  const startedAt = performance.now()
  const buffer = await image.arrayBuffer()
  const extension = getImageExtension(sourceFileName, image.type)
  const contentType = getContentType(extension, image.type)
  const md5 = computeMd5(buffer)
  const uploadFileName = `image-${crypto.randomUUID().replace(/-/g, '')}.${extension}`
  debugLog(enableDebug, '已读取本地图片', {
    size: image.size,
    contentType,
    extension,
    md5,
    uploadFileName,
  })

  const paramsResult = await getUploadParams(md5, extension, enableDebug)
  const formData = new FormData()
  formData.set('key', paramsResult.params.key)
  formData.set('policy', paramsResult.params.policy)
  formData.set('signature', paramsResult.params.signature)
  formData.set('OSSAccessKeyId', paramsResult.params.accessId)
  formData.set('success_action_status', '200')
  formData.set('x-oss-content-type', contentType)
  formData.set('file', image, uploadFileName)

  debugLog(enableDebug, 'Step 2/2 开始上传对象存储', {
    host: paramsResult.params.host,
    key: paramsResult.params.key,
    uploadFileName,
    size: image.size,
    contentType,
  })
  const proxiedOssHost = buildCorsProxyUrl(paramsResult.params.host, {
    Origin: IMAGE_HOST_WEB_ORIGIN,
    Referer: IMAGE_HOST_WEB_REFERER,
    'User-Agent': IMAGE_HOST_USER_AGENT,
  })
  const uploadRequest = new Request(proxiedOssHost, {
    method: 'POST',
    mode: 'cors',
    body: formData,
  })
  const uploadBrowserHeaderAcceptance = getHeaderAcceptance(uploadRequest)
  debugLog(enableDebug, 'Step 2/2 请求将通过 CORS 代理发送', {
    proxy: CORS_PROXY_URL,
    browserHeaderAcceptance: uploadBrowserHeaderAcceptance,
  })
  const uploadResponse = await fetch(uploadRequest)

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text().catch(() => '')
    throw new Error(`图床对象存储上传失败: ${uploadResponse.status} ${uploadResponse.statusText}${body ? ` → ${body.slice(0, 1000)}` : ''}`)
  }

  const url = makePublicImageUrl(paramsResult.params.key)
  const result: ImageHostingUploadDebugResult = {
    url,
    key: paramsResult.params.key,
    md5,
    size: image.size,
    contentType,
    extension,
    cookieForwardedByProxy: paramsResult.cookieForwardedByProxy,
    paramsBrowserHeaderAcceptance: paramsResult.browserHeaderAcceptance,
    uploadBrowserHeaderAcceptance,
    paramsStatus: paramsResult.status,
    uploadStatus: uploadResponse.status,
    elapsedMs: Math.round(performance.now() - startedAt),
  }
  debugLog(enableDebug, '上传完成', { ...result })
  return result
}

export async function uploadImageToHostingService(image: Blob, sourceFileName = 'image.png'): Promise<string> {
  const result = await uploadImage(image, sourceFileName, false)
  return result.url
}

export function uploadImageToHostingServiceForDebug(
  image: Blob,
  sourceFileName: string,
): Promise<ImageHostingUploadDebugResult> {
  return uploadImage(image, sourceFileName, true)
}
