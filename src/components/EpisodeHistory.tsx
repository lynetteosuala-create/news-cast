import React from 'react';
import { History, Play, Trash2, X, Clock, Train, Car, Download } from 'lucide-react';
import { GeneratedEpisode } from '../types';

interface EpisodeHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  savedEpisodes: GeneratedEpisode[];
  onSelectEpisode: (ep: GeneratedEpisode) => void;
  onDeleteEpisode: (id: string) => void;
}

export const EpisodeHistory: React.FC<EpisodeHistoryProps> = ({
  isOpen,
  onClose,
  savedEpisodes,
  onSelectEpisode,
  onDeleteEpisode,
}) => {
  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full p-6 flex flex-col justify-between shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Saved Commute Briefings</h3>
                <p className="text-xs text-zinc-400">Past custom audio digests</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Episode List */}
          {savedEpisodes.length === 0 ? (
            <div className="text-center py-12 px-4 text-zinc-500">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No saved briefings yet</p>
              <p className="text-xs text-zinc-600 mt-1">
                Synthesize your first commute audio to have it saved here for quick playback.
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
              {savedEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {formatDate(ep.createdAt)}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {ep.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteEpisode(ep.id)}
                      className="text-zinc-600 hover:text-red-400 p-1"
                      title="Delete saved briefing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {formatDuration(ep.actualDurationSeconds)}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{ep.commuteMode} Mode</span>
                    <span>•</span>
                    <span>Voice: {ep.voice}</span>
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectEpisode(ep);
                        onClose();
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play Briefing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
