import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function FancyToggle({ 
  isPicked, 
  setIsPicked, 
  OnIcon = Sun, 
  OffIcon = Moon,
  onColor = "from-slate-400 to-slate-100",
  offColor = "from-amber-500 to-yellow-200",
  onIconColor = "text-slate-700",
  offIconColor = "text-amber-700"
}) {
  return (
    <div className="relative w-full h-8 flex items-center px-1">
      <div className="absolute w-full h-1 bg-zinc-800 rounded-full top-1/2 -translate-y-1/2" />

      <div 
        onClick={() => setIsPicked(prev => !prev)}
        className={`
          absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full shadow-2xl 
          flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out
          border-[3px] border-zinc-900 z-10
          ${isPicked 
            ? `left-[calc(100%-44px)] bg-linear-to-tr ${onColor} rotate-[360deg]` 
            : `-left-0 bg-linear-to-tr ${offColor} rotate-0`
          }
        `}
      >
        {isPicked ? (
          <OffIcon size={22} fill="currentColor" className={onIconColor} />
        ) : (
          <OnIcon size={24} fill="currentColor" className={offIconColor} />
        )}
      </div>
    </div>
  );
}