import React, { useState } from "react";

interface Props {
  isExiting: boolean;
  onContinue: () => void;
}

const floatingHearts = [
  { left: 6, duration: 8.2, delay: -1.2, size: 16 },
  { left: 12, duration: 9.6, delay: -4.8, size: 22 },
  { left: 20, duration: 10.4, delay: -6.5, size: 18 },
  { left: 29, duration: 8.9, delay: -2.7, size: 17 },
  { left: 37, duration: 10.8, delay: -7.2, size: 20 },
  { left: 46, duration: 9.4, delay: -3.8, size: 14 },
  { left: 55, duration: 11.2, delay: -6.1, size: 24 },
  { left: 64, duration: 8.7, delay: -1.4, size: 15 },
  { left: 72, duration: 9.8, delay: -5.3, size: 21 },
  { left: 80, duration: 10.9, delay: -8.6, size: 18 },
  { left: 88, duration: 9.2, delay: -3.1, size: 16 },
  { left: 95, duration: 10.3, delay: -7.8, size: 19 },
];

const sparkles = [
  { left: 8, top: 16, delay: -0.8, duration: 2.8, size: 7 },
  { left: 21, top: 33, delay: -2.1, duration: 2.3, size: 6 },
  { left: 34, top: 14, delay: -1.3, duration: 3.1, size: 8 },
  { left: 48, top: 28, delay: -2.8, duration: 2.6, size: 7 },
  { left: 62, top: 18, delay: -0.6, duration: 3.2, size: 9 },
  { left: 78, top: 35, delay: -1.9, duration: 2.7, size: 6 },
  { left: 90, top: 22, delay: -2.4, duration: 2.4, size: 7 },
  { left: 17, top: 62, delay: -0.4, duration: 2.9, size: 8 },
  { left: 42, top: 74, delay: -1.6, duration: 2.2, size: 6 },
  { left: 67, top: 70, delay: -2.9, duration: 3.3, size: 8 },
  { left: 85, top: 58, delay: -1.1, duration: 2.5, size: 7 },
];

const IntroScreen: React.FC<Props> = ({ isExiting, onContinue }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`intro-screen ${isExiting ? "intro-exit" : ""}`}>
      <div className="intro-aura intro-aura-left" aria-hidden />
      <div className="intro-aura intro-aura-right" aria-hidden />
      <div className="intro-ring intro-ring-one" aria-hidden />
      <div className="intro-ring intro-ring-two" aria-hidden />

      <div className="intro-sparkles" aria-hidden>
        {sparkles.map((sparkle, index) => (
          <span
            key={`sparkle-${index}`}
            className="intro-sparkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
            }}
          />
        ))}
      </div>

      <div className="intro-hearts" aria-hidden>
        {floatingHearts.map((heart, index) => (
          <span
            key={`heart-${index}`}
            className="intro-heart"
            style={{
              left: `${heart.left}%`,
              animationDuration: `${heart.duration}s`,
              animationDelay: `${heart.delay}s`,
              fontSize: `${heart.size}px`,
            }}
          >
            {"\u2665"}
          </span>
        ))}
      </div>

      <div className="intro-card">
        <div className="intro-heading">
          <p className="intro-kicker">For My Special One</p>
          <h1 className="headline-romance intro-title">
            A little surprise for you
          </h1>
        </div>

        {!showDetails && (
          <div className="intro-actions">
            <button
              type="button"
              className="intro-continue"
              onClick={() => setShowDetails(true)}
            >
              Open Surprise
            </button>
          </div>
        )}

        {showDetails && (
          <div className="intro-reveal">
            <p className="intro-gesture-note m-auto">
              Experience with your tiny hand gestures 🖐️
            </p>

            <div className="intro-instruction-grid">
              <article className="intro-step">
                <span className="intro-step-icon" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <path d="M7 12.5v-2.3a1 1 0 0 1 2 0v2.3h.5V8.4a1 1 0 0 1 2 0v4.1h.5V7a1 1 0 1 1 2 0v5.5h.5V8.6a1 1 0 1 1 2 0v6.4c0 3-2.2 5.5-5.3 5.5h-.8C8.4 20.5 6 18.1 6 15v-2.5a1 1 0 0 1 1-1Z" />
                  </svg>
                </span>
                <h3>Hand Gesture Swipe</h3>
                <p>Raise your hand and swipe in the air to rotate.</p>
              </article>

              <article className="intro-step">
                <span className="intro-step-icon" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3.8a4.8 4.8 0 0 0-4.8 4.8v6.6A4.8 4.8 0 0 0 12 20a4.8 4.8 0 0 0 4.8-4.8V8.6A4.8 4.8 0 0 0 12 3.8Zm0 1.7a3.1 3.1 0 0 1 3.1 3.1v2.1H8.9V8.6A3.1 3.1 0 0 1 12 5.5Zm-1.8 7h3.6v2.8a1.8 1.8 0 0 1-3.6 0v-2.8Z" />
                  </svg>
                </span>
                <h3>Mouse Scroll</h3>
                <p>Scroll to zoom in or out.</p>
              </article>

              <article className="intro-step">
                <span className="intro-step-icon" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21.3 4.9 14.8a4.7 4.7 0 0 1 6.6-6.7l.5.6.5-.6a4.7 4.7 0 0 1 6.6 6.7L12 21.3Zm0-3.1 5.9-5.3a3 3 0 0 0-4.3-4.3L12 10.4l-1.6-1.8a3 3 0 0 0-4.3 4.3l5.9 5.3Z" />
                  </svg>
                </span>
                <h3>Hearts Hearts Hearts</h3>
                <p>Make a heart with two hands to convey.</p>
              </article>
            </div>

            <div className="intro-actions">
              <button
                type="button"
                className="intro-continue"
                onClick={onContinue}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntroScreen;
