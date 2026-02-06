import React from 'react';
import { HandData } from '../types';

interface Props {
  handData: HandData;
}

const UIOverlay: React.FC<Props> = ({ handData }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-4 md:p-8 flex flex-col justify-between">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm md:text-xl font-black text-rose-600 tracking-tighter italic drop-shadow-sm uppercase">
            SPATIAL MEMORIES
          </h1>
          <p className="text-rose-400 text-[6px] md:text-[8px] font-black tracking-[0.4em] uppercase opacity-70">
            Interactive 3D Carousel
          </p>
        </div>
      </div>

      <div className="flex justify-start">
        <div className="bg-white/80 backdrop-blur-xl p-3 md:p-5 rounded-2xl md:rounded-[2rem] shadow-2xl border border-rose-100 max-w-[160px] md:max-w-[220px] pointer-events-auto">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-500 ${handData.isVisible ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
            <h3 className="text-[6px] md:text-[7px] font-black text-slate-800 uppercase tracking-[0.2em]">
              {handData.isVisible ? 'Tracking Active' : 'Show hand'}
            </h3>
          </div>
          <div className="pt-2 md:pt-3 border-t border-rose-100">
            <p className="text-[6px] md:text-[7px] text-rose-500 font-bold uppercase tracking-[0.12em] leading-relaxed">
              <span className="text-rose-400">Hand/Mouse:</span> Spin Carousel <br/>
              <span className="text-rose-400">Scroll/Pinch:</span> Zoom In/Out <br/>
              <span className="text-rose-400">🫶:</span> Pulse Effect
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;