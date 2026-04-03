import '@/styles/HomePage.css'
import { InfoCard } from '@/components/InfoCard'
import { ZapIcon, CodeIcon, BoxIcon } from '@/components/icons'

export function HomePage() {
  return (
    <div className="sona-home">
      {/* 欢迎语 */}
      <div className="sona-home-welcome">
        <h1 className="sona-home-heading">WELCOME TO SONA!</h1>
        <p className="sona-home-subtitle">
          Your League of Legends client enhancement framework.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="sona-home-actions">
        <span className="sona-home-actions-label">QUICK ACTIONS</span>
        <div className="sona-home-actions-row">
          <button className="sona-hex-btn">CONFIGURE THEME</button>
          <button className="sona-hex-btn">VIEW SHORTCUTS</button>
          <button className="sona-hex-btn sona-hex-btn--danger">[DISABLE ALL]</button>
        </div>
      </div>

      {/* 底部双栏区域 */}
      <div className="sona-home-grid">
        {/* 左侧：信息卡片 */}
        <div className="sona-home-cards">
          <InfoCard
            icon={<ZapIcon />}
            label="PLUGIN"
            value="Sona v0.1.0"
          />
          <InfoCard
            icon={<CodeIcon />}
            label="FRAMEWORK"
            value="React + Vite"
          />
          <InfoCard
            icon={<BoxIcon />}
            label="LOADER"
            value={`Pengu Loader ${typeof Pengu !== 'undefined' ? Pengu.version : '1.1.6'}`}
          />
        </div>

        {/* 右侧：About */}
        <div className="sona-home-about">
          <h3 className="sona-home-about-title">ABOUT</h3>
          <p className="sona-home-about-text">
            Sona is a Pengu Loader plugin built with React and Vite. It provides a modern, 
            extensible framework for customizing your League of Legends client experience.
          </p>
          <p className="sona-home-about-quote">
            "Only you can hear me, Summoner. What masterpiece shall we play today?"
          </p>
        </div>
      </div>
    </div>
  )
}
