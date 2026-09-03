'use client';

import { useState } from 'react';
import canvasConfetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Volume2, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  HelpCircle, 
  Award, 
  BookOpen, 
  Flame,
  PenTool
} from 'lucide-react';

interface LetterPart {
  isolated: string;
  correctShape: string;
  positionLabel: 'Initial' | 'Medial' | 'Final' | 'Isolated';
  distractors: string[];
}

interface WordPuzzle {
  word: string;
  translation: string;
  emoji: string;
  letters: LetterPart[];
}

const EASY_WORDS: WordPuzzle[] = [
  {
    word: 'بَيْت',
    translation: 'House',
    emoji: '🏠',
    letters: [
      { isolated: 'ب', correctShape: 'بـ', positionLabel: 'Initial', distractors: ['ب', 'ـب'] },
      { isolated: 'ي', correctShape: 'ـيـ', positionLabel: 'Medial', distractors: ['يـ', 'ـي'] },
      { isolated: 'ت', correctShape: 'ـت', positionLabel: 'Final', distractors: ['ت', 'تـ'] },
    ],
  },
  {
    word: 'جَمَل',
    translation: 'Camel',
    emoji: '🐪',
    letters: [
      { isolated: 'ج', correctShape: 'جـ', positionLabel: 'Initial', distractors: ['ج', 'ـجـ'] },
      { isolated: 'م', correctShape: 'ـمـ', positionLabel: 'Medial', distractors: ['مـ', 'ـم'] },
      { isolated: 'ل', correctShape: 'ـل', positionLabel: 'Final', distractors: ['ل', 'لـ'] },
    ],
  },
  {
    word: 'عَسَل',
    translation: 'Honey',
    emoji: '🍯',
    letters: [
      { isolated: 'ع', correctShape: 'عـ', positionLabel: 'Initial', distractors: ['ع', 'ـعـ'] },
      { isolated: 'س', correctShape: 'ـسـ', positionLabel: 'Medial', distractors: ['سـ', 'س'] },
      { isolated: 'ل', correctShape: 'ـل', positionLabel: 'Final', distractors: ['ل', 'لـ'] },
    ],
  },
  {
    word: 'قَلَم',
    translation: 'Pen',
    emoji: '🖊️',
    letters: [
      { isolated: 'ق', correctShape: 'قـ', positionLabel: 'Initial', distractors: ['ق', 'ـق'] },
      { isolated: 'ل', correctShape: 'ـلـ', positionLabel: 'Medial', distractors: ['لـ', 'ل'] },
      { isolated: 'م', correctShape: 'ـم', positionLabel: 'Final', distractors: ['م', 'مـ'] },
    ],
  },
  {
    word: 'أَسَد',
    translation: 'Lion',
    emoji: '🦁',
    letters: [
      { isolated: 'أ', correctShape: 'أ', positionLabel: 'Isolated', distractors: ['أَ', 'ـأ'] },
      { isolated: 'س', correctShape: 'سـ', positionLabel: 'Initial', distractors: ['س', 'ـسـ'] },
      { isolated: 'د', correctShape: 'ـد', positionLabel: 'Final', distractors: ['د', 'دـ'] },
    ],
  },
  {
    word: 'تَاج',
    translation: 'Crown',
    emoji: '👑',
    letters: [
      { isolated: 'ت', correctShape: 'تـ', positionLabel: 'Initial', distractors: ['ت', 'ـت'] },
      { isolated: 'ا', correctShape: 'ـا', positionLabel: 'Final', distractors: ['ا', 'أ'] },
      { isolated: 'ج', correctShape: 'ج', positionLabel: 'Isolated', distractors: ['جـ', 'ـج'] },
    ],
  },
];

