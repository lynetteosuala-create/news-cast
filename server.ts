import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Concatenates multiple WAV buffers (24kHz, 16-bit mono) into one seamless WAV file
 */
function concatenateWavBuffers(wavBuffers: Buffer[]): Buffer {
  if (wavBuffers.length === 0) return Buffer.alloc(0);
  if (wavBuffers.length === 1) return wavBuffers[0];

  const pcmChunks: Buffer[] = [];
  let totalPcmLength = 0;
  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;

  for (let i = 0; i < wavBuffers.length; i++) {
    const buf = wavBuffers[i];
    if (buf.length < 44) continue;

    // Find the 'data' chunk
    let dataOffset = 12;
    let foundData = false;
    let dataSize = 0;

    while (dataOffset < buf.length - 8) {
      const chunkId = buf.toString('ascii', dataOffset, dataOffset + 4);
      const chunkSize = buf.readUInt32LE(dataOffset + 4);

      if (chunkId === 'fmt ') {
        numChannels = buf.readUInt16LE(dataOffset + 10);
        sampleRate = buf.readUInt32LE(dataOffset + 12);
        bitsPerSample = buf.readUInt16LE(dataOffset + 22);
      } else if (chunkId === 'data') {
        foundData = true;
        dataSize = chunkSize;
        const pcmData = buf.subarray(dataOffset + 8, Math.min(buf.length, dataOffset + 8 + dataSize));
        pcmChunks.push(pcmData);
        totalPcmLength += pcmData.length;
        break;
      }

      dataOffset += 8 + chunkSize;
    }

    // Fallback if data chunk tag not found by parser
    if (!foundData && buf.length > 44) {
      const pcmData = buf.subarray(44);
      pcmChunks.push(pcmData);
      totalPcmLength += pcmData.length;
    }
  }

  // Create new master WAV header
  const header = Buffer.alloc(44);
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;

  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + totalPcmLength, 4);
  header.write('WAVE', 8);

  // fmt subchunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  header.write('data', 36);
  header.writeUInt32LE(totalPcmLength, 40);

  return Buffer.concat([header, ...pcmChunks]);
}

/**
 * Calculate approximate audio duration in seconds from WAV buffer
 */
function getWavDurationSeconds(wavBuf: Buffer): number {
  if (wavBuf.length <= 44) return 0;
  // Standard Gemini 24kHz mono 16-bit: 24000 samples/sec * 2 bytes/sample = 48,000 bytes/sec
  const pcmBytes = wavBuf.length - 44;
  return Number((pcmBytes / 48000).toFixed(1));
}

// ================= API ROUTES =================

/**
 * 1. Extract content from news URL
 */
