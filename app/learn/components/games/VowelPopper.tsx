'use client';

import { useState, useEffect } from 'react';
import canvasConfetti from 'canvas-confetti';
import { 
  Volume2, 
  VolumeX, 
  Snowflake, 
  Shield, 
  Zap, 
  Trophy, 
  Sparkles, 
  RotateCcw, 
  ArrowLeft, 
  Star, 
  Flame,
  Award
} from 'lucide-react';

// --- DATA STRUCTURES & TAJWEED DATASETS ---
export type TajweedMode = 'vowels' | 'tanween' | 'rules';

export interface TajweedQuestion {
  id: string;
  char: string;
  ruleCategory: 'Harakat' | 'Tanween' | 'Qalqalah' | 'Ghunnah' | 'Tafkheem' | 'Madd';
  title: string;
  correctAnswer: string;
  explanation: string;
  options: string[];
}

const VOWEL_QUESTIONS: TajweedQuestion[] = [
  { id: 'v1', char: 'أَ', ruleCategory: 'Harakat', title: 'Alif Fathah', correctAnswer: 'A (Short sound)', explanation: 'Fathah makes a short "a" sound above the letter.', options: ['A (Short sound)', 'E (Kasrah sound)', 'O (Dammah sound)', 'Ban (Tanween)'] },
  { id: 'v2', char: 'بِ', ruleCategory: 'Harakat', title: 'Baa Kasrah', correctAnswer: 'Bi (Kasrah)', explanation: 'Kasrah makes a short "i / e" sound under the letter.', options: ['Ba', 'Bi (Kasrah)', 'Bu', 'Bin'] },
  { id: 'v3', char: 'تُ', ruleCategory: 'Harakat', title: 'Taa Dammah', correctAnswer: 'Tu (Dammah)', explanation: 'Dammah makes a rounded "u / o" sound above the letter.', options: ['Ta', 'Ti', 'Tu (Dammah)', 'Tun'] },
  { id: 'v4', char: 'جَ', ruleCategory: 'Harakat', title: 'Jeem Fathah', correctAnswer: 'Ja (Fathah)', explanation: 'Fathah gives Jeem a light "Ja" sound.', options: ['Ja (Fathah)', 'Ji', 'Ju', 'Jan'] },
  { id: 'v5', char: 'حِ', ruleCategory: 'Harakat', title: 'Haa Kasrah', correctAnswer: 'Hi (Kasrah)', explanation: 'Clean throat sound with Kasrah.', options: ['Ha', 'Hi (Kasrah)', 'Hu', 'Hin'] },
  { id: 'v6', char: 'دُ', ruleCategory: 'Harakat', title: 'Dal Dammah', correctAnswer: 'Du (Dammah)', explanation: 'Dammah on Dal makes "Du".', options: ['Da', 'Di', 'Du (Dammah)', 'Dun'] },
  { id: 'v7', char: 'رَ', ruleCategory: 'Harakat', title: 'Raa Fathah', correctAnswer: 'Ra (Heavy Fathah)', explanation: 'Raa with Fathah is pronounced heavy (Tafkheem).', options: ['Ra (Heavy Fathah)', 'Ri', 'Ru', 'Ran'] },
  { id: 'v8', char: 'سِ', ruleCategory: 'Harakat', title: 'Seen Kasrah', correctAnswer: 'Si (Kasrah)', explanation: 'Soft whistling letter with Kasrah sound.', options: ['Sa', 'Si (Kasrah)', 'Su', 'Sin'] },
  { id: 'v9', char: 'مُ', ruleCategory: 'Harakat', title: 'Meem Dammah', correctAnswer: 'Mu (Dammah)', explanation: 'Rounded lips sound "Mu".', options: ['Ma', 'Mi', 'Mu (Dammah)', 'Mun'] },
  { id: 'v10', char: 'نَ', ruleCategory: 'Harakat', title: 'Noon Fathah', correctAnswer: 'Na (Fathah)', explanation: 'Front tongue light sound "Na".', options: ['Na (Fathah)', 'Ni', 'Nu', 'Nan'] }
];

