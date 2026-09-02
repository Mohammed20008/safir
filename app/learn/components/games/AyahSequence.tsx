'use client';

import { useState } from 'react';
import canvasConfetti from 'canvas-confetti';

interface AyahItem {
  id: string;
  order: number; // 1-indexed correct order in surah
  text: string;
  transliteration?: string;
  audioKey?: string;
}

interface SurahGame {
  id: number;
  surahNumber: number;
  name: string;
  transliteration: string;
  translation: string;
  xp: number;
  ayahs: AyahItem[];
}

const SURAH_GAMES: SurahGame[] = [
  {
    id: 1,
    surahNumber: 112,
    name: 'سورة الإخلاص',
    transliteration: 'Surah Al-Ikhlas',
    translation: 'The Sincerity',
    xp: 60,
    ayahs: [
      { id: '112_1', order: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾', transliteration: 'Qul huwal laahu ahad' },
      { id: '112_2', order: 2, text: 'اللَّهُ الصَّمَدُ ﴿٢﴾', transliteration: 'Allahus samad' },
      { id: '112_3', order: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾', transliteration: 'Lam yalid wa lam yoolad' },
      { id: '112_4', order: 4, text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾', transliteration: 'Wa lam yakul lahoo kufuwan ahad' },
    ],
  },
  {
    id: 2,
    surahNumber: 108,
    name: 'سورة الكوثر',
    transliteration: 'Surah Al-Kawthar',
    translation: 'The Abundance',
    xp: 65,
    ayahs: [
      { id: '108_1', order: 1, text: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ﴿١﴾', transliteration: 'Innaa a\'tainaakal kawthar' },
      { id: '108_2', order: 2, text: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ ﴿٢﴾', transliteration: 'Fa salli lirabbika wanhar' },
      { id: '108_3', order: 3, text: 'إِنَّ شَانِئَكَ هُوَ الأَبْتَرُ ﴿٣﴾', transliteration: 'Inna shaani\'aka huwal abtar' },
    ],
  },
  {
    id: 3,
    surahNumber: 110,
    name: 'سورة النصر',
    transliteration: 'Surah An-Nasr',
    translation: 'The Divine Support',
    xp: 70,
    ayahs: [
      { id: '110_1', order: 1, text: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ ﴿١﴾', transliteration: 'Idha jaa-a nasrullahi wal fath' },
      { id: '110_2', order: 2, text: 'وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا ﴿٢﴾', transliteration: 'Wa ra-aytan naasa yadkhuloona fee deenillahi afwaaja' },
      { id: '110_3', order: 3, text: 'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ ۚ إِنَّهُ كَانَ تَوَّابًا ﴿٣﴾', transliteration: 'Fasabbih bihamdi rabbika wastaghfirh, innahoo kaana tawwaaba' },
    ],
  },
  {
    id: 4,
    surahNumber: 113,
    name: 'سورة الفلق',
    transliteration: 'Surah Al-Falaq',
    translation: 'The Daybreak',
    xp: 80,
    ayahs: [
      { id: '113_1', order: 1, text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾', transliteration: 'Qul a\'oozhu birabbil falaq' },
      { id: '113_2', order: 2, text: 'مِن شَرِّ مَا خَلَقَ ﴿٢﴾', transliteration: 'Min sharri maa khalaq' },
      { id: '113_3', order: 3, text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾', transliteration: 'Wa min sharri ghaasiqin idha waqab' },
      { id: '113_4', order: 4, text: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾', transliteration: 'Wa min sharrin naffaathaati fil \'uqad' },
      { id: '113_5', order: 5, text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾', transliteration: 'Wa min sharri haasidin idha hasad' },
    ],
  },
];

interface AyahSequenceProps {
  styles: any;
  onAwardXp: (amount: number) => void;
  onBackToArcade: () => void;
}

export default function AyahSequence({ styles, onAwardXp, onBackToArcade }: AyahSequenceProps) {
  const [currentSurahIdx, setCurrentSurahIdx] = useState(0);
  const [placedAyahs, setPlacedAyahs] = useState<AyahItem[]>([]);
  const [poolAyahs, setPoolAyahs] = useState<AyahItem[]>([]);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');
  const [shakeActive, setShakeActive] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  const surah = SURAH_GAMES[currentSurahIdx];

  // Web Audio synthesizer for audio clues & effects
  const playAudioEffect = (type: 'place' | 'remove' | 'correct' | 'wrong' | 'victory') => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'place') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'remove') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.2);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
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

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startSurah = (idx: number) => {
    const config = SURAH_GAMES[idx];
    setCurrentSurahIdx(idx);
    setPlacedAyahs([]);

    // Shuffle pool
    const shuffled = [...config.ayahs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setPoolAyahs(shuffled);
    setGameState('playing');
    setFeedback(null);
    setXpAwarded(false);
  };

  const handleSelectFromPool = (ayah: AyahItem) => {
    playAudioEffect('place');
    setPlacedAyahs((prev) => [...prev, ayah]);
    setPoolAyahs((prev) => prev.filter((a) => a.id !== ayah.id));
    setFeedback(null);
  };

  const handleRemoveFromPlaced = (ayah: AyahItem) => {
    playAudioEffect('remove');
    setPlacedAyahs((prev) => prev.filter((a) => a.id !== ayah.id));
    setPoolAyahs((prev) => [...prev, ayah]);
    setFeedback(null);
  };

  const checkSequence = () => {
    const isCorrect = placedAyahs.every((ayah, index) => ayah.order === index + 1);

    if (isCorrect && placedAyahs.length === surah.ayahs.length) {
      playAudioEffect('victory');
      setGameState('completed');
      if (typeof window !== 'undefined') {
        canvasConfetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      }
      if (!xpAwarded) {
        onAwardXp(surah.xp);
        setXpAwarded(true);
      }
    } else {
      playAudioEffect('wrong');
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 500);
      setFeedback('Not quite right yet! Rearrange the Ayahs in order from top to bottom.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          onClick={onBackToArcade}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid var(--border)',
            padding: '0.5rem 1.25rem',
            borderRadius: '50px',
            fontWeight: 800,
            cursor: 'pointer',
            color: 'var(--foreground)',
          }}
        >
          ⬅️ Back to Arcade
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {SURAH_GAMES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => startSurah(idx)}
              style={{
                background: currentSurahIdx === idx ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'var(--card-bg)',
                color: currentSurahIdx === idx ? '#fff' : 'var(--foreground)',
                border: '2px solid ' + (currentSurahIdx === idx ? '#059669' : 'var(--border)'),
                padding: '0.4rem 0.9rem',
                borderRadius: '16px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {s.transliteration}
            </button>
          ))}
        </div>
      </div>

      {gameState === 'intro' && (
        <div style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.9) 0%, rgba(209, 250, 229, 0.9) 100%)',
          borderRadius: '24px',
          padding: '2.5rem 1.5rem',
          border: '3px dashed #10b981',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📖 Ayah Sequence Master</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#047857', marginBottom: '0.5rem' }}>
            Surah Ayah Sequence Master
          </h2>
          <p style={{ color: '#065f46', maxWidth: '520px', margin: '0 auto 2rem', fontSize: '1.05rem' }}>
            Can you assemble the scrambled Ayahs of short Surahs into their exact recitation order? Listen to audio hints and master the Quran!
          </p>

          <button
            onClick={() => startSurah(0)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              padding: '0.85rem 2.5rem',
              borderRadius: '50px',
              fontWeight: 900,
              fontSize: '1.2rem',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            }}
          >
            Start Challenge! 🚀
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div>
          {/* Header */}
          <div style={{
            background: 'var(--card-bg)',
            padding: '1rem 1.5rem',
            borderRadius: '20px',
            border: '2px solid var(--border)',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', margin: 0 }}>
                {surah.name} ({surah.transliteration})
              </h3>
              <span style={{ fontSize: '0.9rem', color: 'var(--foreground-secondary)' }}>
                {surah.translation} • {surah.ayahs.length} Ayahs
              </span>
            </div>
            <div style={{ fontWeight: 800, color: '#059669', fontSize: '1.1rem' }}>
              +{surah.xp} XP
            </div>
          </div>

          {/* Placed Slot Container */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontWeight: 800, marginBottom: '0.75rem', color: 'var(--foreground)' }}>
              📥 Your Arranged Surah (Click Ayah to remove):
            </h4>

            <div style={{
              minHeight: '140px',
              background: 'rgba(5, 150, 105, 0.05)',
              border: '3px dashed #10b981',
              borderRadius: '20px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'transform 0.2s',
              transform: shakeActive ? 'translateX(-8px)' : 'none',
            }}>
              {placedAyahs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#059669', fontWeight: 700 }}>
                  Click Ayahs below to place them here in order from Verse 1 onwards! 👇
                </div>
              ) : (
                placedAyahs.map((ayah, index) => (
                  <div
                    key={ayah.id}
                    onClick={() => handleRemoveFromPlaced(ayah)}
                    style={{
                      background: '#fff',
                      border: '2px solid #10b981',
                      borderRadius: '14px',
                      padding: '0.85rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        background: '#10b981',
                        color: '#fff',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                      }}>
                        {index + 1}
                      </span>
                      <span style={{
                        fontSize: '1.35rem',
                        fontFamily: "'Amiri', var(--font-arabic), serif",
                        fontWeight: 700,
                        color: '#047857',
                      }}>
                        {ayah.text}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(ayah.text);
                      }}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '0.35rem 0.75rem',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: '#047857',
                      }}
                    >
                      🔊 Listen
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pool Container */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontWeight: 800, marginBottom: '0.75rem', color: 'var(--foreground)' }}>
              🧩 Available Scrambled Ayahs (Click to select):
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {poolAyahs.map((ayah) => (
                <div
                  key={ayah.id}
                  onClick={() => handleSelectFromPool(ayah)}
                  style={{
                    background: 'var(--card-bg)',
                    border: '2px solid var(--border)',
                    borderRadius: '14px',
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    fontSize: '1.35rem',
                    fontFamily: "'Amiri', var(--font-arabic), serif",
                    fontWeight: 700,
                  }}>
                    {ayah.text}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(ayah.text);
                    }}
                    style={{
                      background: 'rgba(0, 0, 0, 0.05)',
                      border: 'none',
                      borderRadius: '50px',
                      padding: '0.35rem 0.75rem',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    🔊 Hint
                  </button>
                </div>
              ))}
            </div>
          </div>

          {feedback && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid #ef4444',
              padding: '0.75rem 1.25rem',
              borderRadius: '14px',
              color: '#dc2626',
              fontWeight: 800,
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}>
              {feedback}
            </div>
          )}

          {/* Action Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={checkSequence}
              disabled={placedAyahs.length !== surah.ayahs.length}
              style={{
                background: placedAyahs.length === surah.ayahs.length ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(0,0,0,0.1)',
                color: placedAyahs.length === surah.ayahs.length ? '#fff' : 'var(--foreground-secondary)',
                border: 'none',
                padding: '0.85rem 3rem',
                borderRadius: '50px',
                fontWeight: 900,
                fontSize: '1.15rem',
                cursor: placedAyahs.length === surah.ayahs.length ? 'pointer' : 'not-allowed',
                boxShadow: placedAyahs.length === surah.ayahs.length ? '0 8px 24px rgba(16, 185, 129, 0.35)' : 'none',
              }}
            >
              Verify Order ✨
            </button>
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
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🌟 MashaAllah!</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#047857', marginBottom: '0.5rem' }}>
            {surah.transliteration} Mastered!
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#065f46', marginBottom: '1.5rem' }}>
            You arranged all {surah.ayahs.length} Ayahs in perfect sequence!
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
            <span>+{surah.xp} XP Points</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              onClick={() => startSurah(currentSurahIdx)}
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
            {currentSurahIdx < SURAH_GAMES.length - 1 && (
              <button
                onClick={() => startSurah(currentSurahIdx + 1)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 2.25rem',
                  borderRadius: '50px',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                }}
              >
                Next Surah 🚀
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