app.post('/api/extract-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 CommuteCast/1.0',
        'Accept': 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Could not fetch article from website (${response.status} ${response.statusText}). Please paste article text manually.`,
      });
    }

    const html = await response.text();

    // Fast HTML cleaning to extract title and readable text paragraphs
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/(\r\n|\n|\r)/gm, '').trim() : parsedUrl.hostname;

    // Remove scripts, styles, navs, headers, footers
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ');

    // Extract text from paragraph tags
    const paragraphs: string[] = [];
    const pRegex = /<p\b[^>]*>(.*?)<\/p>/gi;
    let match;
    while ((match = pRegex.exec(cleaned)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      if (text.length > 40 && !text.includes('cookie') && !text.includes('subscribe') && !text.includes('All rights reserved')) {
        paragraphs.push(text);
      }
    }

    const extractedContent = paragraphs.slice(0, 30).join('\n\n');

    if (!extractedContent || extractedContent.length < 100) {
      return res.json({
        title,
        content: `Could not extract full text automatically from ${parsedUrl.hostname}. Please paste the headline and key article text into the input field.`,
        domain: parsedUrl.hostname,
        source: parsedUrl.hostname,
        needsManualInput: true,
      });
    }

    return res.json({
      title,
      content: extractedContent,
      domain: parsedUrl.hostname,
      source: parsedUrl.hostname,
      needsManualInput: false,
    });
  } catch (error: any) {
    console.error('URL extract error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to extract article content. You can paste the article text directly.',
    });
  }
});

/**
 * 2. Generate personalized commute news digest script using gemini-3.8-flash
 */
app.post('/api/generate-digest-script', async (req, res) => {
  try {
    const {
      articles,
      commuteMinutes = 10,
      commuteMode = 'transit', // 'transit', 'driving', 'walking', 'cycling', 'general'
      format = 'solo_anchor', // 'solo_anchor', 'duo_hosts', 'executive', 'chill_storyteller'
      voice = 'Kore',
      duoVoices = { host1: 'Puck', host2: 'Kore' },
      focusAreas = 'Commute insights, actionable context, tech and economic impact',
      listenerName = 'Commuter',
      tonePreference = 'energetic_clear',
    } = req.body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one article.' });
    }

    // Audio pace is roughly 130-150 spoken words per minute.
    // For a 5 minute commute: ~650 words. For 10 min: ~1300 words. For 3 min: ~400 words.
    const targetWords = Math.min(Math.max(Math.round(commuteMinutes * 135), 350), 2800);

    const isDuo = format === 'duo_hosts';
    const host1 = isDuo ? 'Alex' : 'Host';
    const host2 = isDuo ? 'Sam' : '';

    const articlesContext = articles
      .map((a: any, idx: number) => {
        return `[ARTICLE ${idx + 1}]
Title: ${a.title || 'Untitled'}
Priority: ${a.priority || 'standard'}
Source: ${a.source || 'News'}
Content:
${(a.content || '').substring(0, 3000)}`;
      })
      .join('\n\n---\n\n');

    const prompt = `You are an elite news broadcast writer and executive audio producer specializing in personalized daily commute audio digests.

TASK:
Craft a custom audio news briefing tailored for a listener during their commute.

COMMUTE CONTEXT:
- Commute Duration Target: ${commuteMinutes} minutes (Aim for approximately ${targetWords} spoken words total across all segments)
- Commute Mode: ${commuteMode} (e.g., mention safe driving tips or smooth transit journey greetings)
- Listener: ${listenerName}
- Format Style: ${format}
- Primary Tone: ${tonePreference}
- Key Focus Areas: ${focusAreas}
- Audio Host Setup: ${isDuo ? 'Two hosts: Alex (curious, dynamic host) and Sam (sharp, analytical co-host)' : 'Single solo broadcaster'}

ARTICLES PROVIDED:
${articlesContext}

BROADCASTING INSTRUCTIONS:
1. "Intro": Warm, timely commuter welcome addressing their commute mode. Give a 15-second teaser of the top stories coming up.
2. "Story Segments": Create distinct segments corresponding to the key articles (or thematic grouping if appropriate).
   - Cut through fluff. Focus on: What happened? Why does it matter to everyday life, tech, economy, or commute? What's the takeaway?
   - Spoken language MUST sound natural when read aloud: avoid complex URL citations, parenthetical citations, or dry bullet lists. Use spoken transitions ("Moving over to...", "Turning now to markets...", "Here's what you need to know:").
   - Include vocal bursts where natural (e.g., <laugh>, <breath>, |yeah|, |mhm| for dialogue) if in duo mode.
3. "Outro": Quick recap of the biggest headline, a commuter sign-off ("Safe travels on your route!"), and sign-off.
4. Provide structured JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert audio producer creating ready-to-broadcast spoken scripts for commute podcasts. Output strictly valid JSON conforming to the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            episodeTitle: { type: Type.STRING },
            tagline: { type: Type.STRING },
            estimatedMinutes: { type: Type.NUMBER },
            totalWordCount: { type: Type.INTEGER },
            commuteTip: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  articleIndex: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  segmentType: { type: Type.STRING }, // 'intro', 'story', 'wrap_up'
                  primarySpeaker: { type: Type.STRING },
                  takeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  dialogue: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        speaker: { type: Type.STRING },
                        text: { type: Type.STRING },
                        style: { type: Type.STRING },
                      },
                      required: ['speaker', 'text'],
                    },
                  },
                  spokenScript: { type: Type.STRING },
                },
                required: ['id', 'title', 'category', 'segmentType', 'dialogue', 'spokenScript', 'takeaways'],
              },
            },
          },
          required: ['episodeTitle', 'tagline', 'estimatedMinutes', 'segments'],
        },
      },
    });

    const scriptJsonText = response.text?.trim() || '{}';
    let scriptData;
    try {
      scriptData = JSON.parse(scriptJsonText);
    } catch (parseErr) {
      console.error('Failed to parse script JSON from Gemini:', scriptJsonText);
      return res.status(500).json({ error: 'Failed to structure commute script.' });
    }

    return res.json({
      success: true,
      script: scriptData,
      commuteMinutes,
      commuteMode,
      format,
    });
  } catch (error: any) {
    console.error('Script generation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate commute script.' });
  }
});

/**
 * 3. Generate Audio for a segment or script using gemini-3.8-flash-tts
 * MUST use gemini-3.8-flash-tts as specified in user instructions!
 */