const TANWEEN_QUESTIONS: TajweedQuestion[] = [
  { id: 't1', char: 'بً', ruleCategory: 'Tanween', title: 'Baa Fathatan', correctAnswer: 'Ban (Double Fathah)', explanation: 'Fathatan adds an "N" sound at the end ("Ban").', options: ['Ba', 'Ban (Double Fathah)', 'Bin', 'Bun'] },
  { id: 't2', char: 'كٍ', ruleCategory: 'Tanween', title: 'Kaaf Kasratan', correctAnswer: 'Kin (Double Kasrah)', explanation: 'Kasratan adds an "N" sound below the letter ("Kin").', options: ['Ka', 'Kan', 'Kin (Double Kasrah)', 'Kun'] },
  { id: 't3', char: 'مٌ', ruleCategory: 'Tanween', title: 'Meem Dammatan', correctAnswer: 'Mun (Double Dammah)', explanation: 'Dammatan adds an "N" sound above the letter ("Mun").', options: ['Ma', 'Man', 'Min', 'Mun (Double Dammah)'] },
  { id: 't4', char: 'قً', ruleCategory: 'Tanween', title: 'Qaaf Fathatan', correctAnswer: 'Qan (Heavy Tanween)', explanation: 'Heavy Qaaf sound combined with double Fathah.', options: ['Qa', 'Qan (Heavy Tanween)', 'Qin', 'Qun'] },
  { id: 't5', char: 'نٍ', ruleCategory: 'Tanween', title: 'Noon Kasratan', correctAnswer: 'Nin (Double Kasrah)', explanation: 'Double Kasrah under Noon makes "Nin".', options: ['Na', 'Nan', 'Nin (Double Kasrah)', 'Nun'] },
  { id: 't6', char: 'لٌ', ruleCategory: 'Tanween', title: 'Laam Dammatan', correctAnswer: 'Lun (Double Dammah)', explanation: 'Double Dammah on Laam makes "Lun".', options: ['La', 'Lan', 'Lin', 'Lun (Double Dammah)'] },
  { id: 't7', char: 'مْ', ruleCategory: 'Tanween', title: 'Meem Sukoon', correctAnswer: 'M (Silent Sukoon)', explanation: 'Sukoon stops the vowel sound completely.', options: ['Ma', 'Mi', 'Mu', 'M (Silent Sukoon)'] }
];

const TAJWEED_RULES_QUESTIONS: TajweedQuestion[] = [
  { id: 'r1', char: 'قْ', ruleCategory: 'Qalqalah', title: 'Qaaf Sukoon', correctAnswer: 'Qalqalah 🔔 (Echo sound)', explanation: 'Qalqalah letters (ق ط ب ج د) echo when stationary (Sukoon).', options: ['Qalqalah 🔔 (Echo sound)', 'Ghunnah 🔊 (Nasal hum)', 'Tafkheem 🪨 (Heavy)', 'Madd 🌊 (Stretch)'] },
  { id: 'r2', char: 'نَّ', ruleCategory: 'Ghunnah', title: 'Noon Shaddah', correctAnswer: 'Ghunnah 🔊 (2-Count Nasal Hum)', explanation: 'Noon & Meem with Shaddah require a 2-count nasal Ghunnah sound.', options: ['Qalqalah 🔔 (Echo)', 'Ghunnah 🔊 (2-Count Nasal Hum)', 'Short Vowel', 'Sukoon Stop'] },
  { id: 'r3', char: 'خَ', ruleCategory: 'Tafkheem', title: 'Khaa Fathah', correctAnswer: 'Tafkheem 🪨 (Heavy Full-Mouth)', explanation: 'Khaa (خ) is one of 7 naturally heavy letters (خ ص ض غ ط ق ظ).', options: ['Light Sound (Tarqeeq)', 'Tafkheem 🪨 (Heavy Full-Mouth)', 'Qalqalah 🔔', 'Ghunnah 🔊'] },
  { id: 'r4', char: 'طْ', ruleCategory: 'Qalqalah', title: 'Taa Sukoon', correctAnswer: 'Qalqalah 🔔 (Echo sound)', explanation: 'Emphatic Taa with Sukoon produces a sharp echo bounce.', options: ['Qalqalah 🔔 (Echo sound)', 'Ghunnah 🔊', 'Madd 🌊', 'Tanween'] },
  { id: 'r5', char: 'بَا', ruleCategory: 'Madd', title: 'Baa + Alif Madd', correctAnswer: 'Madd 🌊 (Natural 2-Count Stretch)', explanation: 'Alif following Fathah elongates the sound to 2 counts ("Baaa").', options: ['Short Vowel', 'Madd 🌊 (Natural 2-Count Stretch)', 'Qalqalah 🔔', 'Ghunnah 🔊'] },
  { id: 'r6', char: 'مَّ', ruleCategory: 'Ghunnah', title: 'Meem Shaddah', correctAnswer: 'Ghunnah 🔊 (2-Count Nasal Hum)', explanation: 'Meem with Shaddah must be held with a nasal hum for 2 counts.', options: ['Ghunnah 🔊 (2-Count Nasal Hum)', 'Qalqalah 🔔', 'Sukoon', 'Light Vowel'] },
  { id: 'r7', char: 'صَ', ruleCategory: 'Tafkheem', title: 'Saad Fathah', correctAnswer: 'Tafkheem 🪨 (Heavy Full-Mouth)', explanation: 'Saad (ص) is a heavy letter requiring full mouth resonance.', options: ['Light Whistle', 'Tafkheem 🪨 (Heavy Full-Mouth)', 'Madd 🌊', 'Tanween'] }
];

