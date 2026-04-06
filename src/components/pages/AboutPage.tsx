import '@/styles/AboutPage.css'

declare const __PLUGIN_VERSION__: string

export function AboutPage() {
  return (
    <div className="sona-about">
      <div className="sona-about-header">
        <h2 className="sona-about-title">Sona</h2>
        <span className="sona-about-version">v{__PLUGIN_VERSION__}</span>
      </div>

      <p className="sona-about-desc">
        A League of Legends client enhancement plugin built with React + Vite for Pengu Loader.
      </p>

      <div className="sona-about-section">
        <h3 className="sona-about-section-title">技术栈</h3>
        <ul className="sona-about-list">
          <li>React 19 + TypeScript</li>
          <li>Vite 6</li>
          <li>Pengu Loader v1.1.0+</li>
          <li>LCU REST API + WebSocket</li>
        </ul>
      </div>

      <div className="sona-about-section">
        <h3 className="sona-about-section-title">开源协议</h3>
        <p className="sona-about-text">AGPL-3.0</p>
      </div>

      <div className="sona-about-quote">
        "Only you can hear me, Summoner. What masterpiece shall we play today?"
      </div>
    </div>
  )
}
