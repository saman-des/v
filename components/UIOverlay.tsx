import React, { useEffect, useState } from "react";
import { HandData } from "../types";

interface Props {
  handData: HandData;
}

const showerHearts = [
  { left: 5, delay: -0.3, duration: 2.4, size: 14 },
  { left: 12, delay: -1.1, duration: 2.8, size: 20 },
  { left: 18, delay: -0.7, duration: 2.5, size: 15 },
  { left: 24, delay: -1.6, duration: 2.9, size: 18 },
  { left: 31, delay: -0.4, duration: 2.6, size: 13 },
  { left: 37, delay: -1.8, duration: 3.0, size: 17 },
  { left: 44, delay: -0.9, duration: 2.3, size: 12 },
  { left: 50, delay: -1.5, duration: 2.8, size: 19 },
  { left: 57, delay: -0.2, duration: 2.5, size: 15 },
  { left: 64, delay: -1.2, duration: 3.1, size: 21 },
  { left: 71, delay: -0.6, duration: 2.7, size: 16 },
  { left: 78, delay: -1.7, duration: 3.0, size: 14 },
  { left: 85, delay: -1.0, duration: 2.6, size: 18 },
  { left: 92, delay: -0.5, duration: 2.9, size: 16 },
];

const UIOverlay: React.FC<Props> = ({ handData }) => {
  const [isLoveModalOpen, setIsLoveModalOpen] = useState(false);
  const [canTriggerLoveModal, setCanTriggerLoveModal] = useState(true);

  useEffect(() => {
    if (!handData.isTwoHandHeartDetected) {
      setCanTriggerLoveModal(true);
      return;
    }

    if (canTriggerLoveModal) {
      setIsLoveModalOpen(true);
      setCanTriggerLoveModal(false);
    }
  }, [handData.isTwoHandHeartDetected, canTriggerLoveModal]);

  const closeLoveModal = () => {
    setIsLoveModalOpen(false);
    setCanTriggerLoveModal(false);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-2 md:p-4">
      {isLoveModalOpen && (
        <>
          <div className="love-lock-overlay" />

          <div className="love-shower" aria-hidden>
            {showerHearts.map((heart, index) => (
              <span
                key={`shower-heart-${index}`}
                className="love-shower-heart"
                style={{
                  left: `${heart.left}%`,
                  animationDelay: `${heart.delay}s`,
                  animationDuration: `${heart.duration}s`,
                  fontSize: `${heart.size}px`,
                }}
              >
                {"\u2665"}
              </span>
            ))}
          </div>

          <div className="love-confirmation pointer-events-auto">
            <div className="glass-card love-confirmation-card">
              <button
                type="button"
                className="love-close"
                onClick={closeLoveModal}
                aria-label="Close love message"
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M6.7 5.3 12 10.6l5.3-5.3a1 1 0 1 1 1.4 1.4L13.4 12l5.3 5.3a1 1 0 0 1-1.4 1.4L12 13.4l-5.3 5.3a1 1 0 0 1-1.4-1.4l5.3-5.3-5.3-5.3a1 1 0 0 1 1.4-1.4Z" />
                </svg>
                <span>Close</span>
              </button>
              <p className="love-kicker">Love detected</p>
              <h2 className="headline-romance love-question">
                Will you be my Valentine?
              </h2>
              <p className="love-yes">Yes</p>
            </div>
          </div>
        </>
      )}

      <div
        className={`fade-rise flex w-full justify-center transition-opacity duration-300 ${
          isLoveModalOpen ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="glass-card w-full max-w-[280px] rounded-xl px-4 py-3.5 text-center md:max-w-[420px] md:px-6 md:py-4">
          <h1 className="valentine-title mt-0.5 text-base font-bold leading-tight tracking-tight md:text-[1.6rem]">
            Will you be my Valentine?
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-rose-900/70 md:text-[16px]">
            Make a heart 🫶 with your hands to reply.
          </p>
        </div>
      </div>

      <div
        className={`fade-rise-delayed flex justify-start transition-opacity duration-300 ${
          isLoveModalOpen ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="glass-card pointer-events-auto max-w-[190px] rounded-xl p-4 md:max-w-[280px] md:p-5">
          <div className="mb-3 flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full transition-all duration-500 ${
                handData.isVisible
                  ? "bg-rose-500 shadow-[0_0_18px_rgba(214,123,145,0.95)]"
                  : "bg-rose-200"
              }`}
            />
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-900/70 md:text-xs">
              {handData.isVisible ? "Tracking Active" : "Camera Waiting"}
            </h3>
          </div>
          <div className="space-y-1 border-t border-rose-200/60 pt-3">
            <p className="text-[10px] text-rose-900/75 md:text-xs">
              <span className="font-semibold text-rose-700">Hand or drag:</span>{" "}
              rotate carousel
            </p>
            <p className="text-[10px] text-rose-900/75 md:text-xs">
              <span className="font-semibold text-rose-700">Scroll:</span> zoom
              in and out
            </p>
            <p className="text-[10px] text-rose-900/75 md:text-xs">
              <span className="font-semibold text-rose-700">
                Two-hand heart:
              </span>{" "}
              show your love
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
