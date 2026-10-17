export type CommuteMode = 'transit' | 'driving' | 'walking' | 'cycling' | 'general';

export type ShowFormat = 'solo_anchor' | 'duo_hosts' | 'executive' | 'chill_storyteller';

export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface Article {
  id: string;
  title: string;
  content: string;
  source?: string;
  url?: string;
  category?: string;
  priority: 'deep_dive' | 'takeaways' | 'brief';
  wordCount?: number;
  addedAt: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  style?: string;
}

export interface ScriptSegment {
  id: string;
  articleIndex?: number;
  title: string;
  category: string;
  segmentType: 'intro' | 'story' | 'wrap_up';
  primarySpeaker: string;
  takeaways: string[];
  dialogue: DialogueLine[];
  spokenScript: string;
  audioBase64?: string;
  durationSeconds?: number;
  startTime?: number;
}

export interface CommuteDigestScript {
  episodeTitle: string;
  tagline: string;
  estimatedMinutes: number;
  totalWordCount?: number;
  commuteTip?: string;
  segments: ScriptSegment[];
}

export interface GeneratedEpisode {
  id: string;
  createdAt: string;
  title: string;
  tagline: string;
  commuteMode: CommuteMode;
  targetMinutes: number;
  actualDurationSeconds: number;
  format: ShowFormat;
  voice: VoiceName;
  duoVoices: { host1: VoiceName; host2: VoiceName };
  script: CommuteDigestScript;
  masterAudioBase64: string;
  chapters: Array<{
    segmentId: string;
    title: string;
    startTime: number;
    durationSeconds: number;
  }>;
}

export interface VoiceOption {
  id: VoiceName;
  name: string;
  gender: 'female' | 'male';
  tagline: string;
  tone: string;
  bestFor: string;
}
