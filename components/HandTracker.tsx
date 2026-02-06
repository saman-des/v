import React, { useEffect, useRef, useState } from "react";
import { HandData } from "../types";

interface Props {
  onUpdate: (data: HandData) => void;
}

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 5],
  [5, 9],
  [9, 13],
  [13, 17],
  [0, 17],
];

const HandTracker: React.FC<Props> = ({ onUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHeartDetected, setIsHeartDetected] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!videoRef.current || !canvasRef.current) return;

    // @ts-ignore - MediaPipe globals are loaded from CDN.
    const hands = new window.Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: any) => {
      if (!isMounted) return;

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.clearRect(
          0,
          0,
          canvasRef.current!.width,
          canvasRef.current!.height,
        );

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const width = canvasRef.current!.width;
          const height = canvasRef.current!.height;

          for (const landmarks of results.multiHandLandmarks) {
            ctx.strokeStyle = "rgba(216, 124, 151, 0.95)";
            ctx.lineWidth = 2.25;
            ctx.lineCap = "round";

            for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
              const start = landmarks[startIdx];
              const end = landmarks[endIdx];
              ctx.beginPath();
              ctx.moveTo(start.x * width, start.y * height);
              ctx.lineTo(end.x * width, end.y * height);
              ctx.stroke();
            }

            ctx.fillStyle = "rgba(255, 248, 245, 0.95)";
            for (const landmark of landmarks) {
              ctx.beginPath();
              ctx.arc(landmark.x * width, landmark.y * height, 2, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }

        ctx.restore();
      }

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const allHands = results.multiHandLandmarks;
        const indexTip = allHands[0][8];

        let isTwoHandHeart = false;
        if (allHands.length === 2) {
          const h1 = allHands[0];
          const h2 = allHands[1];
          const dThumbs = Math.sqrt(
            Math.pow(h1[4].x - h2[4].x, 2) + Math.pow(h1[4].y - h2[4].y, 2),
          );
          const dIndices = Math.sqrt(
            Math.pow(h1[8].x - h2[8].x, 2) + Math.pow(h1[8].y - h2[8].y, 2),
          );

          if (dThumbs < 0.15 && dIndices < 0.15) {
            isTwoHandHeart = true;
          }
        }

        setIsHeartDetected(isTwoHandHeart);
        onUpdate({
          x: 1 - indexTip.x,
          y: indexTip.y,
          isVisible: true,
          isTwoHandHeartDetected: isTwoHandHeart,
        });
      } else {
        setIsHeartDetected(false);
        onUpdate({
          x: 0.5,
          y: 0.5,
          isVisible: false,
          isTwoHandHeartDetected: false,
        });
      }
    });

    // @ts-ignore - MediaPipe globals are loaded from CDN.
    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (!isMounted) return;
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }
        await hands.send({ image: videoRef.current! });
      },
      width: 480,
      height: 360,
    });

    camera
      .start()
      .then(() => {
        if (isMounted) setCameraError(null);
      })
      .catch((err: unknown) => {
        console.error("Camera start failed:", err);
        if (isMounted) {
          setCameraError(
            "Camera permission denied. Please allow access to use hand gestures.",
          );
        }
      });

    return () => {
      isMounted = false;
      try {
        camera.stop();
      } catch {
        // Ignore cleanup error if camera never started.
      }
      hands.close();
    };
  }, [onUpdate]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 md:bottom-8 md:right-8 md:gap-3">
      {isHeartDetected && (
        <div className="pointer-events-auto rounded-full border border-rose-200/70 bg-rose-100/80 px-4 py-1.5 shadow-lg backdrop-blur-xl">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700">
            Love detected
          </span>
        </div>
      )}

      {cameraError ? (
        <div className="glass-card pointer-events-auto max-w-[220px] rounded-2xl p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-800">
            Camera Error
          </p>
          <p className="text-[10px] leading-snug text-rose-900/80">{cameraError}</p>
        </div>
      ) : (
        <div className="glass-card pointer-events-auto relative h-20 w-28 overflow-hidden rounded-2xl border border-rose-200/60 md:h-36 md:w-48">
          <video
            ref={videoRef}
            className="h-full w-full -scale-x-100 object-cover opacity-85"
            autoPlay
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full -scale-x-100"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#704652]/40 to-transparent px-2 py-1">
            <p className="text-[9px] uppercase tracking-[0.2em] text-rose-50/90">
              live gesture
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandTracker;
