'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { surahs } from '@/data/surah-data';
import styles from './left-menu.module.css';
import { useAuth } from '@/app/context/auth-context';
import { useChat } from '@/app/context/chat-context';
import { User, Settings, LogOut, MessageCircle } from 'lucide-react';
import { renderAvatar, getAvatarPreset } from '@/app/components/avatar/avatar-utils';
import { useUserData } from '@/app/context/user-data-context';
import { useAudio } from '@/app/context/audio-context';
import { reciters, Reciter } from '@/data/reciters';
import { ViewMode } from '@/app/components/quran-reader/quran-reader.types';
import { motion, AnimatePresence } from 'framer-motion';
import WhiteboardModal from '../whiteboard/WhiteboardModal';

export interface PlaybackOption {
  id: string;
  title: string;
  description: string;
  action: () => void;
  icon: React.ReactNode;
}


interface LeftMenuProps {
  currentSurah: number;
  onSurahSelect: (surahNumber: number) => void;
  bookmarkedVerses?: Set<string>;
  onToggleBookmark?: (verseId: string) => void;
  currentPage?: number;
  pageContext?: {
    page: number;
    surahs: number[];
    startsSurahOnPage: number[];
  };
  onPrevSurah?: () => void;
  onNextSurah?: () => void;
}

type MenuSection = 'search' | 'surahs' | 'bookmarks' | 'progress' | 'settings';

// Helper function to normalize Arabic text (remove diacritics)
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670]/g, '') // Remove Arabic diacritics
    .replace(/[\u0653-\u065F]/g, '') // Remove additional marks
    .trim();
}

interface SearchResult {
  surahNum: number;
  verseNum: number;
  arabicText: string;
  englishText: string;
  key: string;
}

