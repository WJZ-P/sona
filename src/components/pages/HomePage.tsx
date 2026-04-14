import '@/styles/HomePage.css'
import sonaIcon from '@/../assets/Champie_Sona_profileicon.png'

export function HomePage() {
  return (
    <div className="sona-home">
      {/* Sona 头像区域 */}
      <div className="sona-home-avatar-wrap">
        <div className="sona-home-avatar-glow" />
        <img
          className="sona-home-avatar"
          src={sonaIcon}
          alt="Sona"
          draggable={false}
        />
      </div>

      {/* 欢迎语 */}
      <div className="sona-home-welcome">
        <h1 className="sona-home-heading">欢迎使用 Sona</h1>
        <p className="sona-home-subtitle">
          你的英雄联盟客户端增强工具
        </p>
      </div>

      {/* 琴女语录 */}
      <p className="sona-home-quote">
        "只有你能听到我的声音，召唤师。今天我们演奏什么杰作？"
      </p>
    </div>
  )
}
