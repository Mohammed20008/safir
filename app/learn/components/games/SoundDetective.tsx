'use client';

import { useState, useEffect } from 'react';
import canvasConfetti from 'canvas-confetti';
import { 
  Volume2, 
  ArrowLeft, 
  Trophy, 
  Sparkles, 
  Flame, 
  Award, 
  RotateCcw, 
  Shuffle, 
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface QuestionItem {
  id: string;
  soundText: string;
  correctAnswer: string;
  options: string[];
  hint: string;
  audioPath: string;
}

interface MasterLetter {
  letter: string;
  name: string;
  transliterated: string;
  audioPath: string;
}

const ALL_28_LETTERS: MasterLetter[] = [
  { letter: 'أ', name: 'أَلِف', transliterated: 'Alif', audioPath: '/audio/letters/001-alif.mp3' },
  { letter: 'ب', name: 'بَاء', transliterated: 'Baa', audioPath: '/audio/letters/002-ba.mp3' },
  { letter: 'ت', name: 'تَاء', transliterated: 'Taa', audioPath: '/audio/letters/003-taa.mp3' },
  { letter: 'ث', name: 'ثَاء', transliterated: 'Thaa', audioPath: '/audio/letters/004-tha.mp3' },
  { letter: 'ج', name: 'جِيم', transliterated: 'Jeem', audioPath: '/audio/letters/005-jeem.mp3' },
  { letter: 'ح', name: 'حَاء', transliterated: 'Haa', audioPath: '/audio/letters/006-haa.mp3' },
  { letter: 'خ', name: 'خَاء', transliterated: 'Khaa', audioPath: '/audio/letters/007-khaa.mp3' },
  { letter: 'د', name: 'دَال', transliterated: 'Dal', audioPath: '/audio/letters/008-dal.mp3' },
  { letter: 'ذ', name: 'ذَال', transliterated: 'Dhal', audioPath: '/audio/letters/009-dhal.mp3' },
  { letter: 'ر', name: 'رَاء', transliterated: 'Raa', audioPath: '/audio/letters/010-raa.mp3' },
  { letter: 'ز', name: 'زَاي', transliterated: 'Zay', audioPath: '/audio/letters/011-jaa.mp3' },
  { letter: 'س', name: 'سِين', transliterated: 'Seen', audioPath: '/audio/letters/012-seen.mp3' },
  { letter: 'ش', name: 'شِين', transliterated: 'Sheen', audioPath: '/audio/letters/013-sheen.mp3' },
  { letter: 'ص', name: 'صَاد', transliterated: 'Saad', audioPath: '/audio/letters/014-saad.mp3' },
  { letter: 'ض', name: 'ضَاد', transliterated: 'Daad', audioPath: '/audio/letters/015-dhaad.mp3' },
  { letter: 'ط', name: 'طَاء', transliterated: 'Taa (Heavy)', audioPath: '/audio/letters/016-toa.mp3' },
  { letter: 'ظ', name: 'ظَاء', transliterated: 'Zaa (Heavy)', audioPath: '/audio/letters/017-dhaa.mp3' },
  { letter: 'ع', name: 'عَيْن', transliterated: 'Ayn', audioPath: '/audio/letters/018-ain.mp3' },
  { letter: 'غ', name: 'غَيْن', transliterated: 'Ghayn', audioPath: '/audio/letters/019-ghain.mp3' },
  { letter: 'ف', name: 'فَاء', transliterated: 'Faa', audioPath: '/audio/letters/020-faa.mp3' },
  { letter: 'ق', name: 'قَاف', transliterated: 'Qaaf', audioPath: '/audio/letters/021-qaaf.mp3' },
  { letter: 'ك', name: 'كَاف', transliterated: 'Kaaf', audioPath: '/audio/letters/022-kaaf.mp3' },
  { letter: 'ل', name: 'لاَم', transliterated: 'Laam', audioPath: '/audio/letters/023-laam.mp3' },
  { letter: 'م', name: 'مِيم', transliterated: 'Meem', audioPath: '/audio/letters/024-meem.mp3' },
  { letter: 'ن', name: 'نُون', transliterated: 'Noon', audioPath: '/audio/letters/025-noon.mp3' },
  { letter: 'و', name: 'وَاو', transliterated: 'Waw', audioPath: '/audio/letters/026-waw.mp3' },
  { letter: 'هـ', name: 'هَاء', transliterated: 'Haa (Soft)', audioPath: '/audio/letters/027-ha.mp3' },
  { letter: 'ي', name: 'يَاء', transliterated: 'Yaa', audioPath: '/audio/letters/029-yaa.mp3' },
];

const VOWEL_ITEMS_LEVEL_2 = [
  { soundText: 'بَ', letter: 'بَ', hint: 'Ba with Fathah (/ba/)', audioPath: '/audio/vowels/ba_fatha.mp3' },
  { soundText: 'بِ', letter: 'بِ', hint: 'Ba with Kasrah (/bi/)', audioPath: '/audio/vowels/ba_kasra.mp3' },
  { soundText: 'بُ', letter: 'بُ', hint: 'Ba with Dammah (/bu/)', audioPath: '/audio/vowels/ba_damma.mp3' },
  { soundText: 'تَ', letter: 'تَ', hint: 'Ta with Fathah (/ta/)', audioPath: '/audio/vowels/ta_fatha.mp3' },
  { soundText: 'تِ', letter: 'تِ', hint: 'Ta with Kasrah (/ti/)', audioPath: '/audio/vowels/ta_kasra.mp3' },
  { soundText: 'تُ', letter: 'تُ', hint: 'Ta with Dammah (/tu/)', audioPath: '/audio/vowels/ta_damma.mp3' },
  { soundText: 'سَ', letter: 'سَ', hint: 'Sa with Fathah (/sa/)', audioPath: '/audio/vowels/sa_fatha.mp3' },
  { soundText: 'سِ', letter: 'سِ', hint: 'Sa with Kasrah (/si/)', audioPath: '/audio/vowels/sa_kasra.mp3' },
  { soundText: 'سُ', letter: 'سُ', hint: 'Sa with Dammah (/su/)', audioPath: '/audio/vowels/sa_damma.mp3' },
  { soundText: 'مَ', letter: 'مَ', hint: 'Ma with Fathah (/ma/)', audioPath: '/audio/vowels/ma_fatha.mp3' },
  { soundText: 'مِ', letter: 'مِ', hint: 'Ma with Kasrah (/mi/)', audioPath: '/audio/vowels/ma_kasra.mp3' },
  { soundText: 'مُ', letter: 'مُ', hint: 'Ma with Dammah (/mu/)', audioPath: '/audio/vowels/ma_damma.mp3' },
  { soundText: 'رَ', letter: 'رَ', hint: 'Ra with Fathah (/ra/)', audioPath: '/audio/vowels/ra_fatha.mp3' },
  { soundText: 'رِ', letter: 'رِ', hint: 'Ra with Kasrah (/ri/)', audioPath: '/audio/vowels/ra_kasra.mp3' },
  { soundText: 'رُ', letter: 'رُ', hint: 'Ra with Dammah (/ru/)', audioPath: '/audio/vowels/ra_damma.mp3' },
];

const TANWEEN_ITEMS_LEVEL_3 = [
  { soundText: 'بً', letter: 'بً', hint: 'Ba Tanween Fath (/ban/)', audioPath: '/audio/vowels/ba_tanween_fath.mp3' },
  { soundText: 'بٍ', letter: 'بٍ', hint: 'Ba Tanween Kasr (/bin/)', audioPath: '/audio/vowels/ba_tanween_kasr.mp3' },
  { soundText: 'بٌ', letter: 'بٌ', hint: 'Ba Tanween Damm (/bun/)', audioPath: '/audio/vowels/ba_tanween_damm.mp3' },
  { soundText: 'تً', letter: 'تً', hint: 'Ta Tanween Fath (/tan/)', audioPath: '/audio/vowels/ta_tanween_fath.mp3' },
  { soundText: 'تٍ', letter: 'تٍ', hint: 'Ta Tanween Kasr (/tin/)', audioPath: '/audio/vowels/ta_tanween_kasr.mp3' },
  { soundText: 'تٌ', letter: 'تٌ', hint: 'Ta Tanween Damm (/tun/)', audioPath: '/audio/vowels/ta_tanween_damm.mp3' },
  { soundText: 'رً', letter: 'رً', hint: 'Ra Tanween Fath (/ran/)', audioPath: '/audio/vowels/ra_tanween_fath.mp3' },
  { soundText: 'رٍ', letter: 'رٍ', hint: 'Ra Tanween Kasr (/rin/)', audioPath: '/audio/vowels/ra_tanween_kasr.mp3' },
  { soundText: 'رٌ', letter: 'رٌ', hint: 'Ra Tanween Damm (/run/)', audioPath: '/audio/vowels/ra_tanween_damm.mp3' },
  { soundText: 'مً', letter: 'مً', hint: 'Ma Tanween Fath (/man/)', audioPath: '/audio/vowels/ma_tanween_fath.mp3' },
  { soundText: 'مٍ', letter: 'مٍ', hint: 'Ma Tanween Kasr (/min/)', audioPath: '/audio/vowels/ma_tanween_kasr.mp3' },
  { soundText: 'مٌ', letter: 'مٌ', hint: 'Ma Tanween Damm (/mun/)', audioPath: '/audio/vowels/ma_tanween_damm.mp3' },
];

const SUKOON_SHADDAH_LEVEL_4 = [
  { soundText: 'بْ', letter: 'بْ', hint: 'Ba with Sukoon (Resting /b/)', audioPath: '/audio/vowels/ba_sukoon.mp3' },
  { soundText: 'تْ', letter: 'تْ', hint: 'Ta with Sukoon (Resting /t/)', audioPath: '/audio/vowels/ta_sukoon.mp3' },
  { soundText: 'سْ', letter: 'سْ', hint: 'Sa with Sukoon (Resting /s/)', audioPath: '/audio/vowels/sa_sukoon.mp3' },
  { soundText: 'مْ', letter: 'مْ', hint: 'Ma with Sukoon (Resting /m/)', audioPath: '/audio/vowels/ma_sukoon.mp3' },
  { soundText: 'رْ', letter: 'رْ', hint: 'Ra with Sukoon (Resting /r/)', audioPath: '/audio/vowels/ra_sukoon.mp3' },
  { soundText: 'بَّ', letter: 'بَّ', hint: 'Ba with Shaddah & Fathah', audioPath: '/audio/vowels/ba_shaddah.mp3' },
  { soundText: 'تَّ', letter: 'تَّ', hint: 'Ta with Shaddah & Fathah', audioPath: '/audio/vowels/ta_shaddah.mp3' },
  { soundText: 'سَّ', letter: 'سَّ', hint: 'Sa with Shaddah & Fathah', audioPath: '/audio/vowels/sa_shaddah.mp3' },
  { soundText: 'مَّ', letter: 'مَّ', hint: 'Ma with Shaddah & Fathah', audioPath: '/audio/vowels/ma_shaddah.mp3' },
  { soundText: 'رَّ', letter: 'رَّ', hint: 'Ra with Shaddah & Fathah', audioPath: '/audio/vowels/ra_shaddah.mp3' },
];

const MAKHRAJ_LEVEL_5 = [
  { soundText: 'صَ', letter: 'صَ', hint: 'Heavy Ṣād (Ṣa)', audioPath: '/audio/vowels/sad_fatha.mp3' },
  { soundText: 'طَ', letter: 'طَ', hint: 'Heavy Ṭā (Ṭa)', audioPath: '/audio/vowels/toa_fatha.mp3' },
  { soundText: 'قَ', letter: 'قَ', hint: 'Deep Qāf (Qa)', audioPath: '/audio/vowels/qaf_fatha.mp3' },
  { soundText: 'عَ', letter: 'عَ', hint: 'Throat \'Ayn (\'A)', audioPath: '/audio/vowels/ain_fatha.mp3' },
  { soundText: 'ضَ', letter: 'ضَ', hint: 'Heavy Ḍād (Ḍa)', audioPath: '/audio/vowels/daad_fatha.mp3' },
  { soundText: 'ظَ', letter: 'ظَ', hint: 'Heavy Ẓā (Ẓa)', audioPath: '/audio/vowels/dhaa_fatha.mp3' },
  { soundText: 'غَ', letter: 'غَ', hint: 'Throat Ghayn (Gha)', audioPath: '/audio/vowels/ghain_fatha.mp3' },
  { soundText: 'خَ', letter: 'خَ', hint: 'Throat Khā (Kha)', audioPath: '/audio/vowels/khaa_fatha.mp3' },
];

// --- DYNAMIC QUESTION GENERATOR (100% SHUFFLED ON EVERY PLAY) ---
const generateShuffledLevelQuestions = (levelId: number): QuestionItem[] => {
  if (levelId === 1) {
    const shuffledPool = [...ALL_28_LETTERS].sort(() => Math.random() - 0.5);
    const selected = shuffledPool.slice(0, 8);

    return selected.map((item, idx) => {
      const distractors = ALL_28_LETTERS
        .filter(l => l.letter !== item.letter)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(l => l.letter);

      const options = [item.letter, ...distractors].sort(() => Math.random() - 0.5);

      return {
        id: `l1_${idx}_${Date.now()}`,
        soundText: item.name,
        correctAnswer: item.letter,
        options,
        hint: `${item.name} (${item.transliterated})`,
        audioPath: item.audioPath,
      };
    });
  }

  let pool: any[] = [];
  if (levelId === 2) pool = VOWEL_ITEMS_LEVEL_2;
  else if (levelId === 3) pool = TANWEEN_ITEMS_LEVEL_3;
  else if (levelId === 4) pool = SUKOON_SHADDAH_LEVEL_4;
  else if (levelId === 5) pool = MAKHRAJ_LEVEL_5;

  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffledPool.slice(0, 6);

  return selected.map((item, idx) => {
    const distractors = pool
      .filter(p => p.letter !== item.letter)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(p => p.letter);

    const options = [item.letter, ...distractors].sort(() => Math.random() - 0.5);

    return {
      id: `l${levelId}_${idx}_${Date.now()}`,
      soundText: item.soundText,
      correctAnswer: item.letter,
      options,
      hint: item.hint,
      audioPath: item.audioPath,
    };
  });
};

interface LevelMeta {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xp: number;
}

const LEVEL_META: LevelMeta[] = [
  { id: 1, name: 'Alphabet Letter Names (28 Letters)', difficulty: 'Easy', xp: 60 },
  { id: 2, name: 'Short Vowels (Fathah َ , Kasrah ِ , Dammah ُ)', difficulty: 'Medium', xp: 75 },
  { id: 3, name: 'Tanween Nunation ( ً  ٍ  ٌ )', difficulty: 'Medium', xp: 85 },
  { id: 4, name: 'Sukoon ْ & Shaddah ّ Emphasis', difficulty: 'Hard', xp: 95 },
  { id: 5, name: 'Heavy Letters & Throat Makhraj', difficulty: 'Hard', xp: 100 },
];

// --- SINGLETON AUDIO ENGINE ---
let globalAudioCtx: AudioContext | null = null;
let globalHtmlAudio: HTMLAudioElement | null = null;

const getGlobalAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!globalAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) globalAudioCtx = new AudioCtx();
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
    return globalAudioCtx;
  } catch (e) {
    return null;
  }
};

