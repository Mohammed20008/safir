'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import styles from './learn.module.css';
import { UserProgress } from './types';
import { useTeachers } from '@/app/context/teacher-context';
import GeometricPattern from '@/app/components/ui/geometric-pattern';

// Import subcomponents
import TeacherMarketplace from './components/TeacherMarketplace';
import GamesArcade from './components/GamesArcade';

const BookingModal = dynamic(() => import('./booking-modal'), {
  ssr: false,
  loading: () => null
});

interface LearnPageProps {
  subject?: string;
}

export default function LearnPage({ subject }: LearnPageProps = {}) {
  const router = useRouter();

  // Active Tab Toggle ('games' or 'teachers')
  const [activeTab, setActiveTab] = useState<'games' | 'teachers'>('games');

  // User progress state
  const [userProgress, setUserProgress] = useState<UserProgress>({
    xp: 0,
    completedLessons: [],
    unlockedLevels: { arabic: ['explorer'] }
  });

  // Teacher marketplace states
  const { teachers: allTeachers } = useTeachers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'students' | 'newest'>('rating');

  // Compile certified teacher subjects
  const teacherSubjects = useMemo(() => {
    const subjectSet = new Set<string>();
    allTeachers.forEach(teacher => {
      teacher.subjects.forEach(subject => subjectSet.add(subject));
    });
    return Array.from(subjectSet);
  }, [allTeachers]);

  // Filtering teachers list
  const filteredTeachers = useMemo(() => {
    const filtered = allTeachers.filter(teacher => {
      const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.bio.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || teacher.subjects.includes(selectedSubject);
      return matchesSearch && matchesSubject;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      if (sortBy === 'students') return (b.students || 0) - (a.students || 0);
      if (sortBy === 'newest') return new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime();
      return 0;
    });
  }, [allTeachers, searchQuery, selectedSubject, sortBy]);

  // Load user data on startup
  useEffect(() => {
    const savedProgress = localStorage.getItem('quranmaster_learn_progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setUserProgress({
          xp: typeof parsed?.xp === 'number' ? parsed.xp : 0,
          completedLessons: Array.isArray(parsed?.completedLessons) ? parsed.completedLessons : [],
          unlockedLevels: parsed?.unlockedLevels && typeof parsed.unlockedLevels === 'object' ? parsed.unlockedLevels : { arabic: ['explorer'] }
        });
      } catch (err) {
        console.error('Failed to parse user progress', err);
      }
    }
  }, []);

  const saveProgress = (updatedProgress: UserProgress) => {
    localStorage.setItem('quranmaster_learn_progress', JSON.stringify(updatedProgress));
    setUserProgress(updatedProgress);
  };

  return (
    <div className={styles.container} style={{ position: 'relative', overflowX: 'hidden' }}>
      <GeometricPattern showOverlay={false} fixed={true} />

      {/* Top Navigation */}
      <div className={styles.architectBar}>
        <Link href="/" className={styles.backLink} style={{ margin: 0 }} aria-label="Back to Home" title="Back to Home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </Link>
      </div>

      {/* Hero Header */}
      <motion.div
        className={styles.hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.title}>
          <span>QuranMaster Learning Hub</span>
          Expand Your Faith
        </h1>
        <p className={styles.subtitle}>
          Engage in interactive learning games and connect with confirmed Quran scholars & Tajweed instructors.
        </p>
      </motion.div>

      {/* Primary Tab Toggler Switches */}
      <div className={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('games')}
          className={`${styles.tabButton} ${activeTab === 'games' ? styles.tabButtonActive : ''}`}
        >
          Play & Learn
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={`${styles.tabButton} ${activeTab === 'teachers' ? styles.tabButtonActive : ''}`}
        >
          Certified Teachers
        </button>
      </div>

      {/* Tab: Games Arcade */}
      {activeTab === 'games' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <GamesArcade
            styles={styles}
            userProgress={userProgress}
            onAwardXp={(xpAmount) => {
              const newXp = (userProgress?.xp || 0) + xpAmount;
              saveProgress({
                ...userProgress,
                xp: newXp,
              });
            }}
          />
        </motion.div>
      )}

      {/* Tab 2: Certified teachers listing */}
      {activeTab === 'teachers' && (
        <TeacherMarketplace
          styles={styles}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          sortBy={sortBy}
          setSortBy={setSortBy}
          teacherSubjects={teacherSubjects}
          filteredTeachers={filteredTeachers}
          onBookClick={() => setIsModalOpen(true)}
        />
      )}

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
