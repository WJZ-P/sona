export function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="sona-hex-card">
      <span className="sona-hex-card-icon">{icon}</span>
      <div className="sona-hex-card-text">
        <span className="sona-hex-card-label">{label}</span>
        <span className="sona-hex-card-value">{value}</span>
      </div>
    </div>
  )
}
