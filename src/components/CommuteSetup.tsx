import React, { useState } from 'react';
import {
  Train,
  Car,
  Footprints,
  Bike,
  Clock,
  Mic,
  Users,
  Briefcase,
  Coffee,
  Volume2,
  Sparkles,
  Sliders,
  Check,
  Play,
  Loader2,
} from 'lucide-react';
import { CommuteMode, ShowFormat, VoiceName } from '../types';
import { VOICE_OPTIONS } from '../data/sampleArticles';

interface CommuteSetupProps {
  commuteMode: CommuteMode;
  setCommuteMode: (mode: CommuteMode) => void;
  targetMinutes: number;
  setTargetMinutes: (min: number) => void;
  format: ShowFormat;
  setFormat: (format: ShowFormat) => void;
  voice: VoiceName;
  setVoice: (voice: VoiceName) => void;
  duoVoices: { host1: VoiceName; host2: VoiceName };
  setDuoVoices: (voices: { host1: VoiceName; host2: VoiceName }) => void;
  listenerName: string;
  setListenerName: (name: string) => void;
  focusAreas: string;
  setFocusAreas: (focus: string) => void;
}

export const CommuteSetup: React.FC<CommuteSetupProps> = ({
  commuteMode,
  setCommuteMode,
  targetMinutes,
  setTargetMinutes,
  format,
  setFormat,
  voice,
  setVoice,
  duoVoices,
  setDuoVoices,
  listenerName,
  setListenerName,
  focusAreas,
  setFocusAreas,
}) => {
  const [previewingVoice, setPreviewingVoice] = useState<VoiceName | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  // Quick duration presets
  const durationPresets = [3, 5, 10, 15, 20, 25];

  // Quick focus tags
  const focusTags = [
    'Tech & Future Innovation',
    'Financial Markets & Pocketbook',
    'Actionable Daily Takeaways',
    'Urban Transit & Commute Impacts',
    'Clean Energy & Climate',
    'Health & Work-Life Balance',
  ];

  const handlePreviewVoice = async (vName: VoiceName, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeAudio) {
      activeAudio.pause();
      setActiveAudio(null);
    }
    if (previewingVoice === vName) {
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(vName);
    try {
      const sampleText = `Good morning! This is ${vName}, your AI host for today's commute digest. Let's get you briefed.`;
      const res = await fetch('/api/synthesize-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          format: 'solo_anchor',
          voice: vName,
          style: 'Energetic, warm news broadcast anchor',
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        setActiveAudio(audio);
        audio.play();
        audio.onended = () => {
          setPreviewingVoice(null);
          setActiveAudio(null);
        };
      } else {
        setPreviewingVoice(null);
      }
    } catch (err) {
      console.error('Preview voice error:', err);
      setPreviewingVoice(null);
    }
  };

  const handleAddFocusTag = (tag: string) => {
    if (!focusAreas) {
      setFocusAreas(tag);
    } else if (!focusAreas.includes(tag)) {
      setFocusAreas(`${focusAreas}, ${tag}`);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              1. Commute Profile & Voice Tuning
            </h2>
            <p className="text-xs text-zinc-400">
              Calibrate audio length, pacing, and AI host style to your trip
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Mode & Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Commute Mode */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Train className="w-3.5 h-3.5 text-indigo-400" />
            Commute Mode
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'transit', label: 'Transit / Metro', icon: Train, color: 'text-indigo-400' },
              { id: 'driving', label: 'Driving / Car', icon: Car, color: 'text-emerald-400' },
              { id: 'walking', label: 'Walking', icon: Footprints, color: 'text-amber-400' },
              { id: 'cycling', label: 'Bike / Scooter', icon: Bike, color: 'text-cyan-400' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = commuteMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCommuteMode(item.id as CommuteMode)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-zinc-800 border-indigo-500 text-white ring-2 ring-indigo-500/20 shadow-md'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${item.color}`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Commute Duration Target */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Target Commute Time
            </label>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
              {targetMinutes} minutes (~{Math.round(targetMinutes * 135)} words)
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {durationPresets.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setTargetMinutes(mins)}
                className={`flex-1 min-w-[48px] py-2 rounded-lg text-xs font-semibold border transition-all ${
                  targetMinutes === mins
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          <div className="pt-1">
            <input
              type="range"
              min={2}
              max={30}
              step={1}
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
              <span>2m (Quick dash)</span>
              <span>10m (Standard)</span>
              <span>30m (Long rail ride)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Show Format */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-violet-400" />
          Broadcast Format & Delivery
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            {
              id: 'solo_anchor',
              title: 'Solo Commute Anchor',
              desc: 'Authoritative, brisk, newsroom broadcast cadence',
              icon: Mic,
              badge: 'Fast & Punchy',
            },
            {
              id: 'duo_hosts',
              title: 'Morning Drive Duo',
              desc: 'Two hosts (Alex & Sam) with witty banter & backchanneling',
              icon: Users,
              badge: 'Podcast Banter',
            },
            {
              id: 'executive',
              title: 'Executive Briefing',
              desc: 'High signal-to-noise bullets, market impacts, key metrics',
              icon: Briefcase,
              badge: 'High Signal',
            },
            {
              id: 'chill_storyteller',
              title: 'Warm Storyteller',
              desc: 'Relaxed, conversational flow with narrative depth',
              icon: Coffee,
              badge: 'Calm & Flowing',
            },
          ].map((fmt) => {
            const Icon = fmt.icon;
            const isSelected = format === fmt.id;
            return (
              <div
                key={fmt.id}
                onClick={() => setFormat(fmt.id as ShowFormat)}
                className={`relative p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-zinc-800/90 border-violet-500 text-white ring-2 ring-violet-500/20 shadow-md'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-violet-400/20 text-violet-300' : 'bg-zinc-800 text-zinc-400'}`}>
                    {fmt.badge}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{fmt.title}</h4>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{fmt.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Voice Selection */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            {format === 'duo_hosts' ? 'Duo Host Voices (Alex & Sam)' : 'Host Voice (Gemini 3.8 Flash TTS)'}
          </label>
          <span className="text-[11px] text-zinc-400">Click speaker icon to sample voice</span>
        </div>

        {format === 'duo_hosts' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800">
            <div>
              <label className="text-xs font-medium text-amber-300 block mb-1.5">Host 1: Alex (Lead Host)</label>
              <select
                value={duoVoices.host1}
                onChange={(e) => setDuoVoices({ ...duoVoices, host1: e.target.value as VoiceName })}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.tagline})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-indigo-300 block mb-1.5">Host 2: Sam (Co-Host)</label>
              <select
                value={duoVoices.host2}
                onChange={(e) => setDuoVoices({ ...duoVoices, host2: e.target.value as VoiceName })}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.tagline})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {VOICE_OPTIONS.map((v) => {
              const isSelected = voice === v.id;
              const isAudioPlaying = previewingVoice === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  className={`relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-800/95 border-emerald-500 text-white ring-2 ring-emerald-500/20 shadow-md'
                      : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{v.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-[10px] text-zinc-500 capitalize">{v.gender}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handlePreviewVoice(v.id, e)}
                      title={`Sample ${v.name}'s voice`}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isAudioPlaying
                          ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {isAudioPlaying ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-tight">
                    {v.tagline}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Personalization details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-zinc-800/80">
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1">
            Listener Name (Greeting)
          </label>
          <input
            type="text"
            value={listenerName}
            onChange={(e) => setListenerName(e.target.value)}
            placeholder="e.g. Alex, Morning Commuter"
            className="w-full bg-zinc-950/70 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-zinc-300">
              Personal Commute Focus
            </label>
            <span className="text-[10px] text-zinc-500">Pick tags or type custom instructions</span>
          </div>
          <input
            type="text"
            value={focusAreas}
            onChange={(e) => setFocusAreas(e.target.value)}
            placeholder="e.g. Focus on practical takeaways, market reactions, and commute tips"
            className="w-full bg-zinc-950/70 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none mb-1.5"
          />
          <div className="flex flex-wrap gap-1">
            {focusTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddFocusTag(tag)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-300 hover:border-amber-500/30 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
