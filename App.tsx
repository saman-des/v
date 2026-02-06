import React, { useState, useCallback, useRef, useEffect } from "react";
import SpatialScene from "./components/SpatialScene";
import HandTracker from "./components/HandTracker";
import UIOverlay from "./components/UIOverlay";
import IntroScreen from "./components/IntroScreen";
import { HandData, ShowreelImage } from "./types";

// Using local images from public/images folder
const INITIAL_IMAGES: ShowreelImage[] = Array.from({ length: 22 }).map(
  (_, i) => ({
    id: `img-${i}`,
    url: `/images/${i + 1}.jpg`,
  }),
);

// Easy volume control for background music (0.0 to 1.0).
const BACKGROUND_MUSIC_VOLUME = 0.16;

const App: React.FC = () => {
  const [images] = useState<ShowreelImage[]>(INITIAL_IMAGES);
  const [showIntro, setShowIntro] = useState(true);
  const [isIntroExiting, setIsIntroExiting] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasStartedMusicRef = useRef(false);
  const introTimeoutRef = useRef<number | null>(null);
  const [handData, setHandData] = useState<HandData>({
    x: 0.5,
    y: 0.5,
    isVisible: false,
    isTwoHandHeartDetected: false,
  });

  const handleHandUpdate = useCallback((data: HandData) => {
    setHandData(data);
  }, []);

  const startBackgroundMusic = useCallback(() => {
    if (!audioRef.current || hasStartedMusicRef.current) return;

    audioRef.current.volume = BACKGROUND_MUSIC_VOLUME;
    const playPromise = audioRef.current.play();

    if (playPromise) {
      playPromise
        .then(() => {
          hasStartedMusicRef.current = true;
        })
        .catch(() => {
          // Browser blocked autoplay; user interaction will retry.
        });
      return;
    }

    hasStartedMusicRef.current = true;
  }, []);

  const handleContinue = useCallback(() => {
    if (isIntroExiting) return;
    startBackgroundMusic();
    setIsIntroExiting(true);
    introTimeoutRef.current = window.setTimeout(() => {
      setShowIntro(false);
      setIsIntroExiting(false);
      introTimeoutRef.current = null;
    }, 520);
  }, [isIntroExiting, startBackgroundMusic]);

  useEffect(() => {
    startBackgroundMusic();

    const retryStartOnInteraction = () => {
      startBackgroundMusic();
    };

    window.addEventListener("pointerdown", retryStartOnInteraction, {
      passive: true,
    });
    window.addEventListener("keydown", retryStartOnInteraction);

    return () => {
      window.removeEventListener("pointerdown", retryStartOnInteraction);
      window.removeEventListener("keydown", retryStartOnInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (introTimeoutRef.current) {
        window.clearTimeout(introTimeoutRef.current);
      }
    };
  }, [startBackgroundMusic]);

  return (
    <div className="soft-grain soft-vignette relative w-full h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-[-3.5rem] h-72 w-72 rounded-full bg-rose-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-[-4rem] h-80 w-80 rounded-full bg-amber-100/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(255,251,247,0.35)_100%)]" />
      <audio ref={audioRef} src="/audio/laufey.mp3" loop preload="auto" />
      {!showIntro && (
        <>
          <SpatialScene images={images} handData={handData} />
          <HandTracker onUpdate={handleHandUpdate} />
          <UIOverlay handData={handData} />
        </>
      )}
      {showIntro && (
        <IntroScreen isExiting={isIntroExiting} onContinue={handleContinue} />
      )}
    </div>
  );
};

export default App;