const MEDIUM_WORDS: WordPuzzle[] = [
  {
    word: 'كِتَاب',
    translation: 'Book',
    emoji: '📖',
    letters: [
      { isolated: 'ك', correctShape: 'كـ', positionLabel: 'Initial', distractors: ['ك', 'ـك'] },
      { isolated: 'ت', correctShape: 'ـتـ', positionLabel: 'Medial', distractors: ['تـ', 'ت'] },
      { isolated: 'ا', correctShape: 'ـا', positionLabel: 'Final', distractors: ['ا', 'أ'] },
      { isolated: 'ب', correctShape: 'ب', positionLabel: 'Isolated', distractors: ['بـ', 'ـب'] },
    ],
  },
  {
    word: 'مَسْجِد',
    translation: 'Mosque',
    emoji: '🕌',
    letters: [
      { isolated: 'م', correctShape: 'مـ', positionLabel: 'Initial', distractors: ['م', 'ـم'] },
      { isolated: 'س', correctShape: 'ـسـ', positionLabel: 'Medial', distractors: ['سـ', 'س'] },
      { isolated: 'ج', correctShape: 'ـجـ', positionLabel: 'Medial', distractors: ['جـ', 'ج'] },
      { isolated: 'د', correctShape: 'ـد', positionLabel: 'Final', distractors: ['د', 'دـ'] },
    ],
  },
  {
    word: 'زَهْرَة',
    translation: 'Flower',
    emoji: '🌸',
    letters: [
      { isolated: 'ز', correctShape: 'ز', positionLabel: 'Isolated', distractors: ['زـ', 'ـز'] },
      { isolated: 'هـ', correctShape: 'هـ', positionLabel: 'Initial', distractors: ['ـهـ', 'ـه'] },
      { isolated: 'ر', correctShape: 'ـر', positionLabel: 'Final', distractors: ['ر', 'رـ'] },
      { isolated: 'ة', correctShape: 'ة', positionLabel: 'Isolated', distractors: ['ـة', 'ت'] },
    ],
  },
];

const HARD_WORDS: WordPuzzle[] = [
  {
    word: 'مَدْرَسَة',
    translation: 'School',
    emoji: '🏫',
    letters: [
      { isolated: 'م', correctShape: 'مـ', positionLabel: 'Initial', distractors: ['م', 'ـم'] },
      { isolated: 'د', correctShape: 'ـد', positionLabel: 'Final', distractors: ['د', 'دـ'] },
      { isolated: 'ر', correctShape: 'ر', positionLabel: 'Isolated', distractors: ['ـر', 'رـ'] },
      { isolated: 'س', correctShape: 'سـ', positionLabel: 'Initial', distractors: ['س', 'ـسـ'] },
      { isolated: 'ة', correctShape: 'ـة', positionLabel: 'Final', distractors: ['ة', 'ت'] },
    ],
  },
  {
    word: 'حَدِيقَة',
    translation: 'Garden',
    emoji: '🏡',
    letters: [
      { isolated: 'ح', correctShape: 'حـ', positionLabel: 'Initial', distractors: ['ح', 'ـح'] },
      { isolated: 'د', correctShape: 'ـد', positionLabel: 'Final', distractors: ['د', 'دـ'] },
      { isolated: 'ي', correctShape: 'يـ', positionLabel: 'Initial', distractors: ['ـيـ', 'ـي'] },
      { isolated: 'ق', correctShape: 'ـقـ', positionLabel: 'Medial', distractors: ['قـ', 'ق'] },
      { isolated: 'ة', correctShape: 'ـة', positionLabel: 'Final', distractors: ['ة', 'ت'] },
    ],
  },
];

interface OptionCard {
  id: string;
  char: string;
  letterIndex: number;
}

interface WordBuilderProps {
  styles: any;
  onAwardXp: (amount: number) => void;
  onBackToArcade: () => void;
}

