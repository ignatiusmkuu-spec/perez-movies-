import './Header.css'

export default function Logo({ className = '' }) {
  return (
    <div className={`logo ${className}`}>
      <div className="logo-inner">
        <span className="logo-top">
          {'IGNATIUS'.split('').map((ch, i) => (
            <span key={i} className="logo-char" style={{ animationDelay: `${i * 0.12}s` }}>{ch}</span>
          ))}
        </span>
        <span className="logo-bottom">STREAMING SITE</span>
        <div className="logo-scanline" />
      </div>
      <div className="logo-signal">
        <span style={{ '--h': '6px',  '--d': '0s' }} />
        <span style={{ '--h': '12px', '--d': '0.1s' }} />
        <span style={{ '--h': '20px', '--d': '0.2s' }} />
        <span style={{ '--h': '14px', '--d': '0.3s' }} />
        <span style={{ '--h': '8px',  '--d': '0.4s' }} />
      </div>
    </div>
  )
}