export default function LeftMenu({ 
  currentSurah, 
  onSurahSelect, 
  bookmarkedVerses = new Set(),
  onToggleBookmark,
  currentPage,
  pageContext,
  onPrevSurah,
  onNextSurah
}: LeftMenuProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<MenuSection | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const { user, isAdmin, openAuthModal, logout } = useAuth();
  const { unreadTotal, openChat } = useChat();
  const secondarySidebarRef = useRef<HTMLDivElement>(null);
  const primarySidebarRef = useRef<HTMLDivElement>(null);

  const { settings, updateSettings } = useUserData();
  const {
    state: audioState,
    playSurah,
    playPage,
    togglePlay,
    currentReciter,
  } = useAudio();

  const [showReciters, setShowReciters] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [playbackOptions, setPlaybackOptions] = useState<PlaybackOption[]>([]);
  const [, setQueuedReciter] = useState<Reciter | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeSurahRef = useRef<HTMLButtonElement | null>(null);

  const surah = surahs.find((s) => s.number === currentSurah);

  // Auto-scroll current opened surah into view when Surahs menu opens or surah changes
  useEffect(() => {
    if (activeSection === 'surahs' && activeSurahRef.current) {
      const timer = setTimeout(() => {
        activeSurahRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeSection, currentSurah]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowReciters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReciterSelect = (reciter: Reciter) => {
    updateSettings({ selectedReciterId: reciter.id });
    setQueuedReciter(reciter);
    setShowReciters(false);
  };

  const startPlayback = (
    type: "surah" | "page",
    sNum?: number,
    pNum?: number,
  ) => {
    const s = sNum || currentSurah;
    if (type === "surah") {
      playSurah(s);
    } else if (type === "page") {
      const p = pNum || currentPage;
      if (p) playPage(s, p);
    }
    setShowPrompt(false);
  };

  const handlePlayClick = () => {
    if (!surah) return;

    if (audioState.isPlaying) {
      togglePlay();
      return;
    }

    if (audioState.currentSurah && audioState.currentTime > 0) {
      togglePlay();
      return;
    }

    // Generate context-aware options
    const options: PlaybackOption[] = [];

    if (pageContext && pageContext.surahs.length > 0) {
      const { surahs: sOnPage, startsSurahOnPage } = pageContext;

      // If multiple surahs or transitions
      if (sOnPage.length > 1 || startsSurahOnPage.length > 0) {
        // Option for each surah starting on this page
        startsSurahOnPage.forEach((sNum) => {
          const sObj = surahs.find((s) => s.number === sNum);
          options.push({
            id: `start-${sNum}`,
            title: `Beginning of Surah ${sObj?.transliteration}`,
            description: `Start reciting ${sObj?.name} from Verse 1`,
            action: () => startPlayback("surah", sNum),
            icon: (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            ),
          });
        });

        // "From Current Page" option
        const firstSurahOnPage = sOnPage[0];
        const sObj = surahs.find((s) => s.number === firstSurahOnPage);

        // Redundancy check: if the only surah on page starts at verse 1, "From Current Page" is redundant
        const isRedundant =
          sOnPage.length === 1 && startsSurahOnPage.includes(firstSurahOnPage);

        if (!isRedundant) {
          options.push({
            id: "page-top",
            title: `From Top of Page`,
            description: `Recite from the first verse visible (${sObj?.transliteration})`,
            action: () => startPlayback("page", firstSurahOnPage),
            icon: (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            ),
          });
        }
      }
    }

    // Default options if no complex context
    if (options.length === 0) {
      options.push({
        id: "start-surah",
        title: `Beginning of Surah ${surah?.transliteration || ""}`,
        description: `Recite ${surah?.name || ""} from the start`,
        action: () => startPlayback("surah"),
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        ),
      });

      if (currentPage) {
        options.push({
          id: "page-current",
          title: `From Current Page`,
          description: `Resume from page ${currentPage}`,
          action: () => startPlayback("page"),
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          ),
        });
      }
    }

    setPlaybackOptions(options);
    setShowPrompt(true);
  };
  
  const [bookmarkTexts, setBookmarkTexts] = useState<Record<string, string>>({});

  // Load bookmark texts asynchronously when bookmarks section is open
  useEffect(() => {
    if (activeSection !== 'bookmarks' || !bookmarkedVerses || bookmarkedVerses.size === 0) return;

    let active = true;
    const loadBookmarks = async () => {
      const { fetchVerseById } = await import('@/app/actions/get-verses');
      const newTexts: Record<string, string> = { ...bookmarkTexts };
      let updated = false;

      for (const id of Array.from(bookmarkedVerses)) {
        if (!newTexts[id]) {
          const [surahNum, verseNum] = id.split('-').map(Number);
          const v = await fetchVerseById(surahNum, verseNum);
          if (v && active) {
            newTexts[id] = v.text;
            updated = true;
          }
        }
      }

      if (updated && active) {
        setBookmarkTexts(newTexts);
      }
    };

    loadBookmarks();

    return () => {
      active = false;
    };
  }, [activeSection, bookmarkedVerses]);
  // Search state
  const [advancedSearchQuery, setAdvancedSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside both sidebars
      if (
        activeSection &&
        secondarySidebarRef.current &&
        !secondarySidebarRef.current.contains(target) &&
        primarySidebarRef.current &&
        !primarySidebarRef.current.contains(target)
      ) {
        setActiveSection(null);
      }
      
      // Close user menu if clicking outside
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSection, showUserMenu]);

  // Search Quran
  useEffect(() => {
    if (!advancedSearchQuery || advancedSearchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { searchQuran } = await import('@/app/actions/get-verses');
        const results = await searchQuran(advancedSearchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Quran search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [advancedSearchQuery]);

  // Filter surahs based on search query
  const filteredSurahs = useMemo(() => {
    if (!searchQuery) return surahs;
    
    const query = searchQuery.toLowerCase();
    return surahs.filter(surah => 
      surah.name.includes(searchQuery) ||
      surah.transliteration.toLowerCase().includes(query) ||
      surah.translation.toLowerCase().includes(query) ||
      surah.number.toString().includes(query)
    );
  }, [searchQuery]);

  const handleSectionClick = (section: MenuSection) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleAccountClick = () => {
    if (user) {
      // Navigate to dashboard when clicking the account button
      router.push('/dashboard');
    } else {
      openAuthModal();
    }
  };

  const handleAccountHover = () => {
    if (user) {
      setShowUserMenu(true);
    }
  };

  return (
    <>
      {/* Floating Mobile Hamburger Menu Trigger Bar */}
      <div className={styles.mobileTriggerBar}>
        <button
          className={styles.mobileHamburgerBtn}
          onClick={() => {
            const nextState = !isMobileDrawerOpen;
            setIsMobileDrawerOpen(nextState);
            if (!nextState) {
              setActiveSection(null);
            }
          }}
          aria-label="Toggle Quran Menu"
        >
          {isMobileDrawerOpen || activeSection ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
          <span className={styles.mobileBtnText}>
            {surah ? `${surah.transliteration} (${surah.number})` : 'Quran Menu'}
          </span>
        </button>

        <div className={styles.mobileQuickActions}>
          <button
            className={styles.mobileQuickPlayBtn}
            onClick={handlePlayClick}
            aria-label={audioState.isPlaying ? "Pause Recitation" : "Play Recitation"}
          >
            {audioState.isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
      </div>

      {/* Overlay to close menu when clicking outside */}
      {(activeSection || isMobileDrawerOpen) && (
        <div 
          className={styles.overlay}
          onClick={() => {
            setActiveSection(null);
            setIsMobileDrawerOpen(false);
          }}
        />
      )}
      <div ref={primarySidebarRef} className={`${styles.primarySidebar} ${(activeSection || isMobileDrawerOpen) ? styles.mobileOpen : ''}`}>
         <div className={styles.primaryLogo}>
          <div className={styles.primaryLogoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.3"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className={styles.primaryNav}>
           <button 
            className={`${styles.primaryNavItem} ${activeSection === 'search' ? styles.active : ''}`}
            onClick={() => handleSectionClick('search')}
            title="Advanced Search"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>

           <button 
            className={`${styles.primaryNavItem} ${activeSection === 'surahs' ? styles.active : ''}`}
            onClick={() => handleSectionClick('surahs')}
            title="Surahs"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </button>
          
          <button 
            className={`${styles.primaryNavItem} ${activeSection === 'bookmarks' ? styles.active : ''}`}
            onClick={() => handleSectionClick('bookmarks')}
            title="Bookmarks"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            {bookmarkedVerses.size > 0 && (
              <span className={styles.badge}>{bookmarkedVerses.size}</span>
            )}
          </button>

          <button 
            className={`${styles.primaryNavItem} ${activeSection === 'progress' ? styles.active : ''}`}
            onClick={() => handleSectionClick('progress')}
            title="Progress"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </button>

          <Link 
            href="/learn"
            className={styles.primaryNavItem}
            title="Learn Quran"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </Link>

          <Link 
            href="/articles"
            className={styles.primaryNavItem}
            title="Islamic Articles"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </Link>

          <button 
            className={styles.primaryNavItem}
            onClick={() => openChat()}
            title="Messages"
          >
            <MessageCircle size={22} />
            {unreadTotal > 0 && (
              <span className={styles.badge}>{unreadTotal}</span>
            )}
          </button>

          <button 
            className={styles.primaryNavItem}
            onClick={() => setIsWhiteboardOpen(true)}
            title="Writing Practice / Whiteboard"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>

          <button 
            className={`${styles.primaryNavItem} ${activeSection === 'settings' ? styles.active : ''}`}
            onClick={() => handleSectionClick('settings')}
            title="Settings"
          >
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          
          <div 
            className={styles.authContainer}
            onMouseEnter={handleAccountHover}
            onMouseLeave={() => setShowUserMenu(false)}
          >
            <button 
              className={`${styles.authBtn} ${user ? styles.loggedIn : ''}`}
              onClick={handleAccountClick}
              title={user ? "Go to Dashboard" : "Sign In"}
            >
              {user ? (
                 (user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'))) ? (
                  <NextImage src={user.avatar} alt={user.name} width={32} height={32} className={styles.avatar} unoptimized />
                ) : (
                  renderAvatar(getAvatarPreset(user.avatar), user.name, 32, styles.avatar)
                )
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </button>

            {user && showUserMenu && (
              <div className={`${styles.userMenu} ${styles.visible}`}>
                <div className={styles.menuHeader}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                  {isAdmin && <span className={styles.adminBadge}>Admin</span>}
                </div>
                <Link href="/dashboard" className={styles.menuItem} onClick={() => setShowUserMenu(false)}>
                  <User size={16} /> Profile
                </Link>
                {user.role === 'teacher' && (
                    <Link href="/teacher/dashboard" className={`${styles.menuItem}`} style={{color: '#d4af37'}} onClick={() => setShowUserMenu(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      Teacher Dash
                    </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className={`${styles.menuItem} ${styles.adminItem}`} onClick={() => setShowUserMenu(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    Admin Dashboard
                  </Link>
                )}
                <button className={styles.menuItem} onClick={() => { setActiveSection('settings'); setShowUserMenu(false); }}>
                  <Settings size={16} /> Settings
                </button>
                <button 
                  className={`${styles.menuItem} ${styles.logoutBtn}`}
                  onClick={() => { logout(); setShowUserMenu(false); }}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.primaryFooter}>
          {isAdmin && (
            <Link 
              href="/admin"
              className={`${styles.primaryNavItem} ${styles.adminBtn}`}
              title="Admin Dashboard"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </Link>
          )}
          <Link 
            href="/test"
            className={`${styles.primaryNavItem} ${styles.testModeBtn}`}
            title="Test Mode"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </Link>


        </div>
      </div>

      <div ref={secondarySidebarRef} className={`${styles.secondarySidebar} ${activeSection ? styles.open : ''} ${(activeSection || isMobileDrawerOpen) ? styles.mobileOpen : ''}`}>
        {activeSection && (
          <div className={styles.secondaryContent}>
            {activeSection === 'search' && (
              <>
                <div className={styles.secondaryHeader}>
                  <h2>Search Quran</h2>
                  <p>Find verses in Arabic & English</p>
                </div>

                <div className={styles.searchBox}>
                  <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search verses in Arabic or English..."
                    value={advancedSearchQuery}
                    onChange={(e) => setAdvancedSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  {advancedSearchQuery && (
                    <button 
                      className={styles.clearBtn}
                      onClick={() => setAdvancedSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>

                <div className={styles.searchPanelContent}>
                  {isSearching ? (
                    <div className={styles.searchResultsPlaceholder}>
                      <div className={styles.loadingSpinner}></div>
                      <p>Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className={styles.searchResultsList}>
                      {searchResults.map((result, index) => (
                        <div
                          key={`${result.key}-${index}`}
                          className={styles.searchResultItem}
                          onClick={() => {
                            onSurahSelect(result.surahNum);
                            setTimeout(() => {
                              const verseElement = document.getElementById(`verse-${result.surahNum}-${result.verseNum}`);
                              if (verseElement) verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 500);
                            if (window.innerWidth < 768) setActiveSection(null);
                          }}
                        >
                          <div className={styles.searchResultRef}>
                            {surahs[result.surahNum - 1]?.transliteration} {result.key}
                          </div>
                          <p className={`${styles.searchResultText} ${styles.searchResultArabic} arabic-text`}>
                            {result.arabicText}
                          </p>
                          {result.englishText && (
                            <p className={styles.searchResultText}>{result.englishText}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : advancedSearchQuery.length >= 2 ? (
                    <div className={styles.searchResultsPlaceholder}>
                      <p>No results found</p>
                    </div>
                  ) : (
                    <div className={styles.searchResultsPlaceholder}>
                      <p>Type at least 2 characters to search</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSection === 'surahs' && (
              <>
                <div className={styles.searchBox}>
                  <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Surahs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchQuery && (
                    <button 
                      className={styles.clearBtn}
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Current Surah Navigation Card */}
                <div className={styles.currentSurahNavCard}>
                  <button
                    className={styles.currentSurahNavBtn}
                    onClick={onPrevSurah}
                    disabled={currentSurah === 1}
                    aria-label="Previous Surah"
                    title="Previous Surah"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  <div className={styles.currentSurahNavInfo}>
                    <span className={styles.currentSurahNavLabel}>Reading Surah</span>
                    <span className={`${styles.currentSurahNavName} arabic-font`}>
                      {surah?.name} ({surah?.transliteration})
                    </span>
                  </div>

                  <button
                    className={styles.currentSurahNavBtn}
                    onClick={onNextSurah}
                    disabled={currentSurah === 114}
                    aria-label="Next Surah"
                    title="Next Surah"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>

                <div className={styles.surahList}>
                  {filteredSurahs.map((surah) => (
                    <button
                      key={surah.number}
                      ref={currentSurah === surah.number ? activeSurahRef : null}
                      className={`${styles.surahItem} ${currentSurah === surah.number ? styles.active : ''}`}
                      onClick={() => {
                        onSurahSelect(surah.number);
                        setIsMobileDrawerOpen(false);
                        if (window.innerWidth < 768) {
                          setActiveSection(null);
                        }
                      }}
                    >
                      <div className={styles.surahNumber}>
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                          <path d="M18 3L23 13L34 13L25 20L29 31L18 24L7 31L11 20L2 13L13 13L18 3Z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1"/>
                          <text x="18" y="22" textAnchor="middle" fontSize="12" fontWeight="600" fill="currentColor">
                            {surah.number}
                          </text>
                        </svg>
                      </div>
                      
                      <div className={styles.surahInfo}>
                        <div className={styles.surahNames}>
                          <span className={`${styles.surahNameArabic} arabic-heading`}>{surah.name}</span>
                          <span className={styles.surahNameEn}>{surah.transliteration}</span>
                        </div>
                        <div className={styles.surahMeta}>
                          <span className={styles.verses}>{surah.totalVerses} verses</span>
                          <span className={styles.dot}>•</span>
                          <span className={styles.type}>{surah.revelationType}</span>
                        </div>
                      </div>

                      {currentSurah === surah.number && (
                        <div className={styles.activeIndicator}>
                          <svg width="6" height="6" viewBox="0 0 6 6">
                            <circle cx="3" cy="3" r="3" fill="currentColor"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}

                  {filteredSurahs.length === 0 && (
                    <div className={styles.noResults}>
                      <p>No surahs found</p>
                      <p className={styles.noResultsHint}>Try a different search term</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSection === 'bookmarks' && (
              <>
                <div className={styles.secondaryHeader}>
                  <h2>Bookmarks</h2>
                  <p>{bookmarkedVerses.size} Saved</p>
                </div>

                {bookmarkedVerses && bookmarkedVerses.size > 0 ? (
                  <div className={styles.bookmarksList}>
                    {Array.from(bookmarkedVerses).map(id => {
                      const [surahNum, verseNum] = id.split('-').map(Number);
                      const surah = surahs.find(s => s.number === surahNum);
                      
                      if (!surah) return null;
                      const verseText = bookmarkTexts[id] || 'Loading...';

                      return (
                        <div key={id} className={styles.bookmarkWrapper}>
                          <button 
                            className={styles.bookmarkItem}
                            onClick={() => onSurahSelect(surahNum)}
                          >
                            <div className={styles.bookmarkHeader}>
                              <span className={styles.bookmarkRef}>
                                {surah.transliteration} {surahNum}:{verseNum}
                              </span>
                            </div>
                            <p className={`arabic-text ${styles.bookmarkText}`}>
                              {verseText}
                            </p>
                          </button>
                          <button 
                            className={styles.deleteBookmarkBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmark?.(id);
                            }}
                            aria-label="Remove bookmark"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <h3>No Bookmarks Yet</h3>
                    <p>Bookmark verses while reading to save them here</p>
                  </div>
                )}
              </>
            )}

            {activeSection === 'progress' && (
              <>
                <div className={styles.secondaryHeader}>
                  <h2>Progress</h2>
                  <p>Track Your Journey</p>
                </div>
                <div className={styles.emptyState}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  <h3>Track Your Progress</h3>
                  <p>Your reading progress will appear here</p>
                </div>
              </>
            )}

            {activeSection === 'settings' && (
              <>
                <div className={styles.secondaryHeader}>
                  <h2>Settings</h2>
                  <p>Customize Your Experience</p>
                </div>
                
                <div className={styles.settingsPanel}>
                  {/* Theme Settings */}
                  <div className={styles.settingGroup}>
                    <label>Theme</label>
                    <div className={styles.segmentedToggle}>
                      <button
                        className={`${styles.segmentedToggleBtn} ${settings.theme === 'light' ? styles.active : ''}`}
                        onClick={() => updateSettings({ theme: 'light' })}
                        title="Light Theme"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="5"></circle>
                          <line x1="12" y1="1" x2="12" y2="3"></line>
                          <line x1="12" y1="21" x2="12" y2="23"></line>
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                          <line x1="1" y1="12" x2="3" y2="12"></line>
                          <line x1="21" y1="12" x2="23" y2="12"></line>
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                        <span>Light</span>
                      </button>
                      <button
                        className={`${styles.segmentedToggleBtn} ${settings.theme === 'sepia' ? styles.active : ''}`}
                        onClick={() => updateSettings({ theme: 'sepia' })}
                        title="Sepia Theme"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                        <span>Sepia</span>
                      </button>
                      <button
                        className={`${styles.segmentedToggleBtn} ${settings.theme === 'dark' ? styles.active : ''}`}
                        onClick={() => updateSettings({ theme: 'dark' })}
                        title="Dark Theme"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>

                  {/* View Mode (Page Modes) */}
                  <div className={styles.settingGroup}>
                    <label>View Mode</label>
                    <div className={styles.segmentedToggle}>
                      <button
                        className={`${styles.segmentedToggleBtn} ${settings.viewMode === 'verse' ? styles.active : ''}`}
                        onClick={() => updateSettings({ viewMode: 'verse' })}
                        title="Verse view"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 2h18" />
                          <rect width="18" height="12" x="3" y="6" rx="2" />
                          <path d="M3 22h18" />
                        </svg>
                        <span>Verses</span>
                      </button>
                      <button
                        className={`${styles.segmentedToggleBtn} ${settings.viewMode === 'page' ? styles.active : ''}`}
                        onClick={() => updateSettings({ viewMode: 'page' })}
                        title="Continuous Page view"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 6h4" />
                          <path d="M2 10h4" />
                          <path d="M2 14h4" />
                          <path d="M2 18h4" />
                          <rect width="16" height="20" x="4" y="2" rx="2" />
                          <path d="M9.5 8h5" />
                          <path d="M9.5 12H16" />
                          <path d="M9.5 16H14" />
                        </svg>
                        <span>Page</span>
                      </button>
                    </div>
                  </div>

                  {/* Mushaf Layout */}
                  <div className={styles.settingGroup}>
                    <label>Mushaf Layout Font</label>
                    <div className={styles.segmentedToggle}>
                      <button
                        className={`${styles.segmentedToggleBtn} ${settings.mushafLayout === 'v1' ? styles.active : ''}`}
                        onClick={() => updateSettings({ mushafLayout: 'v1' })}
                        title="V1 Print Layout"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <span>V1 Print</span>
                      </button>
                      <button
                        className={`${styles.segmentedToggleBtn} ${settings.mushafLayout === 'v4' ? styles.active : ''}`}
                        onClick={() => updateSettings({ mushafLayout: 'v4' })}
                        title="V4 Print Layout"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"></path>
                          <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                          <path d="M10.4 12.6a2 2 0 1 1-3 3l-3-3a2 2 0 0 1 3-3z"></path>
                        </svg>
                        <span>V4 Print</span>
                      </button>
                    </div>
                  </div>

                  {/* Reciter Settings */}
                  <div className={styles.settingGroup}>
                    <label>Reciter</label>
                    <div className={styles.reciterSelectWrapper} ref={dropdownRef}>
                      <button
                        className={styles.reciterSelectBtn}
                        onClick={() => setShowReciters(!showReciters)}
                      >
                        <span>{currentReciter?.name || 'Select Reciter'}</span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          style={{
                            transform: showReciters ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s",
                          }}
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {showReciters && (
                          <motion.div
                            className={styles.reciterDropdownMenu}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                          >
                            {reciters.map((reciter) => (
                              <button
                                key={reciter.id}
                                className={`${styles.reciterDropdownItem} ${settings.selectedReciterId === reciter.id ? styles.active : ''}`}
                                onClick={() => handleReciterSelect(reciter)}
                              >
                                <span className={styles.reciterDropdownName}>
                                  {reciter.name}
                                </span>
                                <span className={styles.reciterDropdownSub}>
                                  {reciter.subtext}
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Audio Playback Control Card */}
                    <div className={styles.audioPlaybackCard}>
                      <button
                        className={`${styles.audioPlaybackPlayBtn} ${audioState.isPlaying ? styles.active : ''}`}
                        onClick={handlePlayClick}
                        aria-label={audioState.isPlaying ? "Pause audio" : "Play audio"}
                        title={audioState.isPlaying ? "Pause" : "Play"}
                      >
                        {audioState.isPlaying ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        )}
                      </button>
                      <div className={styles.audioPlaybackInfo}>
                        <span className={styles.audioPlaybackTitle}>
                          {audioState.isPlaying ? 'Reciting Surah' : 'Recite Now'}
                        </span>
                        <span className={styles.audioPlaybackDesc}>
                          {surah ? `${surah.transliteration} (${surah.number})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Text Translations toggles */}
                  <div className={styles.settingGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={settings.showTranslation}
                        onChange={(e) => updateSettings({ showTranslation: e.target.checked })}
                      />
                      <span>Show Translation</span>
                    </label>
                  </div>

                  <div className={styles.settingGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={settings.showTransliteration}
                        onChange={(e) => updateSettings({ showTransliteration: e.target.checked })}
                      />
                      <span>Show Transliteration</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Playback Prompt Modal */}
      <AnimatePresence>
        {showPrompt && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowPrompt(false)}
          >
            <motion.div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3>How do you want to start?</h3>
              <p className={styles.modalSub}>
                {pageContext?.surahs && pageContext.surahs.length > 1
                  ? "Multiple surahs detected on this page."
                  : `Ready to recite Surah ${surah?.transliteration}`}
              </p>
              <div className={styles.modalActions}>
                {playbackOptions.map((opt) => (
                  <button
                    key={opt.id}
                    className={styles.modalBtn}
                    onClick={opt.action}
                  >
                    <div className={styles.modalBtnIcon}>{opt.icon}</div>
                    <div className={styles.modalBtnText}>
                      <span className={styles.modalBtnTitle}>{opt.title}</span>
                      <span className={styles.modalBtnDesc}>
                        {opt.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                className={styles.closeBtn}
                onClick={() => setShowPrompt(false)}
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WhiteboardModal isOpen={isWhiteboardOpen} onClose={() => setIsWhiteboardOpen(false)} />
    </>
  );
}