export default function WordBuilder({ styles, onAwardXp, onBackToArcade }: WordBuilderProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'fused' | 'gameover'>('intro');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [selectedWords, setSelectedWords] = useState<WordPuzzle[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [filledLetters, setFilledLetters] = useState<string[]>([]);
  const [currentSlotIdx, setCurrentSlotIdx] = useState(0);
  const [options, setOptions] = useState<OptionCard[]>([]);
  const [clickedCardIds, setClickedCardIds] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shakeActive, setShakeActive] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Web Audio Synthesizer
  const playSound = (type: 'correct' | 'wrong' | 'magic' | 'word') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'correct') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'magic' || type === 'word') {
        const now = ctx.currentTime;
        const playTone = (freq: number, start: number, duration: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, start);
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.1, start);
          g.gain.exponentialRampToValueAtTime(0.005, start + duration);
          o.start(start);
          o.stop(start + duration);
        };
        playTone(523.25, now, 0.2);
        playTone(659.25, now + 0.08, 0.2);
        playTone(783.99, now + 0.16, 0.2);
        playTone(1046.50, now + 0.24, 0.35);
      }
    } catch (err) {}
  };

  const initGame = (difficulty: 'easy' | 'medium' | 'hard') => {
    setSelectedDifficulty(difficulty);
    
    let wordDatabase = EASY_WORDS;
    if (difficulty === 'medium') wordDatabase = MEDIUM_WORDS;
    if (difficulty === 'hard') wordDatabase = HARD_WORDS;

    const shuffled = [...wordDatabase].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    
    setSelectedWords(selected);
    setCurrentWordIdx(0);
    setMistakes(0);
    setXpAwarded(false);
    loadPuzzleWord(selected[0]);
  };

  const loadPuzzleWord = (puzzle: WordPuzzle) => {
    setGameState('playing');
    setCurrentSlotIdx(0);
    setFilledLetters(new Array(puzzle.letters.length).fill(''));
    setClickedCardIds([]);
    setShakeActive(false);

    const cardPool: OptionCard[] = [];
    puzzle.letters.forEach((letter, letterIdx) => {
      cardPool.push({
        id: `correct_${letterIdx}_${Math.random()}`,
        char: letter.correctShape,
        letterIndex: letterIdx,
      });

      if (letter.distractors.length > 0) {
        const randomDist = letter.distractors[Math.floor(Math.random() * letter.distractors.length)];
        cardPool.push({
          id: `distractor_${letterIdx}_${Math.random()}`,
          char: randomDist,
          letterIndex: -1,
        });
      }
    });

    const shuffledPool = cardPool.sort(() => 0.5 - Math.random());
    setOptions(shuffledPool);
  };

  const handleCardClick = (card: OptionCard) => {
    if (gameState !== 'playing') return;

    const currentPuzzle = selectedWords[currentWordIdx];
    const isCorrect = card.letterIndex === currentSlotIdx;

    if (isCorrect) {
      playSound('correct');
      const updatedLetters = [...filledLetters];
      updatedLetters[currentSlotIdx] = card.char;
      setFilledLetters(updatedLetters);
      setClickedCardIds((prev) => [...prev, card.id]);

      const nextSlot = currentSlotIdx + 1;
      if (nextSlot >= currentPuzzle.letters.length) {
        setGameState('fused');
        playSound('magic');
        canvasConfetti({ particleCount: 120, spread: 70, origin: { y: 0.55 } });
      } else {
        setCurrentSlotIdx(nextSlot);
      }
    } else {
      playSound('wrong');
      setMistakes((prev) => prev + 1);
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 500);
    }
  };

  const handleNextWord = () => {
    const nextIdx = currentWordIdx + 1;
    if (nextIdx < selectedWords.length) {
      setCurrentWordIdx(nextIdx);
      loadPuzzleWord(selectedWords[nextIdx]);
    } else {
      setGameState('gameover');
      canvasConfetti({ particleCount: 160, spread: 85, origin: { y: 0.55 } });

      let xpToAward = 60;
      if (selectedDifficulty === 'medium') xpToAward = 80;
      if (selectedDifficulty === 'hard') xpToAward = 100;

      if (!xpAwarded) {
        onAwardXp(xpToAward);
        setXpAwarded(true);
      }
    }
  };

  const currentPuzzle = selectedWords[currentWordIdx];

  return (
    <div style={{
      width: '100%',
      minHeight: 'min(650px, 85vh)',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #854d0e 100%)',
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
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 20
      }}>
        <button
          onClick={onBackToArcade}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '50px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={16} /> Arcade
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fef08a' }}>
            Arabic Word Builder ✍️
          </span>
          {selectedWords.length > 0 && (
            <span style={{
              background: 'rgba(254, 240, 138, 0.15)',
              border: '1px solid rgba(254, 240, 138, 0.4)',
              color: '#fef08a',
              fontSize: '0.8rem',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '50px'
            }}>
              Word {currentWordIdx + 1} / {selectedWords.length}
            </span>
          )}
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            background: soundEnabled ? 'rgba(254, 240, 138, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${soundEnabled ? 'rgba(254, 240, 138, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: '#ffffff',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {soundEnabled ? <Volume2 size={20} /> : <Volume2 size={20} opacity={0.4} />}
        </button>
      </div>

      {/* --- PLAYING WHITEBOARD CANVAS --- */}
      {gameState === 'playing' && currentPuzzle && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          zIndex: 10
        }}>

          {/* Word Target Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(254, 240, 138, 0.3)',
            borderRadius: '24px',
            padding: '16px 32px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '480px',
            width: '100%'
          }}>
            <div style={{ fontSize: '3.2rem', marginBottom: '4px', animation: 'bounce 2.2s infinite' }}>
              {currentPuzzle.emoji}
            </div>

            <h3 style={{
              fontSize: '2rem',
              fontWeight: 950,
              color: '#fef08a',
              margin: '0 0 4px 0',
              fontFamily: 'var(--font-arabic-alt), var(--font-qpc), serif'
            }}>
              {currentPuzzle.word}
            </h3>

            <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e2e8f0', margin: '0 0 12px 0' }}>
              Meaning: <span style={{ color: '#38bdf8' }}>{currentPuzzle.translation}</span>
            </p>

            {/* RTL Formula of Isolated Letters */}
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              direction: 'rtl',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '6px 16px',
              borderRadius: '50px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>Formula:</span>
              {currentPuzzle.letters.map((letObj, idx) => (
                <span key={idx} style={{
                  fontSize: '1.3rem',
                  fontFamily: 'var(--font-arabic-alt), var(--font-qpc), serif',
                  fontWeight: 900,
                  color: '#fef08a'
                }}>
                  {letObj.isolated}
                  {idx < currentPuzzle.letters.length - 1 ? ' + ' : ''}
                </span>
              ))}
              <button
                onClick={() => playSound('word')}
                style={{
                  background: 'rgba(56, 189, 248, 0.25)',
                  border: 'none',
                  color: '#38bdf8',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '6px'
                }}
                title="Listen Word Sound"
              >
                <Volume2 size={16} />
              </button>
            </div>
          </div>

          {/* Calligraphy Construction Slots (RTL) */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexDirection: 'row-reverse',
            justifyContent: 'center',
            margin: '20px 0',
            width: '100%',
            animation: shakeActive ? 'shakeSlots 0.4s ease' : 'none'
          }}>
            {currentPuzzle.letters.map((letObj, idx) => {
              const isCurrent = idx === currentSlotIdx;
              const charVal = filledLetters[idx];

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '85px',
                    height: '85px',
                    borderRadius: '20px',
                    border: `3px ${charVal ? 'solid #fef08a' : isCurrent ? 'dashed #fde047' : 'dashed rgba(255,255,255,0.2)'}`,
                    background: charVal 
                      ? 'linear-gradient(135deg, #fef08a 0%, #eab308 100%)'
                      : isCurrent 
                        ? 'rgba(254, 240, 138, 0.15)' 
                        : 'rgba(0, 0, 0, 0.25)',
                    color: charVal ? '#1e293b' : '#ffffff',
                    fontSize: '2.4rem',
                    fontFamily: 'var(--font-arabic-alt), var(--font-qpc), serif',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isCurrent ? '0 0 20px rgba(254, 240, 138, 0.4)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}>
                    {charVal || '?'}
                  </div>

                  {/* Letter Position Badge */}
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: isCurrent ? '#fde047' : 'rgba(255, 255, 255, 0.15)',
                    color: isCurrent ? '#1e293b' : '#94a3b8',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {letObj.positionLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Letter Shape Cards Options Pool */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            padding: '16px 24px',
            width: '100%',
            maxWidth: '560px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              fontSize: '0.82rem',
              fontWeight: 900,
              color: '#fef08a',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px'
            }}>
              Choose letter shape for position: <span style={{ color: '#38bdf8' }}>{currentPuzzle.letters[currentSlotIdx]?.positionLabel}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center' }}>
              {options.map((card) => {
                const isUsed = clickedCardIds.includes(card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    disabled={isUsed}
                    style={{
                      width: '75px',
                      height: '75px',
                      borderRadius: '18px',
                      border: '2.5px solid #fde047',
                      background: isUsed ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
                      color: isUsed ? 'rgba(255,255,255,0.2)' : '#78350f',
                      fontSize: '2.2rem',
                      fontFamily: 'var(--font-arabic-alt), var(--font-qpc), serif',
                      fontWeight: 900,
                      cursor: isUsed ? 'not-allowed' : 'pointer',
                      boxShadow: isUsed ? 'none' : '0 6px 16px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      opacity: isUsed ? 0.3 : 1
                    }}
                  >
                    {card.char}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE: FUSED CELEBRATION --- */}
      {gameState === 'fused' && currentPuzzle && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          zIndex: 10
        }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '8px' }}>✨ {currentPuzzle.emoji} ✨</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34d399', marginBottom: '8px' }}>
            Beautiful Calligraphy!
          </h2>

          {/* Connected Word Glow */}
          <div style={{
            fontSize: '5.5rem',
            fontFamily: 'var(--font-arabic-alt), var(--font-qpc), serif',
            color: '#fef08a',
            textShadow: '0 0 35px rgba(254, 240, 138, 0.7)',
            margin: '16px 0',
            animation: 'pulse 1.5s infinite alternate'
          }}>
            {currentPuzzle.word}
          </div>

          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '24px' }}>
            You connected <span style={{ color: '#38bdf8' }}>{currentPuzzle.translation}</span> successfully!
          </p>

          <button
            onClick={handleNextWord}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '14px 36px',
              borderRadius: '50px',
              fontWeight: 900,
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
            }}
          >
            {currentWordIdx === selectedWords.length - 1 ? '🎉 Complete Level' : 'Next Word ➡️'}
          </button>
        </div>
      )}

      {/* --- STAGE: INTRO MODE SELECT --- */}
      {gameState === 'intro' && (
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
            border: '2px solid rgba(254, 240, 138, 0.3)',
            borderRadius: '28px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '3.8rem', marginBottom: '12px' }}>✍️</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
              Arabic Word Builder
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.6 }}>
              Learn how isolated Arabic letters change shape depending on their position (Initial, Medial, Final) to build complete Quranic words!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              <button
                onClick={() => initGame('easy')}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '14px 20px',
                  borderRadius: '18px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                <span>🟢 Easy (3-Letter Words)</span>
                <span>+60 XP</span>
              </button>

              <button
                onClick={() => initGame('medium')}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '14px 20px',
                  borderRadius: '18px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
                }}
              >
                <span>🔵 Medium (4-Letter Words)</span>
                <span>+80 XP</span>
              </button>

              <button
                onClick={() => initGame('hard')}
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '14px 20px',
                  borderRadius: '18px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)'
                }}
              >
                <span>🔴 Hard (5+ Letter Words)</span>
                <span>+100 XP</span>
              </button>
            </div>
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
            <div style={{ fontSize: '4rem', marginBottom: '8px' }}>👑</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginBottom: '4px' }}>
              Word Master!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              Spectacular spelling! You built all Arabic words correctly:
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
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ef4444', display: 'block' }}>{mistakes}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>MISTAKES</span>
              </div>
              <div>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fef08a', display: 'block' }}>+{selectedDifficulty === 'easy' ? 60 : selectedDifficulty === 'medium' ? 80 : 100}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>XP WON</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setGameState('intro')}
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
                <RotateCcw size={18} /> Play Another Level
              </button>

              <button
                onClick={onBackToArcade}
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
                Return to Arcade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
