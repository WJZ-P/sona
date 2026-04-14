import '@/styles/AboutPage.css'
import { InfoCard } from '@/components/ui/InfoCard'
import { ZapIcon, CodeIcon, BoxIcon } from '@/components/ui/icons'

declare const __PLUGIN_VERSION__: string

export function AboutPage() {
  return (
    <div className="sona-about">
      <div className="sona-about-header">
        <h2 className="sona-about-title">Sona</h2>
        <span className="sona-about-version">v{__PLUGIN_VERSION__}</span>
      </div>

      <p className="sona-about-desc">
        Sona 是一款基于 React + Vite 构建的英雄联盟客户端增强插件，运行在 Pengu Loader 之上，提供丰富的自定义功能。
      </p>

      {/* 信息卡片 */}
      <div className="sona-about-cards">
        <InfoCard icon={<ZapIcon />} label="插件" value={`Sona v${__PLUGIN_VERSION__}`} />
        <InfoCard icon={<CodeIcon />} label="框架" value="React + Vite" />
        <InfoCard
          icon={<BoxIcon />}
          label="加载器"
          value={`Pengu Loader ${typeof Pengu !== 'undefined' ? Pengu.version : '1.1.6'}`}
        />
      </div>

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
