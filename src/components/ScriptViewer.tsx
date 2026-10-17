import React, { useState } from 'react';
import {
  FileText,
  Volume2,
  Edit3,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { CommuteDigestScript, ScriptSegment, ShowFormat, VoiceName } from '../types';

interface ScriptViewerProps {
  script: CommuteDigestScript;
  onUpdateSegment: (segmentId: string, updatedSpokenScript: string) => void;
  format: ShowFormat;
  voice: VoiceName;
  duoVoices: { host1: VoiceName; host2: VoiceName };
  onSynthesizeFullShow: () => void;
  isSynthesizingFull: boolean;
  synthesizingProgress: number;
  hasAudio: boolean;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({
  script,
  onUpdateSegment,
  format,
  voice,
  duoVoices,
  onSynthesizeFullShow,
  isSynthesizingFull,
  synthesizingProgress,
  hasAudio,
}) => {
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [expandedSegments, setExpandedSegments] = useState<Record<string, boolean>>({
    [script.segments[0]?.id || '']: true,
  });

  const [previewingSegmentId, setPreviewingSegmentId] = useState<string | null>(null);
  const [singleSegmentAudio, setSingleSegmentAudio] = useState<HTMLAudioElement | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSegments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEdit = (seg: ScriptSegment) => {
    setEditingSegmentId(seg.id);
    setEditText(seg.spokenScript);
  };

  const saveEdit = (segId: string) => {
    onUpdateSegment(segId, editText);
    setEditingSegmentId(null);
  };

  const handlePreviewSingleSegment = async (seg: ScriptSegment) => {
    if (singleSegmentAudio) {
      singleSegmentAudio.pause();
      setSingleSegmentAudio(null);
    }
    if (previewingSegmentId === seg.id) {
      setPreviewingSegmentId(null);
      return;
    }

    setPreviewingSegmentId(seg.id);
    try {
      const res = await fetch('/api/synthesize-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: seg.spokenScript,
          dialogue: seg.dialogue,
          format,
          voice,
          duoVoices,
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        setSingleSegmentAudio(audio);
        audio.play();
        audio.onended = () => {
          setPreviewingSegmentId(null);
          setSingleSegmentAudio(null);
        };
      } else {
        setPreviewingSegmentId(null);
      }
    } catch (err) {
      console.error('Preview single segment error:', err);
      setPreviewingSegmentId(null);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
              Ready to Broadcast
            </span>
            <span className="text-xs text-zinc-400">
              ~{script.estimatedMinutes} min spoken audio
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            {script.episodeTitle}
          </h2>
          <p className="text-xs text-zinc-400 italic mt-0.5">{script.tagline}</p>
        </div>

        {/* Master Synthesize Button */}
        <button
          type="button"
          onClick={onSynthesizeFullShow}
          disabled={isSynthesizingFull}
          className={`relative group flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-black transition-all shadow-lg ${
            isSynthesizingFull
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : hasAudio
              ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/20'
              : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-amber-500/20 hover:scale-[1.02]'
          }`}
        >
          {isSynthesizingFull ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              <span>Generating Audio ({synthesizingProgress}%)...</span>
            </>
          ) : hasAudio ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Re-Synthesize Audio (TTS)</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Synthesize Commute Audio (TTS)</span>
            </>
          )}
        </button>
      </div>

      {/* Commute Tip */}
      {script.commuteTip && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>
            <strong>Commuter Tip:</strong> {script.commuteTip}
          </span>
        </div>
      )}

      {/* Progress Bar when synthesizing */}
      {isSynthesizingFull && (
        <div className="space-y-1.5 p-4 rounded-xl bg-zinc-950/80 border border-amber-500/30">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-amber-300 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Synthesizing audio with gemini-3.8-flash-tts...
            </span>
            <span className="text-zinc-400">{synthesizingProgress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300 rounded-full"
              style={{ width: `${synthesizingProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 text-center pt-1">
            Converting script chapters into high-fidelity 24kHz WAV audio for offline commute listening.
          </p>
        </div>
      )}

      {/* Segments List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            Episode Chapters & Script ({script.segments.length})
          </label>
          <span className="text-[11px] text-zinc-400">Click any chapter to review or tweak wording</span>
        </div>

        <div className="space-y-2.5">
          {script.segments.map((seg, idx) => {
            const isExpanded = !!expandedSegments[seg.id];
            const isEditing = editingSegmentId === seg.id;
            const isPlayingPreview = previewingSegmentId === seg.id;

            return (
              <div
                key={seg.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden transition-all"
              >
                {/* Segment Header */}
                <div
                  onClick={() => toggleExpand(seg.id)}
                  className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {seg.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 capitalize">
                          {seg.segmentType}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">
                        Speaker: {seg.primarySpeaker} • {seg.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewSingleSegment(seg);
                      }}
                      title="Preview this segment's audio"
                      className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all ${
                        isPlayingPreview
                          ? 'bg-amber-500 text-black border-amber-400 animate-pulse'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {isPlayingPreview ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                      <span className="hidden sm:inline text-[10px]">Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEditing) {
                          saveEdit(seg.id);
                        } else {
                          startEdit(seg);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-800"
                      title={isEditing ? 'Save changes' : 'Edit text'}
                    >
                      {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5" />}
                    </button>

                    <div className="text-zinc-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Segment Body */}
                {isExpanded && (
                  <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 space-y-3">
                    {/* Key Takeaways */}
                    {seg.takeaways && seg.takeaways.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                          Commute Takeaways
                        </span>
                        <ul className="list-disc list-inside text-xs text-zinc-300 space-y-0.5">
                          {seg.takeaways.map((t, tIdx) => (
                            <li key={tIdx} className="leading-relaxed">
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Spoken Text (Editable) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-zinc-400">
                          Spoken Audio Script:
                        </span>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startEdit(seg)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300"
                          >
                            Edit Wording
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            rows={4}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-zinc-950 border border-indigo-500 text-white rounded-lg p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSegmentId(null)}
                              className="px-3 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEdit(seg.id)}
                              className="px-3 py-1 rounded text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500"
                            >
                              Save Script Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed bg-zinc-950/70 p-3 rounded-lg border border-zinc-800/80 font-['Plus_Jakarta_Sans']">
                          {seg.spokenScript}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
