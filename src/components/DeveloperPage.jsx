import './DeveloperPage.css'

export default function DeveloperPage() {
  return (
    <div className="dev-page">
      <div className="dev-card">
        <div className="dev-avatar">👨‍💻</div>
        <div className="dev-name">Ignatius</div>
        <div className="dev-title">Full Stack Developer</div>

        <div className="dev-app-name">
          <div className="dev-app-label">Application</div>
          <div className="dev-app-title">
            <span className="red">IGNATIUS</span> MOVIE STREAM
          </div>
        </div>

        <div className="dev-divider" />

        <p className="dev-about">
          A premium movie streaming platform featuring the latest movies, drama series,
          anime, and live sports streams. Built with passion for entertainment.
        </p>

        <div className="dev-contacts">
          <a
            className="dev-contact-link"
            href="https://wa.me/254706535581"
            target="_blank"
            rel="noreferrer"
          >
            <span className="contact-icon">💬</span>
            <div className="contact-info">
              <div className="contact-type">WhatsApp</div>
              <div className="contact-value">+254 706 535 581</div>
            </div>
          </a>

          <a
            className="dev-contact-link"
            href="tel:+254706535581"
          >
            <span className="contact-icon">📞</span>
            <div className="contact-info">
              <div className="contact-type">Phone / Call</div>
              <div className="contact-value">+254 706 535 581</div>
            </div>
          </a>

          <a
            className="dev-contact-link"
            href="sms:+254706535581"
          >
            <span className="contact-icon">✉️</span>
            <div className="contact-info">
              <div className="contact-type">SMS</div>
              <div className="contact-value">+254 706 535 581</div>
            </div>
          </a>
        </div>

        <a
          href="#video"
          className="dev-video-btn"
        >
          🎬 Watch My Story — Animated Film
        </a>

        <div className="dev-built">
          Made with ❤️ by <span>Ignatius</span> · 2025
        </div>
      </div>
    </div>
  )
}
