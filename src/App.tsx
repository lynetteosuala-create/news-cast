import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Headphones,
  Radio,
  Sliders,
  Layers,
  Volume2,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CommuteSetup } from './components/CommuteSetup';
import { ArticleQueue } from './components/ArticleQueue';
import { ScriptViewer } from './components/ScriptViewer';
import { CommutePlayer } from './components/CommutePlayer';
import { CarModeModal } from './components/CarModeModal';
import { EpisodeHistory } from './components/EpisodeHistory';
import {
  Article,
  CommuteMode,
  ShowFormat,
  VoiceName,
  CommuteDigestScript,
  GeneratedEpisode,
} from './types';
import { SAMPLE_ARTICLES } from './data/sampleArticles';

export default function App() {
  // Commute configuration
  const [commuteMode, setCommuteMode] = useState<CommuteMode>('transit');
  const [targetMinutes, setTargetMinutes] = useState<number>(10);
  const [format, setFormat] = useState<ShowFormat>('solo_anchor');
  const [voice, setVoice] = useState<VoiceName>('Kore');
  const [duoVoices, setDuoVoices] = useState<{ host1: VoiceName; host2: VoiceName }>({
    host1: 'Puck',
    host2: 'Kore',
  });
  const [listenerName, setListenerName] = useState('Morning Commuter');
  const [focusAreas, setFocusAreas] = useState('Tech breakthroughs, urban commute impact, and key takeaways');

  // Pre-populate with first 2 interesting sample stories for immediate exploration
  const [articles, setArticles] = useState<Article[]>(() => [
    {
      id: 'art-sample-1',
      title: SAMPLE_ARTICLES[0].title,
      content: SAMPLE_ARTICLES[0].content,
      source: SAMPLE_ARTICLES[0].source,
      category: SAMPLE_ARTICLES[0].category,
      priority: SAMPLE_ARTICLES[0].priority,
      wordCount: SAMPLE_ARTICLES[0].content.split(/\s+/).length,
      addedAt: new Date().toISOString(),
    },
    {
      id: 'art-sample-2',
      title: SAMPLE_ARTICLES[1].title,
      content: SAMPLE_ARTICLES[1].content,
      source: SAMPLE_ARTICLES[1].source,
      category: SAMPLE_ARTICLES[1].category,
      priority: SAMPLE_ARTICLES[1].priority,
      wordCount: SAMPLE_ARTICLES[1].content.split(/\s+/).length,
      addedAt: new Date().toISOString(),
    },
  ]);

  // Generation & Episode State
  const [script, setScript] = useState<CommuteDigestScript | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<GeneratedEpisode | null>(null);
  const [savedEpisodes, setSavedEpisodes] = useState<GeneratedEpisode[]>(() => {
    try {
      const stored = localStorage.getItem('commutecast_saved_episodes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Loading states
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isSynthesizingFull, setIsSynthesizingFull] = useState(false);
  const [synthesizingProgress, setSynthesizingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isCarModeOpen, setIsCarModeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Save episodes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('commutecast_saved_episodes', JSON.stringify(savedEpisodes));
    } catch (e) {
      console.error('Failed to save episodes to localStorage:', e);
    }
  }, [savedEpisodes]);

  // 1. Generate Script using gemini-3.8-flash
  const handleGenerateScript = async () => {
    if (articles.length === 0) {
      setErrorMessage('Please add at least one news article to summarize.');
      return;
    }

    setIsGeneratingScript(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-digest-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles,
          commuteMinutes: targetMinutes,
          commuteMode,
          format,
          voice,
          duoVoices,
          focusAreas,
          listenerName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate commute script.');
      }

      setScript(data.script);

      // Scroll smoothly to script section
      setTimeout(() => {
        const el = document.getElementById('script-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Script generation error:', err);
      setErrorMessage(err.message || 'Error creating script. Please try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // 2. Synthesize Full Audio using gemini-3.8-flash-tts
  const handleSynthesizeFullAudio = async () => {
    if (!script) return;

    setIsSynthesizingFull(true);
    setSynthesizingProgress(15);
    setErrorMessage(null);

    const progressTimer = setInterval(() => {
      setSynthesizingProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 1200);

    try {
      const response = await fetch('/api/generate-full-episode-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: script.segments,
          format,
          voice,
          duoVoices,
        }),
      });

      clearInterval(progressTimer);
      setSynthesizingProgress(100);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Audio synthesis failed.');
      }

      const newEpisode: GeneratedEpisode = {
        id: `ep-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: script.episodeTitle,
        tagline: script.tagline,
        commuteMode,
        targetMinutes,
        actualDurationSeconds: data.totalDurationSeconds || script.estimatedMinutes * 60,
        format,
        voice,
        duoVoices,
        script,
        masterAudioBase64: data.masterAudioBase64,
        chapters: data.chapters || [],
      };

      setCurrentEpisode(newEpisode);
      setSavedEpisodes((prev) => [newEpisode, ...prev.slice(0, 9)]);

      // Scroll to player
      setTimeout(() => {
        const el = document.getElementById('player-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error('Audio synthesis error:', err);
      setErrorMessage(err.message || 'Audio synthesis failed. Please try again.');
    } finally {
      setIsSynthesizingFull(false);
    }
  };

  // One-click "Create Commute Briefing" (Generates script then automatically synthesizes audio!)
  const handleGenerateAllInOne = async () => {
    if (articles.length === 0) {
      setErrorMessage('Please add at least one article to your queue.');
      return;
    }

    setIsGeneratingScript(true);
    setErrorMessage(null);

    try {
      // Step 1: Script
      const scriptRes = await fetch('/api/generate-digest-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles,
          commuteMinutes: targetMinutes,
          commuteMode,
          format,
          voice,
          duoVoices,
          focusAreas,
          listenerName,
        }),
      });

      const scriptData = await scriptRes.json();
      if (!scriptRes.ok) throw new Error(scriptData.error || 'Script generation failed.');

      const genScript: CommuteDigestScript = scriptData.script;
      setScript(genScript);
      setIsGeneratingScript(false);

      // Step 2: Audio Synthesis
      setIsSynthesizingFull(true);
      setSynthesizingProgress(25);

      const progressTimer = setInterval(() => {
        setSynthesizingProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 1200);

      const audioRes = await fetch('/api/generate-full-episode-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: genScript.segments,
          format,
          voice,
          duoVoices,
        }),
      });

      clearInterval(progressTimer);
      setSynthesizingProgress(100);

      const audioData = await audioRes.json();
      if (!audioRes.ok) throw new Error(audioData.error || 'Audio synthesis failed.');

      const newEp: GeneratedEpisode = {
        id: `ep-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: genScript.episodeTitle,
        tagline: genScript.tagline,
        commuteMode,
        targetMinutes,
        actualDurationSeconds: audioData.totalDurationSeconds || genScript.estimatedMinutes * 60,
        format,
        voice,
        duoVoices,
        script: genScript,
        masterAudioBase64: audioData.masterAudioBase64,
        chapters: audioData.chapters || [],
      };

      setCurrentEpisode(newEp);
      setSavedEpisodes((prev) => [newEp, ...prev.slice(0, 9)]);

      setTimeout(() => {
        const el = document.getElementById('player-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      console.error('All-in-one generation error:', err);
      setErrorMessage(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsGeneratingScript(false);
      setIsSynthesizingFull(false);
    }
  };

  // Handle in-place script edit
  const handleUpdateSegment = (segId: string, updatedSpokenScript: string) => {
    if (!script) return;
    setScript({
      ...script,
      segments: script.segments.map((s) =>
        s.id === segId ? { ...s, spokenScript: updatedSpokenScript } : s
      ),
    });
  };

  // Delete saved episode
  const handleDeleteEpisode = (id: string) => {
    setSavedEpisodes((prev) => prev.filter((ep) => ep.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-amber-400 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        commuteMode={commuteMode}
        targetMinutes={targetMinutes}
        onOpenCarMode={() => setIsCarModeOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={savedEpisodes.length}
        hasAudio={!!currentEpisode?.masterAudioBase64}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-r from-indigo-950/60 via-zinc-900/80 to-amber-950/40 border border-zinc-800 shadow-2xl backdrop-blur-sm">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800/80 text-amber-300 border border-amber-400/20 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Personalized Commute News Broadcast</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300">Powered by Gemini 3.8 Flash TTS</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Turn today's news into your personal commute radio briefing.
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
              Select your travel mode, set your trip duration, and queue your articles. We synthesize a crisp, audio-first digest calibrated to the minute you arrive at your destination—with offline download for subway tunnels.
            </p>

            {/* Quick action bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateAllInOne}
                disabled={isGeneratingScript || isSynthesizingFull || articles.length === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isGeneratingScript || isSynthesizingFull ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {isGeneratingScript ? 'Writing Spoken Script...' : `Synthesizing Audio (${synthesizingProgress}%)...`}
                    </span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 fill-current" />
                    <span>Generate Commute Broadcast ({articles.length} Stories)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={isGeneratingScript || isSynthesizingFull || articles.length === 0}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Script & Dialogue Only</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-red-200">Broadcast Notice</h4>
              <p className="text-xs text-red-300/90 mt-0.5">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-400 hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Audio Player Section (if an episode exists) */}
        {currentEpisode && (
          <div id="player-section" className="scroll-mt-20">
            <CommutePlayer
              episode={currentEpisode}
              onOpenCarMode={() => setIsCarModeOpen(true)}
            />
          </div>
        )}

        {/* Commute Setup & Article Queue Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Commute Setup */}
          <CommuteSetup
            commuteMode={commuteMode}
            setCommuteMode={setCommuteMode}
            targetMinutes={targetMinutes}
            setTargetMinutes={setTargetMinutes}
            format={format}
            setFormat={setFormat}
            voice={voice}
            setVoice={setVoice}
            duoVoices={duoVoices}
            setDuoVoices={setDuoVoices}
            listenerName={listenerName}
            setListenerName={setListenerName}
            focusAreas={focusAreas}
            setFocusAreas={setFocusAreas}
          />

          {/* Column 2: Article Queue */}
          <ArticleQueue
            articles={articles}
            setArticles={setArticles}
            targetMinutes={targetMinutes}
          />
        </div>

        {/* Script Viewer & Segment Tweaker (if script generated) */}
        {script && (
          <div id="script-section" className="scroll-mt-20">
            <ScriptViewer
              script={script}
              onUpdateSegment={handleUpdateSegment}
              format={format}
              voice={voice}
              duoVoices={duoVoices}
              onSynthesizeFullShow={handleSynthesizeFullAudio}
              isSynthesizingFull={isSynthesizingFull}
              synthesizingProgress={synthesizingProgress}
              hasAudio={!!currentEpisode?.masterAudioBase64}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-zinc-400">CommuteCast AI</span>
            <span>•</span>
            <span>Interactive News Audio Briefings</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-500 text-[11px]">
            <span>Model: gemini-3.8-flash-tts</span>
            <span>•</span>
            <span>24kHz 16-bit WAV</span>
            <span>•</span>
            <span>Offline Capable</span>
          </div>
        </div>
      </footer>

      {/* Fullscreen Car / Transit Dashboard Mode Modal */}
      {currentEpisode && (
        <CarModeModal
          episode={currentEpisode}
          isOpen={isCarModeOpen}
          onClose={() => setIsCarModeOpen(false)}
        />
      )}

      {/* Saved Episodes Drawer */}
      <EpisodeHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedEpisodes={savedEpisodes}
        onSelectEpisode={(ep) => setCurrentEpisode(ep)}
        onDeleteEpisode={handleDeleteEpisode}
      />
    </div>
  );
}