app.post('/api/synthesize-tts', async (req, res) => {
  try {
    const {
      text,
      dialogue,
      format = 'solo_anchor',
      voice = 'Kore',
      duoVoices = { host1: 'Puck', host2: 'Kore' },
      style = 'Clear, engaging news anchor',
    } = req.body;

    const isDuo = format === 'duo_hosts' && Array.isArray(dialogue) && dialogue.length > 1;

    let response;

    if (isDuo) {
      // Duo podcast dialogue format with gemini-3.8-flash-tts
      // Multi-speaker config requires exactly 2 speakerVoiceConfigs
      const host1Name = 'Alex';
      const host2Name = 'Sam';

      const parts = dialogue.map((line: any) => {
        const rawSpeaker = (line.speaker || '').toLowerCase();
        const normalizedSpeaker = rawSpeaker.includes('sam') ? host2Name : host1Name;
        return {
          text: `${normalizedSpeaker}: ${line.text}`,
          speechMetadata: {
            speaker: normalizedSpeaker,
            style: line.style || (normalizedSpeaker === host2Name ? 'Conversational, bright co-host' : 'Confident, engaging lead host'),
          },
        };
      });

      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: host1Name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: duoVoices?.host1 || 'Puck' },
                  },
                },
                {
                  speaker: host2Name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: duoVoices?.host2 || 'Kore' },
                  },
                },
              ],
            },
          },
        },
      });
    } else {
      // Single speaker commute broadcast using gemini-3.8-flash-tts
      const spokenContent = text || (Array.isArray(dialogue) ? dialogue.map((d: any) => d.text).join(' ') : 'Here is your commute briefing.');

      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: spokenContent,
                speechMetadata: {
                  style: style || 'Professional, articulate commute broadcast news anchor',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'TTS model did not return audio data.' });
    }

    const buffer = Buffer.from(base64Audio, 'base64');
    const durationSeconds = getWavDurationSeconds(buffer);

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      durationSeconds,
    });
  } catch (error: any) {
    console.error('TTS synthesis error:', error);
    return res.status(500).json({ error: error.message || 'Failed to synthesize speech audio.' });
  }
});

/**
 * 4. Generate Complete Master Audio for all segments & concatenate into a continuous episode
 */
app.post('/api/generate-full-episode-audio', async (req, res) => {
  try {
    const {
      segments,
      format = 'solo_anchor',
      voice = 'Kore',
      duoVoices = { host1: 'Puck', host2: 'Kore' },
    } = req.body;

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({ error: 'No segments provided.' });
    }

    const segmentAudioResults: Array<{
      segmentId: string;
      title: string;
      durationSeconds: number;
      startTime: number;
      audioBase64: string;
    }> = [];

    const wavBuffers: Buffer[] = [];
    let cumulativeTime = 0;

    // Process segments sequentially or in parallel batches
    for (const seg of segments) {
      const isDuo = format === 'duo_hosts' && Array.isArray(seg.dialogue) && seg.dialogue.length > 1;

      let response;
      if (isDuo) {
        const host1Name = 'Alex';
        const host2Name = 'Sam';
        const parts = seg.dialogue.map((line: any) => {
          const rawSpeaker = (line.speaker || '').toLowerCase();
          const normalizedSpeaker = rawSpeaker.includes('sam') ? host2Name : host1Name;
          return {
            text: `${normalizedSpeaker}: ${line.text}`,
            speechMetadata: {
              speaker: normalizedSpeaker,
              style: line.style || 'Commute podcast host',
            },
          };
        });

        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [{ role: 'user', parts }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  { speaker: host1Name, voiceConfig: { prebuiltVoiceConfig: { voiceName: duoVoices?.host1 || 'Puck' } } },
                  { speaker: host2Name, voiceConfig: { prebuiltVoiceConfig: { voiceName: duoVoices?.host2 || 'Kore' } } },
                ],
              },
            },
          },
        });
      } else {
        const spokenContent = seg.spokenScript || (seg.dialogue ? seg.dialogue.map((d: any) => d.text).join(' ') : seg.title);

        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: spokenContent,
                  speechMetadata: {
                    style: 'Clear, articulate commute news anchor',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
              },
            },
          },
        });
      }

      const b64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (b64) {
        const buf = Buffer.from(b64, 'base64');
        const segDuration = getWavDurationSeconds(buf);
        wavBuffers.push(buf);

        segmentAudioResults.push({
          segmentId: seg.id,
          title: seg.title,
          durationSeconds: segDuration,
          startTime: cumulativeTime,
          audioBase64: b64,
        });

        cumulativeTime += segDuration;
      }
    }

    // Concatenate all WAV buffers into a single master audio track
    const masterWavBuffer = concatenateWavBuffers(wavBuffers);
    const masterBase64 = masterWavBuffer.toString('base64');
    const totalDurationSeconds = getWavDurationSeconds(masterWavBuffer);

    return res.json({
      success: true,
      masterAudioBase64: masterBase64,
      totalDurationSeconds,
      chapters: segmentAudioResults.map(s => ({
        segmentId: s.segmentId,
        title: s.title,
        startTime: s.startTime,
        durationSeconds: s.durationSeconds,
      })),
      segmentAudios: segmentAudioResults,
    });
  } catch (error: any) {
    console.error('Full episode audio error:', error);
    return res.status(500).json({ error: error.message || 'Failed to synthesize complete episode audio.' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CommuteCast AI server running on port ${PORT}`);
  });
}

startServer();
