'use client';

import { useState, useEffect } from 'react';
import canvasConfetti from 'canvas-confetti';

interface MemoryCard {
  id: string;
  pairId: string;
  content: string;
  subtext?: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface LevelConfig {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  gridSize: string; // e.g. '3x4' or '4x4'
  xp: number;
  pairs: { pairId: string; content: string; subtext?: string }[];
}

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Arabic Alphabet Pairs',
    difficulty: 'Easy',
    gridSize: '3x4',
    xp: 50,
    pairs: [
      { pairId: 'alif', content: 'أ', subtext: 'Alif' },
      { pairId: 'baa', content: 'ب', subtext: 'Baa' },
      { pairId: 'taa', content: 'ت', subtext: 'Taa' },
      { pairId: 'thaa', content: 'ث', subtext: 'Thaa' },
      { pairId: 'jeem', content: 'ج', subtext: 'Jeem' },
      { pairId: 'haa', content: 'ح', subtext: 'Haa' },
    ],
  },
  {
    id: 2,
    name: 'Vowel & Sound Matching',
    difficulty: 'Medium',
    gridSize: '4x4',
    xp: 65,
    pairs: [
      { pairId: 'fatha', content: 'بَ', subtext: 'Ba (Fatha)' },
      { pairId: 'kasra', content: 'بِ', subtext: 'Bi (Kasra)' },
      { pairId: 'damma', content: 'بُ', subtext: 'Bu (Damma)' },
      { pairId: 'tanween_f', content: 'بً', subtext: 'Ban (Tanween)' },
      { pairId: 'tanween_k', content: 'بٍ', subtext: 'Bin (Tanween)' },
      { pairId: 'tanween_d', content: 'بٌ', subtext: 'Bun (Tanween)' },
      { pairId: 'sukun', content: 'بْ', subtext: 'B (Sukun)' },
      { pairId: 'shadda', content: 'بَّ', subtext: 'Bba (Shadda)' },
    ],
  },
  {
    id: 3,
    name: 'Tajweed Rules & Symbols',
    difficulty: 'Hard',
    gridSize: '4x4',
    xp: 80,
    pairs: [
      { pairId: 'lazim', content: 'ۘ', subtext: 'Mandatory Stop (Lāzim)' },
      { pairId: 'mutlaq', content: 'ۚ', subtext: 'Permissible Stop (Jā\'iz)' },
      { pairId: 'awla_stop', content: 'ۗ', subtext: 'Better to Stop (Qalā)' },
      { pairId: 'awla_cont', content: 'ۖ', subtext: 'Better to Continue (Ṣalā)' },
      { pairId: 'muanaqa', content: 'ۛ', subtext: 'Embracing Stop (3 Dots)' },
      { pairId: 'saktah', content: '۩', subtext: 'Sajdah Symbol' },
      { pairId: 'madd', content: 'ۤ', subtext: 'Elongation (Madd)' },
      { pairId: 'ghunnah', content: 'نّ', subtext: 'Nasal Sound (Ghunnah)' },
    ],
  },
];

interface MemoryMatchProps {
  styles: any;
  onAwardXp: (amount: number) => void;
  onBackToArcade: () => void;
}

