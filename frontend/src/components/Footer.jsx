import React, { useState } from "react";
import "./Footer.css";

export default function Footer() {
  const [showProfile, setShowProfile] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    const x = (e.clientY - rect.top) / rect.height;
    const y = (e.clientX - rect.left) / rect.width;

    setRotation({
      x: (0.5 - x) * 18,
      y: (y - 0.5) * 22,
    });
  };

  const resetRotation = () => setRotation({ x: 0, y: 0 });

  return (
    <>
      <footer className="developer-footer">
        <div
          className="developer-3d-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={resetRotation}
          onClick={() => setShowProfile(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowProfile(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Open Maheswar Reddy developer profile"
          style={{
            transform: `perspective(900px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          }}
        >
          <div className="developer-card-glow" />

          <div className="developer-avatar-wrap">
            <img
              src="https://i.ibb.co/RTddRmJk/Maheswar-Reddy-website.png"
              alt="Maheswar Reddy"
              className="developer-avatar"
              loading="lazy"
            />
          </div>

          <p className="developer-label">DESIGNED & DEVELOPED BY</p>

          <h3 className="developer-name">
            Maheswar <span>Reddy</span>
          </h3>

          <p className="developer-role">
            Full Stack Developer · QA Testing
          </p>

          <span className="developer-profile-button">
            Explore My Profile ↗
          </span>
        </div>

        <p className="developer-copyright">
          © {new Date().getFullYear()} RoomMate Pro · All rights reserved.
        </p>
      </footer>

      {showProfile && (
        <div
          className="developer-modal-backdrop"
          onClick={() => setShowProfile(false)}
        >
          <section
            className="developer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="developer-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="developer-modal-close"
              onClick={() => setShowProfile(false)}
              aria-label="Close developer profile"
            >
              ×
            </button>

            <img
              src="https://i.ibb.co/RTddRmJk/Maheswar-Reddy-website.png"
              alt="Maheswar Reddy"
              className="developer-modal-avatar"
            />

            <p className="developer-label">DEVELOPER PROFILE</p>

            <h2 id="developer-modal-title">
              Maheswar <span>Reddy</span>
            </h2>

            <p className="developer-modal-description">
              Full Stack Developer passionate about web development,
              testing and creative technology.
            </p>

            <div className="developer-skills">
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
              className="developer-done-button"
              onClick={() => setShowProfile(false)}
            >
              Close Profile
            </button>
          </section>
        </div>
      )}
    </>
  );
}
