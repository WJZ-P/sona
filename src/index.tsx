import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import '@/styles/index.css'

// Store context for use across the plugin
let penguContext: PenguContext | null = null

/**
 * Called before League Client initializes its scripts.
 * Use this for early hooks like RCP interception.
 */
export function init(context: PenguContext) {
  penguContext = context
  console.log('[Sona] Plugin initializing...')
}

/**
 * Called after the window is loaded.
 * Safe to manipulate DOM here.
 */
export function load() {
  console.log('[Sona] Plugin loading...')
  mountApp()
}

/**
 * Get the stored Pengu context
 */
export function getContext(): PenguContext | null {
  return penguContext
}

/**
 * Wait for the League Client UI to be ready
 */
function waitForClientReady(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      // Check if the League Client UI manager is loaded
      const uiManager = document.querySelector('lol-uikit-layer-manager-wrapper')
      if (uiManager) {
        resolve()
      } else {
        setTimeout(check, 300)
      }
    }
    check()
  })
}

/**
 * Mount the React application into the League Client
 */
async function mountApp() {
  await waitForClientReady()

  // Create or find the root container
  const CONTAINER_ID = 'sona-root'
  let container = document.getElementById(CONTAINER_ID)

  if (!container) {
    container = document.createElement('div')
    container.id = CONTAINER_ID
    document.body.appendChild(container)
  }

  // Mount React app
  const root = createRoot(container)
  root.render(<App />)

  console.log('[Sona] Plugin mounted successfully!')
}
