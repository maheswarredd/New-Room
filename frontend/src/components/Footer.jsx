import { useState } from "react";
import "./Footer.css";

export default function Footer() {
  const [showProfile, setShowProfile] = useState(false);

  const developerImage =
    "https://i.ibb.co/RTddRmJk/Maheswar-Reddy-website.png";

  return (
    <>
      <footer className="rm-footer">
        <div className="rm-footer-left">
          © {new Date().getFullYear()} RoomMate Pro — All rights reserved.
        </div>

        <div className="rm-footer-center">
          Built with precision <span>♥</span>
        </div>

        <button
          type="button"
          className="rm-developer-badge"
          onClick={() => setShowProfile(true)}
          aria-label="View developer profile"
        >
          <img src={developerImage} alt="Maheswar Reddy" />

          <span className="rm-developer-info">
            <strong>Maheswar Reddy</strong>
            <small>Full Stack Developer · View Profile ↗</small>
          </span>

          <span className="rm-developer-sparkle">✧</span>
        </button>
      </footer>

      {showProfile && (
        <div
          className="rm-profile-overlay"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="rm-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rm-profile-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="rm-profile-close"
              onClick={() => setShowProfile(false)}
              aria-label="Close profile"
            >
              ×
            </button>

            <div className="rm-profile-scene">
              <div className="rm-profile-3d-card">
                <div className="rm-profile-photo-frame">
                  <img src={developerImage} alt="Maheswar Reddy" />
                </div>
                <div className="rm-profile-card-light" />
              </div>
            </div>

            <p className="rm-profile-eyebrow">MEET THE DEVELOPER</p>

            <h2 id="rm-profile-title">
              Maheswar <span>Reddy</span>
            </h2>

            <p className="rm-profile-role">
              Full Stack Developer
            </p>

            <p className="rm-profile-description">
              Building modern web applications with clean design,
              smooth experiences and reliable functionality.
            </p>

            <div className="rm-profile-skills">
              <span>HTML</span>
              <span>CSS</span>
              <span>JavaScript</span>
              <span>React</span>
              <span>Node.js</span>
              <span>MongoDB</span>
              <span>SQL</span>
              <span>QA Testing</span>
              <span>AI Creations</span>
            </div>

            <button
              type="button"
              className="rm-profile-action"
              onClick={() => setShowProfile(false)}
            >
              Close Profile
            </button>
          </div>
        </div>
      )}
    </>
  );
}