export default function MemoryMatch({ styles, onAwardXp, onBackToArcade }: MemoryMatchProps) {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');
  const [xpAwarded, setXpAwarded] = useState(false);

  const level = LEVELS[currentLevelIdx];

  // Sound synthesizer
  const playSound = (type: 'flip' | 'match' | 'mismatch' | 'victory') => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'flip') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'match') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.22);
        osc2.stop(now + 0.22);
      } else if (type === 'mismatch') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.18);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'victory') {
        const playNote = (freq: number, start: number, dur: number) => {
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
        playNote(523.25, now, 0.2); // C5
        playNote(659.25, now + 0.1, 0.2); // E5
        playNote(783.99, now + 0.2, 0.2); // G5
        playNote(1046.50, now + 0.3, 0.4); // C6
      }
    } catch (e) {
      // Audio context blocked fallback
    }
  };

  const startLevel = (lvlIdx: number) => {
    const config = LEVELS[lvlIdx];
    setCurrentLevelIdx(lvlIdx);

    // Duplicate pairs to create matching deck
    const deck: MemoryCard[] = [];
    config.pairs.forEach((p) => {
      deck.push({
        id: `${p.pairId}_1_${Math.random()}`,
        pairId: p.pairId,
        content: p.content,
        subtext: p.subtext,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: `${p.pairId}_2_${Math.random()}`,
        pairId: p.pairId,
        content: p.content,
        subtext: p.subtext,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairsCount(0);
    setIsBusy(false);
    setGameState('playing');
    setXpAwarded(false);
  };

  const handleCardClick = (card: MemoryCard) => {
    if (isBusy || card.isFlipped || card.isMatched) return;

    playSound('flip');

    // Flip selected card
    const updatedCards = cards.map((c) => (c.id === card.id ? { ...c, isFlipped: true } : c));
    setCards(updatedCards);

    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsBusy(true);
      setMoves((m) => m + 1);

      const [card1, card2] = newFlipped;

      if (card1.pairId === card2.pairId) {
        // Match!
        setTimeout(() => {
          playSound('match');
          setCards((prev) =>
            prev.map((c) => (c.pairId === card1.pairId ? { ...c, isMatched: true } : c))
          );
          setFlippedCards([]);
          setIsBusy(false);
          setMatchedPairsCount((count) => {
            const nextCount = count + 1;
            if (nextCount === level.pairs.length) {
              // Level complete!
              handleVictory();
            }
            return nextCount;
          });
        }, 400);
      } else {
        // Mismatch!
        setTimeout(() => {
          playSound('mismatch');
          setCards((prev) =>
            prev.map((c) => (c.id === card1.id || c.id === card2.id ? { ...c, isFlipped: false } : c))
          );
          setFlippedCards([]);
          setIsBusy(false);
        }, 900);
      }
    }
  };

  const handleVictory = () => {
    playSound('victory');
    setGameState('completed');
    if (typeof window !== 'undefined') {
      canvasConfetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
    if (!xpAwarded) {
      onAwardXp(level.xp);
      setXpAwarded(true);
    }
  };

  return (
    <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', padding: '0 0.5rem' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={onBackToArcade}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid var(--border)',
            padding: '0.4rem 1rem',
            borderRadius: '50px',
            fontWeight: 800,
            cursor: 'pointer',
            color: 'var(--foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            fontSize: '0.9rem',
          }}
        >
          ⬅️ Back to Arcade
        </button>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {LEVELS.map((lvl, idx) => (
            <button
              key={lvl.id}
              onClick={() => startLevel(idx)}
              style={{
                background: currentLevelIdx === idx ? 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)' : 'var(--card-bg)',
                color: currentLevelIdx === idx ? '#fff' : 'var(--foreground)',
                border: '2px solid ' + (currentLevelIdx === idx ? '#ec4899' : 'var(--border)'),
                padding: '0.35rem 0.75rem',
                borderRadius: '16px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Lvl {lvl.id}
            </button>
          ))}
        </div>
      </div>

      {gameState === 'intro' && (
        <div style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(253, 242, 248, 0.9) 0%, rgba(250, 232, 255, 0.9) 100%)',
          borderRadius: '24px',
          padding: '2rem 1rem',
          border: '3px dashed #f472b6',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🧠 Flip & Match!</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#be185d', marginBottom: '0.5rem' }}>
            Tajweed & Letter Memory Match
          </h2>
          <p style={{ color: '#9d174d', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
            Test your memory! Flip the cards to find matching Arabic letters, diacritic sounds, and Tajweed symbols!
          </p>

          <button
            onClick={() => startLevel(0)}
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '50px',
              fontWeight: 900,
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)',
            }}
          >
            Start Playing! 🚀
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* Level Header Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--card-bg)',
            padding: '0.6rem 1rem',
            borderRadius: '18px',
            border: '2px solid var(--border)',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}>
            <div>
              <span style={{ fontWeight: 800, color: '#ec4899' }}>Level {level.id}: </span>
              <span style={{ fontWeight: 700 }}>{level.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontWeight: 800 }}>
              <div>Moves: <span style={{ color: '#d946ef' }}>{moves}</span></div>
              <div>Pairs: <span style={{ color: '#10b981' }}>{matchedPairsCount} / {level.pairs.length}</span></div>
            </div>
          </div>

          {/* Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            perspective: '1000px',
          }}>
            {cards.map((card) => {
              const showContent = card.isFlipped || card.isMatched;
              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  style={{
                    height: 'clamp(75px, 18vw, 105px)',
                    borderRadius: '14px',
                    cursor: card.isMatched ? 'default' : 'pointer',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: showContent ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Card Front (Hidden) */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(135deg, #f472b6 0%, #c084fc 100%)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 12px rgba(244, 114, 182, 0.3)',
                    border: '2px solid #fff',
                  }}>
                    ✨
                  </div>

                  {/* Card Back (Flipped / Revealed) */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: card.isMatched ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : '#fff',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    border: '2.5px solid ' + (card.isMatched ? '#10b981' : '#ec4899'),
                    boxShadow: card.isMatched ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(236, 72, 153, 0.2)',
                  }}>
                    <span style={{
                      fontSize: 'clamp(1.2rem, 4vw, 2rem)',
                      fontFamily: "'Tufuli Arabic', var(--font-tufuli), var(--font-arabic), serif",
                      color: card.isMatched ? '#047857' : '#be185d',
                      fontWeight: 900,
                      lineHeight: 1.1,
                    }}>
                      {card.content}
                    </span>
                    {card.subtext && (
                      <span style={{ fontSize: 'clamp(0.6rem, 2vw, 0.75rem)', fontWeight: 800, color: card.isMatched ? '#065f46' : '#9d174d', marginTop: '1px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {card.subtext}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'completed' && (
        <div style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(209, 250, 229, 0.95) 100%)',
          borderRadius: '24px',
          padding: '2.5rem 1.5rem',
          border: '3px solid #10b981',
          boxShadow: '0 12px 32px rgba(16, 185, 129, 0.2)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🎉 Level Cleared!</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#047857', marginBottom: '0.5rem' }}>
            Outstanding Memory Skill!
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#065f46', marginBottom: '1.5rem' }}>
            Completed in <strong style={{ color: '#047857' }}>{moves} moves</strong>!
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px dashed #10b981',
            padding: '0.75rem 2rem',
            borderRadius: '50px',
            marginBottom: '2rem',
            fontWeight: 900,
            fontSize: '1.2rem',
            color: '#047857',
          }}>
            <span>⭐ Reward:</span>
            <span>+{level.xp} XP Points</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              onClick={() => startLevel(currentLevelIdx)}
              style={{
                background: '#fff',
                color: '#047857',
                border: '2px solid #10b981',
                padding: '0.75rem 1.75rem',
                borderRadius: '50px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Play Again 🔄
            </button>
            {currentLevelIdx < LEVELS.length - 1 && (
              <button
                onClick={() => startLevel(currentLevelIdx + 1)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 2.25rem',
                  borderRadius: '50px',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(16, 185, 129, 0.3)',
                }}
              >
                Next Level 🚀
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
