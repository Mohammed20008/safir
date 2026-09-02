'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LetterOrder from '../../components/games/LetterOrder';
import VowelPopper from '../../components/games/VowelPopper';
import WordBuilder from '../../components/games/WordBuilder';
import MemoryMatch from '../../components/games/MemoryMatch';
import AyahSequence from '../../components/games/AyahSequence';
import SoundDetective from '../../components/games/SoundDetective';
import styles from '../../learn.module.css';
import GeometricPattern from '@/app/components/ui/geometric-pattern';
import { ArrowLeft, Gamepad2, Award } from 'lucide-react';

interface GamePageProps {
  params: Promise<{
    subject: string;
    game: string;
  }>;
}

export default function GameRoutePage({ params }: GamePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const subjectSlug = resolvedParams.subject.toLowerCase();
  const rawGameSlug = resolvedParams.game.toLowerCase().replace(/-/g, '_');

  const [xp, setXp] = useState(0);

  // Sync XP from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('quranmaster_learn_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.xp) setXp(parsed.xp);
      }
    } catch (e) {
      // ignore SSR
    }
  }, []);

  const awardXp = (amount: number) => {
    try {
      const saved = localStorage.getItem('quranmaster_learn_progress');
      const parsed = saved ? JSON.parse(saved) : { xp: 0, completedLessons: [], unlockedLevels: {} };
      const updated = { ...parsed, xp: (parsed.xp || 0) + amount };
      localStorage.setItem('quranmaster_learn_progress', JSON.stringify(updated));
      setXp(updated.xp);
    } catch (e) {
      console.error('Error awarding XP:', e);
    }
  };

  const handleBackToArcade = () => {
    router.push('/learn?tab=games');
  };

  // Match route slug to game component
  const renderGame = () => {
    switch (rawGameSlug) {
      case 'alphabet_sorter':
      case 'letter_order':
      case 'order':
        return <LetterOrder styles={styles} onAwardXp={awardXp} onBackToArcade={handleBackToArcade} />;

      case 'tajweed_drops':
      case 'tajweed_raindrops':
      case 'vowel_popper':
      case 'popper':
        return <VowelPopper styles={styles} onAwardXp={awardXp} onBackToArcade={handleBackToArcade} />;

      case 'word_builder':
      case 'builder':
        return <WordBuilder styles={styles} onAwardXp={awardXp} onBackToArcade={handleBackToArcade} />;

      case 'memory_match':
      case 'memory':
        return <MemoryMatch styles={styles} onAwardXp={awardXp} onBackToArcade={handleBackToArcade} />;

      case 'ayah_sequence':
      case 'sequence':
        return <AyahSequence styles={styles} onAwardXp={awardXp} onBackToArcade={handleBackToArcade} />;

      case 'sound_detective':
      case 'detective':
        return <SoundDetective styles={styles} onAwardXp={awardXp} onBackToArcade={handleBackToArcade} />;

      default:
        return (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '24px',
            border: '2px dashed #cbd5e1'
          }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem', color: '#1e293b' }}>
              🎮 Game Not Found
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              The game route <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{resolvedParams.game}</code> does not exist or has moved.
            </p>
            <button
              onClick={handleBackToArcade}
              style={{
                background: 'linear-gradient(135deg, #c69320 0%, #eab308 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '50px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Return to Games Arcade 🕹️
            </button>
          </div>
        );
    }
  };

  const formatSubjectName = (sub: string) => {
    if (sub === 'arabic') return 'Arabic';
    if (sub === 'quran') return 'Quran';
    if (sub === 'tajweed') return 'Tajweed';
    return sub.charAt(0).toUpperCase() + sub.slice(1);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '2rem 1rem', position: 'relative' }}>
      <GeometricPattern fixed={true} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Navigation Breadcrumb Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          padding: '12px 24px',
          borderRadius: '20px',
          border: '1px solid rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/learn?tab=games"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--foreground)',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              <ArrowLeft size={18} /> Arcade
            </Link>
            <span style={{ color: '#94a3b8' }}>/</span>
            <span style={{ fontWeight: 800, color: '#c69320', textTransform: 'capitalize' }}>
              {formatSubjectName(subjectSlug)}
            </span>
            <span style={{ color: '#94a3b8' }}>/</span>
            <span style={{ fontWeight: 800, color: 'var(--foreground)', textTransform: 'capitalize' }}>
              {rawGameSlug.replace(/_/g, ' ')}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
            color: '#854d0e',
            padding: '6px 16px',
            borderRadius: '50px',
            fontWeight: 900,
            fontSize: '0.9rem',
            boxShadow: '0 2px 8px rgba(234, 179, 8, 0.25)'
          }}>
            <Award size={18} /> {xp} XP
          </div>
        </div>

        {/* Game Container */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {renderGame()}
        </div>
      </div>
    </div>
  );
}
