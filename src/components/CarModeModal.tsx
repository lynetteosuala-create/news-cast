import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  X,
  Car,
  Volume2,
} from 'lucide-react';
import { GeneratedEpisode } from '../types';

interface CarModeModalProps {
  episode: GeneratedEpisode;
  isOpen: boolean;
  onClose: () => void;
}

export const CarModeModal: React.FC<CarModeModalProps> = ({
  episode,
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode.actualDurationSeconds || 0);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen || !episode.masterAudioBase64) return;

    const a = new Audio(`data:audio/wav;base64,${episode.masterAudioBase64}`);
    setAudio(a);

    a.onloadedmetadata = () => {
      if (a.duration && !isNaN(a.duration)) setDuration(a.duration);
    };

    a.ontimeupdate = () => {
      setCurrentTime(a.currentTime);
    };

    a.onended = () => {
      setIsPlaying(false);
    };

    // Auto-play when entering dashboard mode
    a.play().then(() => setIsPlaying(true)).catch(() => {});

    return () => {
      a.pause();
      a.src = '';
    };
  }, [isOpen, episode.id]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleRewind15 = () => {
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 15);
  };

  const handleForward30 = () => {
    if (!audio) return;
    audio.currentTime = Math.min(duration, audio.currentTime + 30);
  };

  const currentChapterIndex = episode.chapters.reduce((acc, ch, idx) => {
    if (currentTime >= ch.startTime) return idx;
    return acc;
  }, 0);

  const currentChapter = episode.chapters[currentChapterIndex] || episode.chapters[0];

  const handlePrev = () => {
    if (!audio) return;
    if (currentChapterIndex > 0) {
      audio.currentTime = episode.chapters[currentChapterIndex - 1].startTime;
    } else {
      audio.currentTime = 0;
    }
  };

  const handleNext = () => {
    if (!audio) return;
    if (currentChapterIndex < episode.chapters.length - 1) {
      audio.currentTime = episode.chapters[currentChapterIndex + 1].startTime;
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 sm:p-10 select-none animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
              Dashboard & Transit Mode
            </span>
            <h2 className="text-lg font-bold text-white truncate max-w-sm sm:max-w-xl">
              {episode.title}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-4 rounded-2xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Exit Dashboard Mode"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Main Focus: Chapter Headline */}
      <div className="text-center my-auto space-y-6">
        <div className="inline-block px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 text-sm font-bold">
          Chapter {currentChapterIndex + 1} of {episode.chapters.length}
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
          {currentChapter?.title}
        </h1>

        <div className="text-xl sm:text-2xl font-mono text-zinc-400 font-bold">
          {formatTime(currentTime)} <span className="text-zinc-600">/</span> {formatTime(duration)}
        </div>

        {/* Big Progress bar */}
        <div className="max-w-2xl mx-auto h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Oversized Touch Controls */}
      <div className="flex items-center justify-center gap-6 sm:gap-10 pb-6">
        <button
          type="button"
          onClick={handlePrev}
          className="p-5 rounded-3xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
          title="Previous Chapter"
        >
          <SkipBack className="w-8 h-8" />
        </button>

        <button
          type="button"
          onClick={handleRewind15}
          className="p-5 rounded-3xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
          title="Rewind 15s"
        >
          <RotateCcw className="w-8 h-8" />
        </button>

        <button
          type="button"
          onClick={togglePlay}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-emerald-400 text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-12 h-12 fill-current" />
          ) : (
            <Play className="w-12 h-12 fill-current ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={handleForward30}
          className="p-5 rounded-3xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
          title="Fast Forward 30s"
        >
          <RotateCw className="w-8 h-8" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="p-5 rounded-3xl bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
          title="Next Chapter"
        >
          <SkipForward className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};
