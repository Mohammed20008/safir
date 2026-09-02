'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LetterOrder from './games/LetterOrder';
import VowelPopper from './games/VowelPopper';
import WordBuilder from './games/WordBuilder';
import MemoryMatch from './games/MemoryMatch';
import AyahSequence from './games/AyahSequence';
import SoundDetective from './games/SoundDetective';

interface GamesArcadeProps {
  styles: any;
  userProgress: {
    xp: number;
    completedLessons: string[];
    unlockedLevels: Record<string, ('explorer' | 'adventure' | 'master')[]>;
  };
  onAwardXp: (amount: number) => void;
}

type GameKey = 'menu' | 'order' | 'popper' | 'builder' | 'memory' | 'sequence' | 'detective';
type CategoryTab = 'all' | 'alphabet' | 'words' | 'surahs';

export default function GamesArcade({ styles, userProgress, onAwardXp }: GamesArcadeProps) {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<GameKey>('menu');
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');

  if (selectedGame === 'order') {
    return <LetterOrder styles={styles} onAwardXp={onAwardXp} onBackToArcade={() => setSelectedGame('menu')} />;
  }

  if (selectedGame === 'popper') {
    return <VowelPopper styles={styles} onAwardXp={onAwardXp} onBackToArcade={() => setSelectedGame('menu')} />;
  }

  if (selectedGame === 'builder') {
    return <WordBuilder styles={styles} onAwardXp={onAwardXp} onBackToArcade={() => setSelectedGame('menu')} />;
  }

  if (selectedGame === 'memory') {
    return <MemoryMatch styles={styles} onAwardXp={onAwardXp} onBackToArcade={() => setSelectedGame('menu')} />;
  }

  if (selectedGame === 'sequence') {
    return <AyahSequence styles={styles} onAwardXp={onAwardXp} onBackToArcade={() => setSelectedGame('menu')} />;
  }

  if (selectedGame === 'detective') {
    return <SoundDetective styles={styles} onAwardXp={onAwardXp} onBackToArcade={() => setSelectedGame('menu')} />;
  }

  const allGames = [
    {
      key: 'order' as GameKey,
      slug: 'alphabet_sorter',
      subject: 'arabic',
      title: 'Alphabet Sorter',
      category: 'alphabet' as CategoryTab,
      icon: '🧩',
      difficulty: 'Easy',
      difficultyBg: '#10b981',
      desc: 'Sort the shuffled Arabic letters from Alif to Yaa in their correct alphabetical order right-to-left!',
      awardText: '+60 XP points',
      cardBg: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
      btnBg: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
      btnShadow: 'rgba(234, 179, 8, 0.3)',
    },
    {
      key: 'popper' as GameKey,
      slug: 'tajweed_drops',
      subject: 'arabic',
      title: 'Tajweed Raindrops',
      category: 'alphabet' as CategoryTab,
      icon: '🌧️',
      difficulty: 'Medium',
      difficultyBg: '#2563eb',
      desc: 'Master Arabic Vowels, Tanween, and Tajweed rules (Qalqalah, Ghunnah, Tafkheem) with interactive power-ups!',
      awardText: 'Up to +75 XP points',
      cardBg: 'linear-gradient(135deg, #bae6fd 0%, #38bdf8 100%)',
      btnBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      btnShadow: 'rgba(59, 130, 246, 0.3)',
    },
    {
      key: 'builder' as GameKey,
      slug: 'word_builder',
      subject: 'arabic',
      title: 'Arabic Word Builder',
      category: 'words' as CategoryTab,
      icon: '✍️',
      difficulty: 'Hard',
      difficultyBg: '#ea580c',
      desc: 'Learn how isolated Arabic letters change shape and connect together to spell complete Quranic words!',
      awardText: '+70 XP points',
      cardBg: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
      btnBg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      btnShadow: 'rgba(234, 88, 12, 0.3)',
    },
    {
      key: 'memory' as GameKey,
      slug: 'memory_match',
      subject: 'arabic',
      title: 'Memory Match',
      category: 'alphabet' as CategoryTab,
      icon: '🧠',
      difficulty: 'Medium',
      difficultyBg: '#ec4899',
      desc: 'Flip the 3D cards to find matching pairs of Arabic letters, harakat vowels, and Tajweed symbols!',
      awardText: '+65 XP points',
      cardBg: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)',
      btnBg: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      btnShadow: 'rgba(236, 72, 153, 0.3)',
    },
    {
      key: 'sequence' as GameKey,
      slug: 'ayah_sequence',
      subject: 'quran',
      title: 'Ayah Sequence Master',
      category: 'surahs' as CategoryTab,
      icon: '📖',
      difficulty: 'Hard',
      difficultyBg: '#059669',
      desc: 'Assemble scrambled Ayahs of short Surahs into their exact recitation order with audio clues!',
      awardText: '+80 XP points',
      cardBg: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 100%)',
      btnBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      btnShadow: 'rgba(16, 185, 129, 0.3)',
    },
    {
      key: 'detective' as GameKey,
      slug: 'sound_detective',
      subject: 'arabic',
      title: 'Sound Detective',
      category: 'alphabet' as CategoryTab,
      icon: '🎧',
      difficulty: 'Medium',
      difficultyBg: '#8b5cf6',
      desc: 'Listen to native Arabic letter sounds and makhraj clues, then pick the correct letter or vowel!',
      awardText: '+75 XP points',
      cardBg: 'linear-gradient(135deg, #ddd6fe 0%, #a78bfa 100%)',
      btnBg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      btnShadow: 'rgba(139, 92, 246, 0.3)',
    },
  ];

  const filteredGames = allGames.filter(
    (game) => activeTab === 'all' || game.category === activeTab
  );

  return (
    <div>
      {/* Arcade Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', padding: '0 1rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', animation: 'bounce 2s infinite' }}>🕹️</div>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: 950,
          background: 'linear-gradient(135deg, #c69320 0%, #eab308 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
        }}>
          Play & Learn Arcade 🎮
        </h2>
        <p style={{ color: 'var(--foreground-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
          Reinforce your Arabic reading, Tajweed rules, and Quranic memorization with fun mini-games!
        </p>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              background: activeTab === 'all' ? 'linear-gradient(135deg, #c69320 0%, #eab308 100%)' : 'transparent',
              color: activeTab === 'all' ? '#fff' : 'var(--foreground)',
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: '50px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            All Games (6) 🎮
          </button>
          <button
            onClick={() => setActiveTab('alphabet')}
            style={{
              background: activeTab === 'alphabet' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
              color: activeTab === 'alphabet' ? '#fff' : 'var(--foreground)',
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: '50px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Letters & Sounds 🅰️
          </button>
          <button
            onClick={() => setActiveTab('words')}
            style={{
              background: activeTab === 'words' ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'transparent',
              color: activeTab === 'words' ? '#fff' : 'var(--foreground)',
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: '50px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Words & Building 🛠️
          </button>
          <button
            onClick={() => setActiveTab('surahs')}
            style={{
              background: activeTab === 'surahs' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: activeTab === 'surahs' ? '#fff' : 'var(--foreground)',
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: '50px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Surahs & Sequence 📖
          </button>
        </div>
      </div>

      {/* Games Grid Selection */}
      <div className={styles.gamesArcadeGrid}>
        {filteredGames.map((game) => (
          <div key={game.key} className={styles.gameCard}>
            <div className={styles.gameCardHeader} style={{ background: game.cardBg }}>
              {game.icon}
              <span className={styles.difficultyBadge} style={{ background: game.difficultyBg }}>
                {game.difficulty}
              </span>
            </div>
            <div className={styles.gameCardContent}>
              <h3 className={styles.gameCardTitle}>{game.title}</h3>
              <p className={styles.gameCardDesc}>{game.desc}</p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.04)',
                padding: '8px 16px',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}>
                <span>🎁 Reward:</span>
                <span style={{ fontWeight: 800 }}>{game.awardText}</span>
              </div>
              <button
                onClick={() => router.push(`/learn/${game.subject}/${game.slug}`)}
                className={styles.playGameBtn}
                style={{
                  background: game.btnBg,
                  boxShadow: `0 8px 20px ${game.btnShadow}`,
                }}
              >
                Play Game 🚀
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
