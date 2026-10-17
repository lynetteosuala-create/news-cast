import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Car,
  Bell,
  Clock,
  Check,
  ListMusic,
  FileText,
  Sparkles,
  Radio,
} from 'lucide-react';
import { GeneratedEpisode, ScriptSegment } from '../types';

interface CommutePlayerProps {
  episode: GeneratedEpisode;
  onOpenCarMode: () => void;
}

export const CommutePlayer: React.FC<CommutePlayerProps> = ({
  episode,
  onOpenCarMode,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode.actualDurationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'chapters' | 'transcript'>('chapters');

  // Commute station stop timer / alarm
  const [stationAlarmMinutes, setStationAlarmMinutes] = useState<number | null>(null);
  const [stationAlertFired, setStationAlertFired] = useState(false);
  const [alarmSecondsRemaining, setAlarmSecondsRemaining] = useState<number | null>(null);

  // Speed options
  const speedOptions = [0.8, 1.0, 1.2, 1.5, 1.75, 2.0];

  // Set up audio object on mount or when episode changes
  useEffect(() => {
    if (!episode.masterAudioBase64) return;

    const audioUrl = `data:audio/wav;base64,${episode.masterAudioBase64}`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.playbackRate = playbackRate;

    return () => {
      audio.pause();
      audio.src = '';
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [episode.id, episode.masterAudioBase64]);

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  // Skip 15s backward
  const handleRewind15 = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
  };

  // Skip 30s forward
  const handleForward30 = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 30);
  };

  // Change speed
  const handleSetSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Jump to specific chapter
  const handleJumpToChapter = (startTime: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = startTime;
    if (!isPlaying) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  // Determine current active chapter index
  const currentChapterIndex = episode.chapters.reduce((acc, ch, idx) => {
    if (currentTime >= ch.startTime) return idx;
    return acc;
  }, 0);

  const currentChapter = episode.chapters[currentChapterIndex] || episode.chapters[0];

  // Previous Chapter
  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      handleJumpToChapter(episode.chapters[currentChapterIndex - 1].startTime);
    } else {
      handleJumpToChapter(0);
    }
  };

  // Next Chapter
  const handleNextChapter = () => {
    if (currentChapterIndex < episode.chapters.length - 1) {
      handleJumpToChapter(episode.chapters[currentChapterIndex + 1].startTime);
    }
  };

  // Seek bar
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // Station Stop / Alarm Countdown
  useEffect(() => {
    if (!stationAlarmMinutes) {
      setAlarmSecondsRemaining(null);
      return;
    }

    const targetSec = stationAlarmMinutes * 60;
    setAlarmSecondsRemaining(targetSec);
    setStationAlertFired(false);

    const interval = setInterval(() => {
      setAlarmSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          setStationAlertFired(true);
          // Play a friendly beep or notification chime
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
          } catch (e) {
            console.error(e);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stationAlarmMinutes]);

  // Animated Waveform Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 48;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 6;
        if (isPlaying) {
          // Dynamic wave pattern
          const sinVal = Math.sin(phase + i * 0.25);
          const cosVal = Math.cos(phase * 1.5 + i * 0.4);
          barHeight = Math.max(6, Math.abs(sinVal * cosVal) * (height - 8));
        }

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, '#f59e0b'); // amber-500
          gradient.addColorStop(0.5, '#6366f1'); // indigo-500
          gradient.addColorStop(1, '#10b981'); // emerald-500
        } else {
          gradient.addColorStop(0, '#3f3f46');
          gradient.addColorStop(1, '#27272a');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.08 * playbackRate;
      }
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackRate]);

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Download WAV file for offline subway listening
  const handleDownloadWav = () => {
    if (!episode.masterAudioBase64) return;
    const blob = new Blob([Buffer.from(episode.masterAudioBase64, 'base64')], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${episode.title.replace(/[^a-zA-Z0-9]/g, '_')}_CommuteCast.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Broadcasting via Gemini 3.8 Flash TTS
            </span>
            <span className="text-xs text-zinc-400">
              Voice: <strong className="text-white">{episode.voice}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {episode.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{episode.tagline}</p>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCarMode}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md hover:scale-[1.02]"
          >
            <Car className="w-4 h-4" />
            <span>Dashboard Mode</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadWav}
            title="Download .WAV audio for offline subway travel"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Offline WAV</span>
          </button>
        </div>
      </div>

      {/* Currently Playing Chapter Box */}
      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-amber-400">
            Now Playing • Chapter {currentChapterIndex + 1} of {episode.chapters.length}
          </span>
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-1">
          {currentChapter?.title || episode.title}
        </h3>

        {/* Animated Visualizer Canvas */}
        <div className="mt-4 mb-2">
          <canvas
            ref={canvasRef}
            width={600}
            height={48}
            className="w-full h-12 rounded-lg bg-zinc-900/50"
          />
        </div>

        {/* Scrubber with Chapter Markers */}
        <div className="space-y-1.5 pt-1">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-800 rounded-lg relative z-10"
            />
            {/* Chapter dots on track */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 pointer-events-none flex">
              {duration > 0 &&
                episode.chapters.map((ch, idx) => {
                  const leftPercent = (ch.startTime / duration) * 100;
                  return (
                    <div
                      key={idx}
                      style={{ left: `${leftPercent}%` }}
                      className="absolute -top-1 w-1.5 h-3 bg-zinc-500 rounded-full opacity-60"
                      title={ch.title}
                    />
                  );
                })}
            </div>
          </div>

          <div className="flex justify-between text-xs font-mono text-zinc-400">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Speed presets */}
        <div className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 px-2">Speed</span>
          {speedOptions.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleSetSpeed(rate)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                playbackRate === rate
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Primary Playback buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handlePrevChapter}
            title="Previous Chapter"
            className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleRewind15}
            title="Rewind 15 seconds"
            className="p-2.5 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black flex items-center justify-center shadow-lg shadow-amber-500/25 transition-transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={handleForward30}
            title="Fast forward 30 seconds"
            className="p-2.5 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNextChapter}
            title="Next Chapter"
            className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Station Stop Timer / Volume */}
        <div className="flex items-center gap-2">
          {/* Station alarm button */}
          <div className="relative">
            <select
              value={stationAlarmMinutes || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                setStationAlarmMinutes(val);
              }}
              className="bg-zinc-950/70 border border-zinc-800 text-zinc-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-400 focus:outline-none"
            >
              <option value="">🔔 Station Alert: Off</option>
              <option value="5">Alert in 5 min</option>
              <option value="10">Alert in 10 min</option>
              <option value="15">Alert in 15 min</option>
              <option value="20">Alert in 20 min</option>
            </select>
          </div>

          {alarmSecondsRemaining !== null && alarmSecondsRemaining > 0 && (
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {formatTime(alarmSecondsRemaining)}
            </span>
          )}
        </div>
      </div>

      {/* Station Alert Notification */}
      {stationAlertFired && (
        <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-200 text-xs flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="font-bold">
              Commute Station Arrival Alert! You've reached your scheduled stop.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setStationAlertFired(false);
              setStationAlarmMinutes(null);
            }}
            className="px-2.5 py-1 rounded bg-amber-400 text-black font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Interactive Tabs: Chapters vs Transcript */}
      <div className="pt-2">
        <div className="flex border-b border-zinc-800 text-xs font-semibold mb-3">
          <button
            type="button"
            onClick={() => setActiveTab('chapters')}
            className={`flex items-center gap-1.5 px-4 py-2 border-b-2 transition-all ${
              activeTab === 'chapters'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            Interactive Chapters ({episode.chapters.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-1.5 px-4 py-2 border-b-2 transition-all ${
              activeTab === 'transcript'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Synchronized Transcript
          </button>
        </div>

        {/* Tab 1: Chapters list */}
        {activeTab === 'chapters' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {episode.chapters.map((ch, idx) => {
              const isCurrent = currentChapterIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleJumpToChapter(ch.startTime)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/40 text-white ring-1 ring-amber-500/20'
                      : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCurrent ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium truncate">{ch.title}</span>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-500 shrink-0 ml-2">
                    {formatTime(ch.startTime)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Synchronized Transcript */}
        {activeTab === 'transcript' && (
          <div className="max-h-72 overflow-y-auto space-y-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
            {episode.script.segments.map((seg, idx) => {
              const isCurrent = currentChapterIndex === idx;
              return (
                <div
                  key={seg.id}
                  onClick={() => {
                    const ch = episode.chapters.find((c) => c.segmentId === seg.id);
                    if (ch) handleJumpToChapter(ch.startTime);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/30 text-white'
                      : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-400">
                      Chapter {idx + 1}: {seg.title}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Speaker: {seg.primarySpeaker}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">{seg.spokenScript}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
