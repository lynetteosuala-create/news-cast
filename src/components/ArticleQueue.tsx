import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Link,
  FileText,
  Sparkles,
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { Article } from '../types';
import { SAMPLE_ARTICLES } from '../data/sampleArticles';

interface ArticleQueueProps {
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  targetMinutes: number;
}

export const ArticleQueue: React.FC<ArticleQueueProps> = ({
  articles,
  setArticles,
  targetMinutes,
}) => {
  const [activeTab, setActiveTab] = useState<'sample' | 'paste' | 'url'>('sample');

  // Paste form state
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteCategory, setPasteCategory] = useState('Technology');
  const [pastePriority, setPastePriority] = useState<'deep_dive' | 'takeaways' | 'brief'>('takeaways');

  // URL form state
  const [inputUrl, setInputUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Quick categories
  const categories = ['Technology', 'Transit & Cities', 'Business & Life', 'Science', 'Economy & Climate', 'World News'];

  // Calculate estimated total audio duration
  // Approx 135 words per minute of spoken audio
  const totalWords = articles.reduce((acc, a) => acc + (a.content.split(/\s+/).filter(Boolean).length || 0), 0);
  const estimatedSpokenMinutes = Math.max(1, Math.round(articles.length * 2.2));

  // Add sample article
  const handleAddSample = (sample: (typeof SAMPLE_ARTICLES)[0]) => {
    // Check if already in queue
    if (articles.some((a) => a.title === sample.title)) return;

    const newArticle: Article = {
      id: `art-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: sample.title,
      content: sample.content,
      source: sample.source,
      category: sample.category,
      priority: sample.priority,
      wordCount: sample.content.split(/\s+/).filter(Boolean).length,
      addedAt: new Date().toISOString(),
    };
    setArticles((prev) => [...prev, newArticle]);
  };

  // Add all trending samples
  const handleAddAllSamples = () => {
    const newArticles = SAMPLE_ARTICLES.filter((s) => !articles.some((a) => a.title === s.title)).map((s, idx) => ({
      id: `art-${Date.now()}-${idx}`,
      title: s.title,
      content: s.content,
      source: s.source,
      category: s.category,
      priority: s.priority,
      wordCount: s.content.split(/\s+/).filter(Boolean).length,
      addedAt: new Date().toISOString(),
    }));
    setArticles((prev) => [...prev, ...newArticles]);
  };

  // Submit pasted article
  const handleAddPasted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteTitle.trim() || !pasteContent.trim()) return;

    const newArticle: Article = {
      id: `art-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: pasteTitle.trim(),
      content: pasteContent.trim(),
      source: 'Custom Pasted Text',
      category: pasteCategory,
      priority: pastePriority,
      wordCount: pasteContent.split(/\s+/).filter(Boolean).length,
      addedAt: new Date().toISOString(),
    };
    setArticles((prev) => [...prev, newArticle]);
    setPasteTitle('');
    setPasteContent('');
  };

  // Submit URL extraction
  const handleExtractUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsExtracting(true);
    setExtractError(null);

    try {
      const res = await fetch('/api/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract article content.');
      }

      const newArticle: Article = {
        id: `art-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: data.title || 'Extracted Web Article',
        content: data.content || '',
        source: data.source || data.domain || 'Web Source',
        url: inputUrl.trim(),
        category: 'Web News',
        priority: 'takeaways',
        wordCount: (data.content || '').split(/\s+/).filter(Boolean).length,
        addedAt: new Date().toISOString(),
      };

      setArticles((prev) => [...prev, newArticle]);
      setInputUrl('');
    } catch (err: any) {
      setExtractError(err.message || 'Error extracting article. Try pasting text directly.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Remove article
  const handleRemove = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  // Move article up/down in playlist
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === articles.length - 1) return;

    const newArticles = [...articles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newArticles[index];
    newArticles[index] = newArticles[targetIndex];
    newArticles[targetIndex] = temp;
    setArticles(newArticles);
  };

  // Update priority
  const handleSetPriority = (id: string, priority: 'deep_dive' | 'takeaways' | 'brief') => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, priority } : a)));
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              2. News Articles & Commute Playlist
            </h2>
            <p className="text-xs text-zinc-400">
              Provide news stories, paste notes, or pick from today's trending stories
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xs text-zinc-400">
              <strong className="text-white">{articles.length}</strong> {articles.length === 1 ? 'story' : 'stories'} queued
            </span>
            <div className="text-[11px] text-zinc-500">
              Estimated show length: <strong className="text-amber-400">~{estimatedSpokenMinutes} min</strong> vs {targetMinutes}m target
            </div>
          </div>
        </div>
      </div>

      {/* Input Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-zinc-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('sample')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'sample'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Trending Commute Stories ({SAMPLE_ARTICLES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'paste'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Text or Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all ${
              activeTab === 'url'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            Import by URL
          </button>
        </div>

        {/* Tab 1: Trending Samples */}
        {activeTab === 'sample' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Click any story to add it into your personalized commute briefing:
              </p>
              <button
                type="button"
                onClick={handleAddAllSamples}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                + Add All ({SAMPLE_ARTICLES.length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {SAMPLE_ARTICLES.map((sample, idx) => {
                const isAdded = articles.some((a) => a.title === sample.title);
                return (
                  <div
                    key={idx}
                    onClick={() => !isAdded && handleAddSample(sample)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isAdded
                        ? 'bg-zinc-950/20 border-zinc-800/60 opacity-60'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {sample.category}
                      </span>
                      <span className="text-[10px] text-zinc-500">{sample.source}</span>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-200 line-clamp-2 mb-1.5 leading-snug">
                      {sample.title}
                    </h4>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-zinc-500">
                        ~{sample.content.split(/\s+/).length} words
                      </span>
                      {isAdded ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <Check className="w-3 h-3" /> Queued
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300">
                          <Plus className="w-3.5 h-3.5" /> Add to Commute
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Paste Article Text */}
        {activeTab === 'paste' && (
          <form onSubmit={handleAddPasted} className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Article Headline / Title</label>
                <input
                  type="text"
                  required
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="e.g. Major Transit Rail Upgrade Completed Six Months Ahead of Schedule"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Category</label>
                <select
                  value={pasteCategory}
                  onChange={(e) => setPasteCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">Article Body / Key Points</label>
                <span className="text-[10px] text-zinc-500">
                  {pasteContent.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                required
                rows={4}
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Paste the article text, email summary, or bullet points you'd like summarized for your commute..."
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-y"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Coverage Depth:</span>
                {(['deep_dive', 'takeaways', 'brief'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPastePriority(p)}
                    className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-all ${
                      pastePriority === p
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {p === 'deep_dive' ? 'Deep Dive' : p === 'takeaways' ? 'Key Takeaways' : 'Brief Mention'}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-900/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Article to Queue
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: URL Extraction */}
        {activeTab === 'url' && (
          <form onSubmit={handleExtractUrl} className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                News Article URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.reuters.com/... or https://techcrunch.com/..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isExtracting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-md"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Extract & Queue</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5">
                We'll fetch and clean the readable article body automatically. (If behind a strict paywall, copy and paste the text into the Paste tab).
              </p>
            </div>

            {extractError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{extractError}</span>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Queued Articles List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Your Commute Playlist Queue ({articles.length})
          </label>
          {articles.length > 0 && (
            <button
              type="button"
              onClick={() => setArticles([])}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30">
            <BookOpen className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
            <p className="text-sm font-semibold text-zinc-400">No news articles queued yet</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Select one or more trending stories above, or paste your own articles to start crafting your commute briefing.
            </p>
            <button
              type="button"
              onClick={handleAddAllSamples}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/80 hover:bg-indigo-600 text-white"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Trending Stories
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {articles.map((art, idx) => (
              <div
                key={art.id}
                className="group flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-all"
              >
                {/* Index & Order Buttons */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-20 hover:bg-zinc-800"
                    title="Move earlier in briefing"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-zinc-400 w-5 text-center">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    disabled={idx === articles.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-20 hover:bg-zinc-800"
                    title="Move later in briefing"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Article Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {art.category || 'News'}
                    </span>
                    <span className="text-[11px] text-zinc-500 truncate max-w-[150px]">
                      {art.source}
                    </span>
                    <span className="text-[10px] text-zinc-600">•</span>
                    <span className="text-[10px] text-zinc-500">
                      ~{art.wordCount || art.content.split(/\s+/).length} words
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2">
                    {art.title}
                  </h3>

                  {/* Priority selector */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-zinc-500">Depth:</span>
                    {(['deep_dive', 'takeaways', 'brief'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSetPriority(art.id, p)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          art.priority === p
                            ? 'bg-zinc-800 text-amber-300 border-amber-500/40 font-semibold'
                            : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        {p === 'deep_dive' ? 'Deep Dive' : p === 'takeaways' ? 'Key Takeaways' : 'Headline Flash'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemove(art.id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                  title="Remove from commute playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