const getGlobalHtmlAudio = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined') return null;
  if (!globalHtmlAudio) {
    globalHtmlAudio = new Audio();
  }
  return globalHtmlAudio;
};

interface SoundDetectiveProps {
  styles: any;
  onAwardXp: (amount: number) => void;
  onBackToArcade: () => void;
}

export default function SoundDetective({ styles, onAwardXp, onBackToArcade }: SoundDetectiveProps) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');
  const [xpAwarded, setXpAwarded] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const levelMeta = LEVEL_META[currentLevelIdx];
  const question = questions[questionIdx];

  const playSoundEffect = (type: 'correct' | 'wrong' | 'victory') => {
    const ctx = getGlobalAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (type === 'correct') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.22);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'victory') {
        const playTone = (freq: number, start: number, dur: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, start);
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.12, start);
          g.gain.exponentialRampToValueAtTime(0.005, start + dur);
          o.start(start);
          o.stop(start + dur);
        };
        playTone(523.25, now, 0.2);
        playTone(659.25, now + 0.08, 0.2);
        playTone(783.99, now + 0.16, 0.2);
        playTone(1046.50, now + 0.24, 0.35);
      }
    } catch (err) {}
  };

  // Play Authentic Native Arabic MP3 File for All Questions Across All Levels
  const playTargetSound = (qItem?: QuestionItem) => {
    if (typeof window === 'undefined' || !qItem) return;

    setIsPlayingAudio(true);
    setTimeout(() => setIsPlayingAudio(false), 1400);

    if (qItem.audioPath) {
      try {
        const audio = getGlobalHtmlAudio();
        if (audio) {
          audio.pause();
          audio.src = qItem.audioPath;
          audio.volume = 1.0;
          audio.play().catch(() => {});
        }
      } catch (e) {}
    }
  };

  const startLevel = (lvlIdx: number) => {
    setCurrentLevelIdx(lvlIdx);
    const generatedQuestions = generateShuffledLevelQuestions(lvlIdx + 1);
    setQuestions(generatedQuestions);
    setQuestionIdx(0);
    setScore(0);
    setStreak(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setGameState('playing');
    setXpAwarded(false);

    setTimeout(() => {
      if (generatedQuestions[0]) {
        playTargetSound(generatedQuestions[0]);
      }
    }, 350);
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered || !question) return;

    setSelectedOption(option);
    setIsAnswered(true);

    if (option === question.correctAnswer) {
      playSoundEffect('correct');
      setScore((s) => s + 15 * (streak + 1));
      setStreak((st) => st + 1);
    } else {
      playSoundEffect('wrong');
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (questionIdx < questions.length - 1) {
      const nextQIdx = questionIdx + 1;
      setQuestionIdx(nextQIdx);
      setSelectedOption(null);
      setIsAnswered(false);

      setTimeout(() => {
        if (questions[nextQIdx]) {
          playTargetSound(questions[nextQIdx]);
        }
      }, 300);
    } else {
      playSoundEffect('victory');
      setGameState('completed');
      if (typeof window !== 'undefined') {
        canvasConfetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
      }
      if (!xpAwarded) {
        onAwardXp(levelMeta.xp);
        setXpAwarded(true);
      }
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: 'min(650px, 85vh)',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%)',
      borderRadius: '24px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
      position: 'relative',
      overflow: 'hidden',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      userSelect: 'none'
    }}>

      {/* --- TOP CONTROL BAR --- */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 20,
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <button
          onClick={onBackToArcade}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '50px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem'
          }}
        >
          <ArrowLeft size={16} /> Arcade
        </button>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {LEVEL_META.map((lvl, idx) => (
            <button
              key={lvl.id}
              onClick={() => startLevel(idx)}
              style={{
                background: currentLevelIdx === idx ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: `1px solid ${currentLevelIdx === idx ? '#a78bfa' : 'rgba(255, 255, 255, 0.15)'}`,
                padding: '4px 10px',
                borderRadius: '50px',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Lvl {lvl.id}
            </button>
          ))}
        </div>
      </div>

      {/* --- INTRO SCREEN --- */}
      {gameState === 'intro' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 50
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '2px solid rgba(167, 139, 250, 0.3)',
            borderRadius: '24px',
            padding: '24px 16px',
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎧</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
              Sound Detective
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Test your ear! Listen to authentic native Arabic speech MP3 audio clips for Short Vowels, Tanween, Sukoon, Shaddah & Makhraj!
            </p>

            <button
              onClick={() => startLevel(0)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '12px',
                borderRadius: '18px',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={18} /> Start Detective Mission 🔍
            </button>
          </div>
        </div>
      )}

      {/* --- PLAYING GAME SCREEN --- */}
      {gameState === 'playing' && question && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '16px 12px',
          zIndex: 10
        }}>
          {/* Stats Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            padding: '8px 14px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            <div>
              <span style={{ fontWeight: 800, color: '#c4b5fd', fontSize: '0.85rem' }}>
                Question {questionIdx + 1} / {questions.length}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '8px', fontWeight: 700 }}>
                {levelMeta.name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontWeight: 800, fontSize: '0.85rem' }}>
              {streak > 1 && <span style={{ color: '#f59e0b' }}>🔥 Streak x{streak}</span>}
              <span style={{ color: '#a78bfa' }}>⭐ Score: {score}</span>
            </div>
          </div>

          {/* Sound Player Box */}
          <div style={{
            background: isPlayingAudio 
              ? 'rgba(139, 92, 246, 0.25)' 
              : 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(16px)',
            border: `2px ${isPlayingAudio ? 'solid #a78bfa' : 'dashed rgba(255, 255, 255, 0.2)'}`,
            borderRadius: '20px',
            padding: '20px 14px',
            textAlign: 'center',
            margin: '12px 0',
            boxShadow: isPlayingAudio ? '0 0 30px rgba(167, 139, 250, 0.4)' : '0 10px 30px rgba(0,0,0,0.2)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <button
              onClick={() => playTargetSound(question)}
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                color: '#ffffff',
                border: 'none',
                width: 'clamp(75px, 15vw, 100px)',
                height: 'clamp(75px, 15vw, 100px)',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(124, 58, 237, 0.5)',
                marginBottom: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isPlayingAudio ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <Volume2 size={36} />
            </button>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', margin: '0 0 4px 0' }}>
              {isPlayingAudio ? '🔊 Playing Arabic Sound...' : '▶️ Tap Button to Hear Sound'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#c4b5fd', fontWeight: 700, margin: 0 }}>
              Clue: <span style={{ color: '#fef08a' }}>{question.hint}</span>
            </p>
          </div>

          {/* Options Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginBottom: '12px'
          }}>
            {question.options.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrectOpt = option === question.correctAnswer;

              let btnBg = 'rgba(255, 255, 255, 0.08)';
              let btnBorder = '1.5px solid rgba(255, 255, 255, 0.15)';
              let textColor = '#ffffff';

              if (isAnswered) {
                if (isCorrectOpt) {
                  btnBg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                  btnBorder = '1.5px solid #34d399';
                } else if (isSelected) {
                  btnBg = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                  btnBorder = '1.5px solid #fca5a5';
                }
              }

              return (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isAnswered}
                  style={{
                    background: btnBg,
                    border: btnBorder,
                    borderRadius: '16px',
                    padding: '12px 8px',
                    fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                    fontFamily: "'Tufuli Arabic', var(--font-tufuli), var(--font-arabic), serif",
                    fontWeight: 900,
                    color: textColor,
                    cursor: isAnswered ? 'default' : 'pointer',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Next Button Bar */}
          {isAnswered && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleNextQuestion}
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '50px',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)'
                }}
              >
                {questionIdx < questions.length - 1 ? 'Next Sound ➡️' : 'Complete Level 🏆'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- LEVEL COMPLETED OVERLAY --- */}
      {gameState === 'completed' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 50
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '2px solid #a78bfa',
            borderRadius: '28px',
            padding: '32px',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '8px' }}>🕵️</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
              Mission Accomplished!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              You identified all Arabic sound clues correctly in {levelMeta.name}:
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a78bfa', display: 'block' }}>{score}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>FINAL SCORE</span>
              </div>
              <div>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399', display: 'block' }}>+{levelMeta.xp}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>XP WON</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => startLevel(currentLevelIdx)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '14px',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Shuffle size={18} /> Replay Shuffled Level 🔀
              </button>

              {currentLevelIdx < LEVEL_META.length - 1 && (
                <button
                  onClick={() => startLevel(currentLevelIdx + 1)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '14px',
                    borderRadius: '16px',
                    fontWeight: 900,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Next Level 🚀
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
