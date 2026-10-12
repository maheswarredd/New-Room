import React, { useState } from "react";
import "./Footer.css";

export default function Footer() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <footer className="mini-dev-footer">
        <span>
          © {new Date().getFullYear()} RoomMate Pro
        </span>

        <span className="mini-footer-divider">|</span>

        <span className="mini-developed-by">Developed by</span>

        <button
          type="button"
          className="mini-dev-link"
          onClick={() => setShowProfile(true)}
        >
          Maheswar Reddy
          <span className="mini-dev-badge">↗</span>
        </button>
      </footer>

      {showProfile && (
        <div
          className="mini-dev-overlay"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="mini-dev-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mini-dev-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="mini-dev-close"
              onClick={() => setShowProfile(false)}
              aria-label="Close profile"
            >
              ×
            </button>

            <div className="mini-dev-3d">
              <img
                src="https://i.ibb.co/RTddRmJk/Maheswar-Reddy-website.png"
                alt="Maheswar Reddy"
                className="mini-dev-photo"
              />
            </div>

            <p className="mini-dev-caption">DEVELOPER PROFILE</p>

            <h2 id="mini-dev-title">
              Maheswar <span>Reddy</span>
            </h2>

            <p className="mini-dev-role">
              Full Stack Developer · QA Testing
            </p>

            <div className="mini-dev-skills">
              {[
                "HTML",
                "CSS",
                "JavaScript",
                "React",
                "Node.js",
                "MongoDB",
                "SQL",
                "AI Creations",
              ].map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>

            <button
              type="button"
              className="mini-dev-done"
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
