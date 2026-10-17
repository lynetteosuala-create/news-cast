import React from 'react';
import { Radio, Car, Train, Footprints, Bike, Compass, History, Sparkles } from 'lucide-react';
import { CommuteMode } from '../types';

interface NavbarProps {
  commuteMode: CommuteMode;
  targetMinutes: number;
  onOpenCarMode: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  hasAudio: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  commuteMode,
  targetMinutes,
  onOpenCarMode,
  onOpenHistory,
  historyCount,
  hasAudio,
}) => {
  const getModeIcon = () => {
    switch (commuteMode) {
      case 'driving':
        return <Car className="w-4 h-4 text-emerald-400" />;
      case 'walking':
        return <Footprints className="w-4 h-4 text-amber-400" />;
      case 'cycling':
        return <Bike className="w-4 h-4 text-cyan-400" />;
      default:
        return <Train className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getModeLabel = () => {
    switch (commuteMode) {
      case 'driving':
        return 'Drive';
      case 'walking':
        return 'Walk';
      case 'cycling':
        return 'Bike';
      default:
        return 'Transit';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 shadow-lg shadow-indigo-500/20 text-white font-black">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-lg text-white font-['Plus_Jakarta_Sans']">
                CommuteCast<span className="text-amber-400">.ai</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Gemini 3.8 TTS
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Your commute, converted into personal audio news
            </p>
          </div>
        </div>

        {/* Status / Commute badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300">
          <div className="flex items-center gap-1.5">
            {getModeIcon()}
            <span className="font-medium text-white">{getModeLabel()} Mode</span>
          </div>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">Target: <strong className="text-amber-400">{targetMinutes}m</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {hasAudio && (
            <button
              onClick={onOpenCarMode}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-95"
              title="Open oversized touch controls for driving or transit"
            >
              <Car className="w-4 h-4" />
              <span>Car & Transit UI</span>
            </button>
          )}

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
            title="Saved Commute Briefings"
          >
            <History className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline">Saved</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
