'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { Reciter, reciters } from '@/data/reciters';
import { useUserData } from './user-data-context';
import { surahs } from '@/data/surah-data';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerseTiming {
  verseNumber: number;
  timestampFrom: number; // ms
  timestampTo: number;   // ms
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  currentSurah: number | null;
  currentVerse: number | null;
  playbackMode: 'surah' | 'verse' | null;
  playbackRate: number;
  repeatCount: number;
  currentVersePlayCount: number;
}

interface AudioContextType {
  state: AudioState;
  playSurah: (surahNumber: number) => void;
  playVerse: (surahNumber: number, verseNumber: number) => void;
  playPage: (surahNumber: number, pageNumber: number) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  stop: () => void;
  playNextVerse: () => void;
  playPreviousVerse: () => void;
  setPlaybackRate: (rate: number) => void;
  setRepeatCount: (count: number) => void;
  currentReciter: Reciter | undefined;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// ─── Verse timing cache (per reciter + surah) ─────────────────────────────────

interface TimingData {
  audioUrl?: string;
  timings: VerseTiming[];
}

const timingCache = new Map<string, TimingData>();

async function fetchVerseTimings(
  reciterId: number,
  surahNumber: number,
): Promise<TimingData> {
  const cacheKey = `${reciterId}-${surahNumber}`;
  if (timingCache.has(cacheKey)) return timingCache.get(cacheKey)!;

  try {
    const res = await fetch(
      `https://api.qurancdn.com/api/qdc/audio/reciters/${reciterId}/audio_files?chapter=${surahNumber}&segments=true`,
    );
    if (res.ok) {
      const json = await res.json();
      const audioFile = json.audio_files?.[0];
      const rawTimings = audioFile?.verse_timings || [];
      if (rawTimings.length > 0) {
        const timings: VerseTiming[] = rawTimings
          .filter((f: any) => f && f.verse_key)
          .map((f: any) => ({
            verseNumber: parseInt(f.verse_key.split(':')[1], 10),
            timestampFrom: f.timestamp_from,
            timestampTo: f.timestamp_to,
          }));
        const data: TimingData = {
          audioUrl: audioFile?.audio_url,
          timings,
        };
        timingCache.set(cacheKey, data);
        return data;
      }
    }
  } catch {}

  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/recitations/${reciterId}/by_chapter/${surahNumber}`,
    );
    if (!res.ok) throw new Error('Timing fetch failed');
    const json = await res.json();

    const rawTimings =
      json.audio_files?.[0]?.timestamps ||
      json.audio_file?.timestamps ||
      json.timestamps ||
      [];

    const timings: VerseTiming[] = rawTimings
      .filter((f: any) => f && f.verse_key)
      .map((f: any) => ({
        verseNumber: parseInt(f.verse_key.split(':')[1], 10),
        timestampFrom: f.timestamp_from,
        timestampTo: f.timestamp_to,
      }));

    const data: TimingData = { timings };
    timingCache.set(cacheKey, data);
    return data;
  } catch {
    return { timings: [] };
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AudioProvider({ children }: { children: ReactNode }) {
  const { settings } = useUserData();
  const audio1Ref = useRef<HTMLAudioElement | null>(null);
  const audio2Ref = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // Active player
  const preloadRef = useRef<HTMLAudioElement | null>(null); // Preload player
  const preloadedKeyRef = useRef<string | null>(null);

  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    currentSurah: null,
    currentVerse: null,
    playbackMode: null,
    playbackRate: 1.0,
    repeatCount: 1,
    currentVersePlayCount: 1,
  });

  // Verse timings for the currently playing Surah
  const verseTimingsRef = useRef<VerseTiming[]>([]);
  const currentVersePlayCountRef = useRef(1);

  const currentReciter = reciters.find(r => r.id === settings.selectedReciterId);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const safePlay = useCallback(async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error('Audio play error:', err);
    }
  }, []);

  // ── Verse tracking during continuous surah playback ───────────────────────

  const updateCurrentVerseFromTime = useCallback((currentTimeMs: number) => {
    const timings = verseTimingsRef.current;
    if (!timings.length) return;

    // Find the verse whose window contains the current timestamp
    const active = timings.find(
      t => currentTimeMs >= t.timestampFrom && currentTimeMs < t.timestampTo,
    ) ?? (currentTimeMs >= timings[timings.length - 1].timestampFrom ? timings[timings.length - 1] : timings[0]);

    if (active && active.verseNumber !== stateRef.current.currentVerse) {
      setState(prev => ({ ...prev, currentVerse: active.verseNumber }));
    }
  }, []);

  // Helpers for getting URL
  const getVerseUrl = useCallback((reciter: Reciter, surah: number, verse: number) => {
    const everyAyahKey = reciter.everyAyahKey || 'Alafasy_128kbps';
    const surahStr = surah.toString().padStart(3, '0');
    const verseStr = verse.toString().padStart(3, '0');
    return `https://www.everyayah.com/data/${everyAyahKey}/${surahStr}${verseStr}.mp3`;
  }, []);

  const getSurahUrl = useCallback((reciter: Reciter, surah: number) => {
    const surahStr = surah.toString().padStart(3, '0');
    return `${reciter.baseUrl}${surahStr}.mp3`;
  }, []);

  const getNextVerse = useCallback((surahNumber: number, verseNumber: number) => {
    const surah = surahs.find(s => s.number === surahNumber);
    if (!surah) return null;
    if (verseNumber < surah.totalVerses) {
      return { surah: surahNumber, verse: verseNumber + 1 };
    } else if (surahNumber < 114) {
      return { surah: surahNumber + 1, verse: 1 };
    }
    return null;
  }, []);

  // Preloading helper functions
  const preloadNextVerse = useCallback((reciter: Reciter, surahNum: number, verseNum: number) => {
    if (!preloadRef.current) return;
    const next = getNextVerse(surahNum, verseNum);
    if (next) {
      const url = getVerseUrl(reciter, next.surah, next.verse);
      preloadRef.current.src = url;
      preloadRef.current.load();
      preloadedKeyRef.current = `${reciter.id}:verse:${next.surah}:${next.verse}`;
    } else {
      preloadRef.current.src = '';
      preloadedKeyRef.current = null;
    }
  }, [getVerseUrl, getNextVerse]);

  const preloadNextSurah = useCallback((reciter: Reciter, surahNum: number) => {
    if (!preloadRef.current) return;
    if (surahNum < 114) {
      const nextSurah = surahNum + 1;
      const url = getSurahUrl(reciter, nextSurah);
      preloadRef.current.src = url;
      preloadRef.current.load();
      preloadedKeyRef.current = `${reciter.id}:surah:${nextSurah}`;
    } else {
      preloadRef.current.src = '';
      preloadedKeyRef.current = null;
    }
  }, [getSurahUrl]);

  // ── Play actions ──────────────────────────────────────────────────────────

  const playVerse = useCallback((surahNumber: number, verseNumber: number) => {
    if (!currentReciter || !audioRef.current) return;
    verseTimingsRef.current = []; // No timing needed for single-verse mode
    currentVersePlayCountRef.current = 1;

    const key = `${currentReciter.id}:verse:${surahNumber}:${verseNumber}`;

    if (preloadedKeyRef.current === key && preloadRef.current && preloadRef.current.src) {
      audioRef.current.pause();

      const temp = audioRef.current;
      audioRef.current = preloadRef.current;
      preloadRef.current = temp;

      preloadedKeyRef.current = null;

      audioRef.current.playbackRate = stateRef.current.playbackRate;
      safePlay();

      setState(prev => ({
        ...prev,
        currentSurah: surahNumber,
        currentVerse: verseNumber,
        playbackMode: 'verse',
        isPlaying: true,
        currentTime: audioRef.current!.currentTime,
        duration: audioRef.current!.duration || 0,
        currentVersePlayCount: 1,
      }));
    } else {
      audioRef.current.pause();
      const url = getVerseUrl(currentReciter, surahNumber, verseNumber);
      audioRef.current.src = url;
      audioRef.current.playbackRate = stateRef.current.playbackRate;
      safePlay();

      setState(prev => ({
        ...prev,
        currentSurah: surahNumber,
        currentVerse: verseNumber,
        playbackMode: 'verse',
        isPlaying: true,
        currentVersePlayCount: 1,
      }));
    }

    preloadNextVerse(currentReciter, surahNumber, verseNumber);
  }, [currentReciter, getVerseUrl, safePlay, preloadNextVerse]);

  const playSurah = useCallback(async (surahNumber: number) => {
    if (!currentReciter || !audioRef.current) return;
    currentVersePlayCountRef.current = 1;

    audioRef.current.pause();
    const url = getSurahUrl(currentReciter, surahNumber);
    audioRef.current.src = url;
    audioRef.current.playbackRate = stateRef.current.playbackRate;
    safePlay();

    setState(prev => ({
      ...prev,
      currentSurah: surahNumber,
      currentVerse: 1,
      playbackMode: 'surah',
      isPlaying: true,
      currentVersePlayCount: 1,
    }));

    // Fetch verse timings for real-time gapless verse highlighting
    const reciterId = currentReciter.quranComId || currentReciter.id;
    if (reciterId) {
      verseTimingsRef.current = [];
      const data = await fetchVerseTimings(reciterId, surahNumber);
      verseTimingsRef.current = data.timings;

      if (data.audioUrl && audioRef.current && stateRef.current.currentSurah === surahNumber) {
        const curTime = audioRef.current.currentTime;
        const isPlaying = !audioRef.current.paused;
        audioRef.current.src = data.audioUrl;
        audioRef.current.currentTime = curTime;
        audioRef.current.playbackRate = stateRef.current.playbackRate;
        if (isPlaying) {
          safePlay();
        }
      }
    }

    preloadNextSurah(currentReciter, surahNumber);
  }, [currentReciter, getSurahUrl, safePlay, preloadNextSurah]);

  const stop = () => {
    if (audio1Ref.current) {
      audio1Ref.current.pause();
      audio1Ref.current.currentTime = 0;
    }
    if (audio2Ref.current) {
      audio2Ref.current.pause();
      audio2Ref.current.currentTime = 0;
    }
    preloadedKeyRef.current = null;
    verseTimingsRef.current = [];
    currentVersePlayCountRef.current = 1;
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentSurah: null,
      currentVerse: null,
      playbackMode: null,
      currentVersePlayCount: 1,
    }));
  };

  const playNextVerse = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentSurah) return;
    const surah = surahs.find((x: any) => x.number === s.currentSurah);
    if (!surah) return;
    const cur = s.currentVerse || 0;
    if (cur < surah.totalVerses) {
      playVerse(s.currentSurah, cur + 1);
    } else if (s.currentSurah < 114) {
      playVerse(s.currentSurah + 1, 1);
    } else {
      stop();
    }
  }, [playVerse]);

  const playPreviousVerse = () => {
    const s = stateRef.current;
    if (!s.currentSurah) return;
    const cur = s.currentVerse || 1;
    if (cur > 1) {
      playVerse(s.currentSurah, cur - 1);
    } else if (s.currentSurah > 1) {
      const prev = surahs.find((x: any) => x.number === s.currentSurah! - 1);
      if (prev) playVerse(prev.number, prev.totalVerses);
    }
  };

  const playNextSurah = useCallback(() => {
    const s = stateRef.current;
    if (s.currentSurah && s.currentSurah < 114) {
      playSurah(s.currentSurah + 1);
    } else {
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [playSurah]);

  const playPage = async (surahNumber: number, pageNumber: number) => {
    // Just play the whole Surah continuously — page is just an entry point
    playSurah(surahNumber);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (state.isPlaying) {
      audioRef.current.pause();
    } else {
      safePlay();
    }
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
  };

  const setPlaybackRate = (rate: number) => {
    if (audio1Ref.current) audio1Ref.current.playbackRate = rate;
    if (audio2Ref.current) audio2Ref.current.playbackRate = rate;
    setState(prev => ({ ...prev, playbackRate: rate }));
    try {
      localStorage.setItem('audio_playback_rate', rate.toString());
    } catch {}
  };

  const setRepeatCount = (count: number) => {
    setState(prev => ({ ...prev, repeatCount: count }));
    try {
      localStorage.setItem('audio_repeat_count', count.toString());
    } catch {}
  };

  // ── Audio elements lifecycle ───────────────────────────────────────────────

  useEffect(() => {
    const audio1 = new Audio();
    audio1.preload = 'auto';
    const audio2 = new Audio();
    audio2.preload = 'auto';

    audio1Ref.current = audio1;
    audio2Ref.current = audio2;
    audioRef.current = audio1;
    preloadRef.current = audio2;

    const handleTimeUpdate = (e: Event) => {
      if (e.currentTarget !== audioRef.current) return;
      const audio = audioRef.current;
      if (!audio) return;
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));

      const ms = audio.currentTime * 1000;
      if (stateRef.current.playbackMode === 'surah') {
        updateCurrentVerseFromTime(ms);
      }
    };

    const handleDurationChange = (e: Event) => {
      if (e.currentTarget !== audioRef.current) return;
      const audio = audioRef.current;
      if (audio) {
        setState(prev => ({ ...prev, duration: audio.duration }));
      }
    };

    const handlePlay = (e: Event) => {
      if (e.currentTarget !== audioRef.current) return;
      setState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = (e: Event) => {
      if (e.currentTarget !== audioRef.current) return;
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = (e: Event) => {
      if (e.currentTarget !== audioRef.current) return;
      const s = stateRef.current;
      
      if (s.playbackMode === 'verse') {
        const currentPlayCount = currentVersePlayCountRef.current;
        const isInfinite = s.repeatCount === 999;
        
        if ((isInfinite || currentPlayCount < s.repeatCount) && s.repeatCount > 1) {
          const nextPlayCount = isInfinite ? currentPlayCount : currentPlayCount + 1;
          currentVersePlayCountRef.current = nextPlayCount;
          setState(prev => ({ ...prev, currentVersePlayCount: nextPlayCount }));
          
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.playbackRate = s.playbackRate;
            safePlay();
          }
        } else {
          currentVersePlayCountRef.current = 1;
          setState(prev => ({ ...prev, currentVersePlayCount: 1 }));
          playNextVerse();
        }
      } else if (s.playbackMode === 'surah') {
        playNextSurah();
      } else {
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    };

    const handleProgress = (e: Event) => {
      if (e.currentTarget !== audioRef.current) return;
      const audio = audioRef.current;
      if (audio && audio.buffered.length > 0) {
        setState(prev => ({
          ...prev,
          buffered: audio.buffered.end(audio.buffered.length - 1),
        }));
      }
    };

    const attachListeners = (audio: HTMLAudioElement) => {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('progress', handleProgress);
    };

    const removeListeners = (audio: HTMLAudioElement) => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('progress', handleProgress);
    };

    attachListeners(audio1);
    attachListeners(audio2);

    // Load initial settings
    try {
      const savedRate = localStorage.getItem('audio_playback_rate');
      const savedRepeat = localStorage.getItem('audio_repeat_count');
      setState(prev => ({
        ...prev,
        playbackRate: savedRate ? parseFloat(savedRate) : 1.0,
        repeatCount: savedRepeat ? parseInt(savedRepeat) : 1,
      }));
    } catch {}

    return () => {
      removeListeners(audio1);
      removeListeners(audio2);
      audio1.pause();
      audio2.pause();
      audio1Ref.current = null;
      audio2Ref.current = null;
      audioRef.current = null;
      preloadRef.current = null;
    };
  }, [playNextSurah, playNextVerse, updateCurrentVerseFromTime, safePlay]);

  return (
    <AudioContext.Provider value={{
      state, playSurah, playVerse, playPage, togglePlay, seek, stop,
      playNextVerse, playPreviousVerse, setPlaybackRate, setRepeatCount, currentReciter,
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
