import React, { useState, useCallback } from "react";
import SpatialScene from "./components/SpatialScene";
import HandTracker from "./components/HandTracker";
import UIOverlay from "./components/UIOverlay";
import { HandData, ShowreelImage } from "./types";

// Using local images from public/images folder
const INITIAL_IMAGES: ShowreelImage[] = Array.from({ length: 16 }).map(
  (_, i) => ({
    id: `img-${i}`,
    url: `/images/${i + 1}.jpg`,
  }),
);

const App: React.FC = () => {
  // State is now static as upload functionality is removed
  const [images] = useState<ShowreelImage[]>(INITIAL_IMAGES);
  const [handData, setHandData] = useState<HandData>({
    x: 0.5,
    y: 0.5,
    isVisible: false,
    isTwoHandHeartDetected: false,
  });

  const handleHandUpdate = useCallback((data: HandData) => {
    setHandData(data);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-rose-50">
      <SpatialScene images={images} handData={handData} />
      <HandTracker onUpdate={handleHandUpdate} />
      <UIOverlay handData={handData} />
    </div>
  );
};

export default App;