interface ActiveDrop {
  question: TajweedQuestion;
  y: number;
  x: number;
  shake: boolean;
  frozen: boolean;
}

interface VowelPopperProps {
  styles: any;
  onAwardXp: (amount: number) => void;
  onBackToArcade: () => void;
}

const TOTAL_ROUND_DROPS = 12;

// Custom Animated Vector Cloud Character Component (No Emojis!)
const AnimatedVectorCloud = ({ emotion }: { emotion: 'happy' | 'super' | 'worried' }) => (
  <div style={{ position: 'relative', width: '120px', height: '75px', animation: 'floatCloud 3s ease-in-out infinite alternate' }}>
    <svg viewBox="0 0 120 80" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.35))' }}>
      <defs>
        <linearGradient id="cloudGradBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
      </defs>
      {/* Fluffy Vector Cloud Contour */}
      <path
        d="M 25 62 C 12 62 5 50 12 38 C 16 28 28 24 36 28 C 42 14 62 10 74 20 C 84 12 102 18 104 32 C 114 40 112 56 100 62 Z"
        fill="url(#cloudGradBody)"
        stroke="#bae6fd"
        strokeWidth="3"
      />
      
      {/* Vector Face Expressions */}
      {emotion === 'super' ? (
        <>
          {/* Star Eyes for Super Combo */}
          <path d="M 40 33 L 42 38 L 47 38 L 43 41 L 45 46 L 40 43 L 35 46 L 37 41 L 33 38 L 38 38 Z" fill="#f59e0b" />
          <path d="M 80 33 L 82 38 L 87 38 L 83 41 L 85 46 L 80 43 L 75 46 L 77 41 L 73 38 L 78 38 Z" fill="#f59e0b" />
          {/* Joyful Open Mouth */}
          <path d="M 50 46 Q 60 60 70 46 Z" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" />
        </>
      ) : emotion === 'worried' ? (
        <>
          {/* Slanted Worried Eyebrows */}
          <path d="M 36 27 L 46 31" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          <path d="M 84 27 L 74 31" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          {/* Wide Concerned Eyes */}
          <circle cx="41" cy="37" r="4.5" fill="#1e293b" />
          <circle cx="79" cy="37" r="4.5" fill="#1e293b" />
          {/* Sad Wavy Mouth */}
          <path d="M 48 52 Q 60 44 72 52" stroke="#1e293b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Water Sweat Drop */}
          <path d="M 95 20 C 95 20 99 26 95 29 C 92 29 92 25 95 20 Z" fill="#38bdf8" />
        </>
      ) : (
        <>
          {/* Cute Happy Eyes */}
          <circle cx="42" cy="36" r="4.5" fill="#0f172a" />
          <circle cx="78" cy="36" r="4.5" fill="#0f172a" />
          {/* Rosy Cheek Blushes */}
          <ellipse cx="33" cy="42" rx="5" ry="3" fill="#f472b6" opacity="0.65" />
          <ellipse cx="87" cy="42" rx="5" ry="3" fill="#f472b6" opacity="0.65" />
          {/* Cute Smile */}
          <path d="M 49 44 Q 60 55 71 44" stroke="#0f172a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  </div>
);

export default function VowelPopper({ styles, onAwardXp, onBackToArcade }: VowelPopperProps) {
  // Game states
  const [gameState, setGameState] = useState<'mode_select' | 'intro' | 'countdown' | 'playing' | 'gameover'>('mode_select');
  const [selectedMode, setSelectedMode] = useState<TajweedMode>('vowels');
  const [countdown, setCountdown] = useState(3);
  
  // Scoring & Stats
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);

  // Power-Ups
  const [freezeCharges, setFreezeCharges] = useState(1);
  const [shieldActive, setShieldActive] = useState(false);
  const [thunderCharges, setThunderCharges] = useState(1);
  const [isFrozen, setIsFrozen] = useState(false);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Raindrop gameplay
  const [dropIndex, setDropIndex] = useState(0);
  const [currentDrop, setCurrentDrop] = useState<ActiveDrop | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  // FX state
  const [splashes, setSplashes] = useState<{ id: string; x: number; y: number; type: 'correct' | 'wrong' | 'ground' }[]>([]);
  const [popups, setPopups] = useState<{ id: string; text: string; x: number; y: number; color: string }[]>([]);

  // Load high score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tajweed_drops_highscore');
      if (saved) setHighScore(parseInt(saved, 10));
    } catch (e) {
      // ignore SSR
    }
  }, []);

  // Web Audio Synthesizer for Clean Game SFX
  const playSoundEffect = (type: 'correct' | 'wrong' | 'splash' | 'freeze' | 'thunder' | 'shield' | 'fanfare') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.18);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'splash') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'freeze') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'thunder') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'shield') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Audio block fallback
    }
  };

  const getQuestionsPool = (): TajweedQuestion[] => {
    if (selectedMode === 'tanween') return TANWEEN_QUESTIONS;
    if (selectedMode === 'rules') return TAJWEED_RULES_QUESTIONS;
    return VOWEL_QUESTIONS;
  };

  const handleStartGame = () => {
    setGameState('countdown');
    setCountdown(3);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setMistakes(0);
    setFreezeCharges(1);
    setShieldActive(false);
    setThunderCharges(1);
    setIsFrozen(false);
    setDropIndex(0);
    setSplashes([]);
    setPopups([]);
    setXpAwarded(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('playing');
          spawnDrop(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const spawnDrop = (idx: number) => {
    if (idx >= TOTAL_ROUND_DROPS) {
      handleGameOver();
      return;
    }

    const pool = getQuestionsPool();
    const randomQ = pool[Math.floor(Math.random() * pool.length)];

    const shuffledOpts = [...randomQ.options].sort(() => 0.5 - Math.random());
    const preparedQuestion: TajweedQuestion = {
      ...randomQ,
      options: shuffledOpts
    };

    const randomX = Math.floor(Math.random() * 55) + 20;

    setSelectedOption(null);
    setIsAnswering(false);
    setDropIndex(idx);
    setCurrentDrop({
      question: preparedQuestion,
      y: 0,
      x: randomX,
      shake: false,
      frozen: false
    });
  };

  const triggerFreeze = () => {
    if (freezeCharges <= 0 || isFrozen || !currentDrop || gameState !== 'playing') return;
    setFreezeCharges((prev) => prev - 1);
    setIsFrozen(true);
    playSoundEffect('freeze');

    addPopup('❄️ TIME FROZEN!', currentDrop.x, currentDrop.y, '#38bdf8');

    setTimeout(() => {
      setIsFrozen(false);
    }, 4500);
  };

  const triggerThunder = () => {
    if (thunderCharges <= 0 || !currentDrop || isAnswering || gameState !== 'playing') return;
    setThunderCharges((prev) => prev - 1);
    playSoundEffect('thunder');

    const correctIdx = currentDrop.question.options.findIndex(
      (opt) => opt === currentDrop.question.correctAnswer
    );
    if (correctIdx !== -1) {
      handleSelectOption(correctIdx, true);
    }
  };

  const handleSelectOption = (optionIdx: number, isThunder: boolean = false) => {
    if (gameState !== 'playing' || !currentDrop || isAnswering) return;
    setIsAnswering(true);
    setSelectedOption(optionIdx);

    const chosenText = currentDrop.question.options[optionIdx];
    const isCorrect = chosenText === currentDrop.question.correctAnswer;

    if (isCorrect) {
      playSoundEffect('correct');
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));

      if (newCombo === 5) {
        setFreezeCharges((prev) => prev + 1);
        addPopup('❄️ BONUS FREEZE!', 50, 40, '#38bdf8');
      } else if (newCombo === 8) {
        setShieldActive(true);
        playSoundEffect('shield');
        addPopup('🛡️ SHIELD ACTIVE!', 50, 40, '#10b981');
      }

      const basePoints = 15;
      const comboBonus = (newCombo - 1) * 5;
      const thunderBonus = isThunder ? 10 : 0;
      const pointsGained = basePoints + comboBonus + thunderBonus;

      setScore((prev) => prev + pointsGained);

      const splashId = Math.random().toString();
      setSplashes((prev) => [...prev, { id: splashId, x: currentDrop.x, y: currentDrop.y, type: 'correct' }]);
      setTimeout(() => {
        setSplashes((prev) => prev.filter((s) => s.id !== splashId));
      }, 450);

      addPopup(
        `+${pointsGained} XP ${newCombo > 1 ? `🔥 x${newCombo}` : ''}`,
        currentDrop.x,
        currentDrop.y,
        '#10b981'
      );

      setTimeout(() => {
        spawnDrop(dropIndex + 1);
      }, 400);
    } else {
      playSoundEffect('wrong');
      setCombo(0);
      setMistakes((prev) => prev + 1);

      setCurrentDrop((prev) => (prev ? { ...prev, shake: true } : null));
      setTimeout(() => {
        setCurrentDrop((prev) => (prev ? { ...prev, shake: false } : null));
      }, 400);

      addPopup('❌ Try Again!', currentDrop.x, currentDrop.y, '#ef4444');

      setTimeout(() => {
        setIsAnswering(false);
        setSelectedOption(null);
      }, 400);
    }
  };

  const handleDropMissed = () => {
    if (!currentDrop || isAnswering) return;
    setIsAnswering(true);

    if (shieldActive) {
      playSoundEffect('shield');
      setShieldActive(false);
      addPopup('🛡️ SHIELD SAVED YOU!', 50, 80, '#10b981');
      setTimeout(() => {
        spawnDrop(dropIndex + 1);
      }, 450);
      return;
    }

    playSoundEffect('splash');
    setCombo(0);
    setMistakes((prev) => prev + 1);

    const splashId = Math.random().toString();
    setSplashes((prev) => [...prev, { id: splashId, x: currentDrop.x, y: 92, type: 'ground' }]);
    setTimeout(() => {
      setSplashes((prev) => prev.filter((s) => s.id !== splashId));
    }, 450);

    addPopup('💧 Splashed!', currentDrop.x, 85, '#0284c7');

    setTimeout(() => {
      spawnDrop(dropIndex + 1);
    }, 450);
  };

  const addPopup = (text: string, x: number, y: number, color: string) => {
    const popupId = Math.random().toString();
    setPopups((prev) => [...prev, { id: popupId, text, x, y, color }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 850);
  };

  useEffect(() => {
    if (gameState !== 'playing' || !currentDrop || isAnswering) return;

    const speed = isFrozen ? 0.2 : 0.75 + Math.min(0.8, combo * 0.06);

    const timer = setInterval(() => {
      setCurrentDrop((prev) => {
        if (!prev) return null;
        const nextY = prev.y + speed;
        if (nextY >= 96) {
          clearInterval(timer);
          handleDropMissed();
          return { ...prev, y: 96 };
        }
        return { ...prev, y: nextY };
      });
    }, 45);

    return () => clearInterval(timer);
  }, [gameState, currentDrop === null, dropIndex, combo, isAnswering, isFrozen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !currentDrop || isAnswering) return;
      if (e.key === '1') handleSelectOption(0);
      if (e.key === '2') handleSelectOption(1);
      if (e.key === '3') handleSelectOption(2);
      if (e.key === '4') handleSelectOption(3);
      if (e.key.toLowerCase() === 'f') triggerFreeze();
      if (e.key.toLowerCase() === 't') triggerThunder();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentDrop, isAnswering, freezeCharges, thunderCharges]);

  const handleGameOver = () => {
    setGameState('gameover');
    playSoundEffect('fanfare');
    canvasConfetti({ particleCount: 140, spread: 80, origin: { y: 0.55 } });

    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('tajweed_drops_highscore', score.toString());
      } catch (e) {}
    }

    const earnedXp = Math.min(75, Math.floor(score / 4));
    if (earnedXp > 0 && !xpAwarded) {
      onAwardXp(earnedXp);
      setXpAwarded(true);
    }
  };

  const getCloudEmotionState = (): 'happy' | 'super' | 'worried' => {
    if (!currentDrop) return 'happy';
    if (combo >= 5) return 'super';
    if (currentDrop.y > 70) return 'worried';
    return 'happy';
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '680px',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%)',
      borderRadius: '28px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
      position: 'relative',
      overflow: 'hidden',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      userSelect: 'none'
    }}>
      
      {/* Dynamic Ambient Weather Particles */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.15,
        backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        animation: 'rainFallBg 6s linear infinite'
      }} />

      {/* --- PLAYING CANVAS LAYOUT (CLOUD AT THE ABSOLUTE TOP, ALL CONTROLS & CHOICES IN RIGHT SIDEBAR) --- */}
      {gameState === 'playing' && currentDrop && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}>

          {/* LEFT: RAINDROP FALLING ARENA (CLOUD AT VERY TOP: top 4px) */}
          <div style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>

            {/* Vector Character Cloud (AT THE VERY TOP, NOTHING ABOVE IT!) */}
            <div style={{
              position: 'absolute',
              top: '4px',
              left: `${currentDrop.x}%`,
              transform: 'translateX(-50%)',
              transition: 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <AnimatedVectorCloud emotion={getCloudEmotionState()} />
            </div>

            {/* Falling Raindrop Component (Crystal Clear & Unclipped) */}
            <div style={{
              position: 'absolute',
              left: `${currentDrop.x}%`,
              top: `calc(70px + ${currentDrop.y} * (100% - 220px) / 100)`,
              transform: `translateX(-50%) ${currentDrop.shake ? 'shake 0.4s' : ''}`,
              opacity: currentDrop.y >= 96 || (isAnswering && selectedOption !== null) ? 0 : 1,
              transition: 'opacity 0.2s ease, top 0.05s linear',
              zIndex: 12,
              width: '110px',
              height: '145px',
              overflow: 'visible'
            }}>
              <svg viewBox="0 0 100 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="dropGradPrimary" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isFrozen ? '#a5f3fc' : '#38bdf8'} />
                    <stop offset="100%" stopColor={isFrozen ? '#0284c7' : '#0369a1'} />
                  </linearGradient>
                </defs>
                {/* Crystal Clear Raindrop Outer Path */}
                <path
                  d="M 50 8 C 74 48 90 72 90 92 A 40 40 0 0 1 10 92 C 10 72 26 48 50 8 Z"
                  fill="url(#dropGradPrimary)"
                  stroke={isFrozen ? '#e0f2fe' : '#bae6fd'}
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                {/* Glossy Top-Left Water Highlight */}
                <path
                  d="M 32 38 C 38 24 46 16 50 16"
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Arabic Letter */}
                <text
                  x="50"
                  y="80"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize="48"
                  fontWeight="900"
                  fontFamily="var(--font-arabic-alt), var(--font-qpc), serif"
                  filter="drop-shadow(0px 2.5px 2px rgba(0, 0, 0, 0.4))"
                >
                  {currentDrop.question.char}
                </text>
              </svg>
            </div>

            {/* Render FX Splashes */}
            {splashes.map((splash) => (
              <div
                key={splash.id}
                style={{
                  position: 'absolute',
                  left: `${splash.x}%`,
                  top: `calc(70px + ${splash.y} * (100% - 200px) / 100)`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 15,
                  width: '120px',
                  height: '120px',
                  animation: 'splashBurst 0.45s ease-out forwards'
                }}
              >
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', fill: splash.type === 'correct' ? '#34d399' : '#38bdf8' }}>
                  <circle cx="50" cy="50" r="15" opacity="0.6" />
                  <path d="M50 50 L40 10 A4 4 0 0 1 50 10 Z" />
                  <path d="M50 50 L10 40 A4 4 0 0 1 10 50 Z" />
                  <path d="M50 50 L25 75 A4 4 0 0 1 15 65 Z" />
                  <path d="M50 50 L60 90 A4 4 0 0 1 50 90 Z" />
                  <path d="M50 50 L90 60 A4 4 0 0 1 90 50 Z" />
                </svg>
              </div>
            ))}

            {/* Render FX Floating Popups */}
            {popups.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: `calc(70px + ${p.y} * (100% - 200px) / 100)`,
                  transform: 'translateX(-50%)',
                  color: p.color,
                  fontWeight: 900,
                  fontSize: '1.4rem',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                  zIndex: 25,
                  pointerEvents: 'none',
                  animation: 'floatUpAndFade 0.85s ease-out forwards'
                }}
              >
                {p.text}
              </div>
            ))}

            {/* Water Floor Splash Line */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: 0,
              right: 0,
              height: '14px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.5) 50%, transparent 100%)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* RIGHT: INTEGRATED SIDEBAR PANEL (HUD CONTROLS + STATS + POWER-UPS + VERTICAL CHOICES) */}
          <div style={{
            width: '300px',
            minWidth: '300px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            borderLeft: '1.5px solid rgba(255, 255, 255, 0.12)',
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            zIndex: 20,
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.35)'
          }}>

            {/* Top Navigation & Sound Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={onBackToArcade}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '50px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={14} /> Arcade
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  background: soundEnabled ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${soundEnabled ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>

            {/* Round & Score Header Box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 800 }}>Tajweed Drops 🌧️</span>
                <span style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#7dd3fc',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '50px'
                }}>
                  {dropIndex + 1} / {TOTAL_ROUND_DROPS}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 800 }}>
                  <Trophy size={16} color="#f59e0b" /> Score: <span style={{ color: '#38bdf8', fontSize: '1.1rem' }}>{score}</span>
                </div>

                {combo > 1 && (
                  <span style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: '50px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                  }}>
                    🔥 x{combo}
                  </span>
                )}
              </div>

              {shieldActive && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Shield size={14} /> Shield Active
                </div>
              )}
            </div>

            {/* Power-Ups Bar */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={triggerFreeze}
                disabled={freezeCharges <= 0 || isFrozen}
                style={{
                  flex: 1,
                  background: freezeCharges > 0 ? (isFrozen ? '#0284c7' : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)') : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: freezeCharges > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  opacity: freezeCharges > 0 ? 1 : 0.4
                }}
              >
                <Snowflake size={14} /> Freeze ({freezeCharges})
              </button>

              <button
                onClick={triggerThunder}
                disabled={thunderCharges <= 0 || isAnswering}
                style={{
                  flex: 1,
                  background: thunderCharges > 0 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: thunderCharges > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  opacity: thunderCharges > 0 ? 1 : 0.4
                }}
              >
                <Zap size={14} /> Thunder ({thunderCharges})
              </button>
            </div>

            {/* Vertical Choices Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#38bdf8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Choose Correct Sound:
              </div>

              {currentDrop.question.options.map((optionText, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrectOpt = optionText === currentDrop.question.correctAnswer;

                let btnBg = 'rgba(255, 255, 255, 0.08)';
                let btnBorder = '1.5px solid rgba(255, 255, 255, 0.15)';
                let textColor = '#ffffff';

                if (isSelected) {
                  if (isCorrectOpt) {
                    btnBg = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    btnBorder = '1.5px solid #34d399';
                  } else {
                    btnBg = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                    btnBorder = '1.5px solid #fca5a5';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    style={{
                      background: btnBg,
                      border: btnBorder,
                      color: textColor,
                      borderRadius: '14px',
                      padding: '14px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      flexShrink: 0
                    }}>
                      {oIdx + 1}
                    </span>

                    <span style={{ fontSize: '0.92rem', fontWeight: 800, flex: 1, lineHeight: 1.3 }}>
                      {optionText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE: MODE SELECT & INTRO OVERLAY --- */}
      {gameState === 'mode_select' && (
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
            border: '2px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '28px',
            padding: '32px',
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🌧️</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
              Tajweed Raindrops
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.6 }}>
              Select a learning mode to practice your Tajweed rules and Arabic vowels before raindrops splash on the ground!
            </p>

            {/* Category Select Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              <div
                onClick={() => setSelectedMode('vowels')}
                style={{
                  background: selectedMode === 'vowels' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${selectedMode === 'vowels' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '18px',
                  padding: '14px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '1.8rem' }}>💧</div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    1. Short Vowels (Harakat)
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Practice Fathah (َ), Kasrah (ِ), and Dammah (ُ)
                  </p>
                </div>
              </div>

              <div
                onClick={() => setSelectedMode('tanween')}
                style={{
                  background: selectedMode === 'tanween' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${selectedMode === 'tanween' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '18px',
                  padding: '14px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '1.8rem' }}>⚡</div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    2. Tanween & Sukoon
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Master Double Vowels (ً ٍ ٌ) and Silent Sukoon (ْ)
                  </p>
                </div>
              </div>

              <div
                onClick={() => setSelectedMode('rules')}
                style={{
                  background: selectedMode === 'rules' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${selectedMode === 'rules' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '18px',
                  padding: '14px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '1.8rem' }}>👑</div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    3. Tajweed Core Rules
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Qalqalah 🔔, Ghunnah 🔊, Tafkheem 🪨, & Madd 🌊
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '14px',
                borderRadius: '18px',
                fontWeight: 900,
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={20} /> Start Playing Now!
            </button>
          </div>
        </div>
      )}

      {/* --- STAGE: COUNTDOWN OVERLAY --- */}
      {gameState === 'countdown' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            fontSize: '7rem',
            fontWeight: 950,
            color: '#38bdf8',
            animation: 'pulse 0.8s infinite alternate',
            textShadow: '0 0 30px rgba(56, 189, 248, 0.6)'
          }}>
            {countdown > 0 ? countdown : 'GO! 🌧️'}
          </div>
        </div>
      )}

      {/* --- STAGE: GAMEOVER OVERLAY --- */}
      {gameState === 'gameover' && (
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
            border: '2px solid #10b981',
            borderRadius: '28px',
            padding: '32px',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '8px' }}>🏆</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
              Awesome Job!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              You completed the Tajweed Raindrops round!
            </p>

            {/* Stars rating */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <Star size={32} color="#f59e0b" fill="#f59e0b" />
              <Star size={32} color="#f59e0b" fill={score >= 100 ? '#f59e0b' : 'none'} />
              <Star size={32} color="#f59e0b" fill={score >= 180 ? '#f59e0b' : 'none'} />
            </div>

            {/* Scorecard */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', display: 'block' }}>{score}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>SCORE</span>
              </div>
              <div>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b', display: 'block' }}>{maxCombo}x</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>STREAK</span>
              </div>
              <div>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399', display: 'block' }}>+{Math.min(75, Math.floor(score / 4))}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>XP WON</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleStartGame}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                <RotateCcw size={18} /> Play Again
              </button>

              <button
                onClick={() => setGameState('mode_select')}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '16px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Change Game Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
