"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QuranVerse } from "@/data/quran-verses";
import { VersePopupProps } from "./quran-reader.types";
import styles from "./quran-reader.module.css";

// ─── Collapsible Section ─────────────────────────────────────────────────────

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.collapsible}>
      <button
        className={styles.collapsibleHeader}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <span>{title}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className={styles.collapsibleContent}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Verse Popup ─────────────────────────────────────────────────────────────

export function VersePopup({
  verse,
  verseId,
  isBookmarked,
  onCopy,
  onBookmark,
  onShare,
  onTafsir,
  onMutashabihat,
  onPlay,
  onToggleTranslation,
}: VersePopupProps) {
  const popupRef = useRef<HTMLSpanElement>(null);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const updatePosition = () => {
      if (!popupRef.current) return;
      const parent = popupRef.current.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const popupWidth = popupRef.current.offsetWidth || 210;
      const screenWidth = window.innerWidth;

      // Center of parent verse/word element on screen
      const parentCenterX = parentRect.left + parentRect.width / 2;

      // Safe bounds (at least 12px from left or right edge of screen)
      const minX = 12 + popupWidth / 2;
      const maxX = screenWidth - 12 - popupWidth / 2;
      const clampedX = Math.max(minX, Math.min(parentCenterX, maxX));

      // Calculate relative left offset from parent element's left edge
      const relativeLeft = clampedX - parentRect.left;

      setPositionStyle({
        left: `${relativeLeft}px`,
        transform: "translateX(-50%)",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  return (
    <span
      ref={popupRef}
      className={styles.versePopup}
      style={positionStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className={styles.popupBtn}
        onClick={() => onPlay(verse)}
        title="Play Verse"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>
      {onToggleTranslation && (
        <button
          className={styles.popupBtn}
          onClick={() => onToggleTranslation(verseId)}
          title="Translation"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 8l6 6" />
            <path d="M4 14l6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="M22 22l-5-10-5 10" />
            <path d="M14 18h6" />
          </svg>
        </button>
      )}
      <button
        className={styles.popupBtn}
        onClick={() => onTafsir(verseId)}
        title="Tafsir"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      </button>
      <button
        className={`${styles.popupBtn} ${isBookmarked ? styles.active : ""}`}
        onClick={() => onBookmark(verseId)}
        title="Bookmark"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={isBookmarked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
      <button
        className={styles.popupBtn}
        onClick={() => onCopy(verse)}
        title="Copy"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
      <button
        className={styles.popupBtn}
        onClick={() => onShare(verse)}
        title="Share"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
      <button
        className={styles.popupBtn}
        onClick={() => onMutashabihat(verseId)}
        title="Mutashabihat"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
          <line x1="9" y1="17" x2="13" y2="17"></line>
        </svg>
      </button>
    </span>
  );
}

// ─── Word Popup (Play & Translation Only) ────────────────────────────────────

export interface WordPopupProps {
  onPlayWord: () => void;
  onTranslation: () => void;
  isPlaying?: boolean;
}

export function WordPopup({
  onPlayWord,
  onTranslation,
  isPlaying = false,
}: WordPopupProps) {
  return (
    <span className={styles.versePopup} onClick={(e) => e.stopPropagation()}>
      <button
        className={`${styles.popupBtn} ${isPlaying ? styles.active : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onPlayWord();
        }}
        title="Play Word"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>
      <button
        className={styles.popupBtn}
        onClick={(e) => {
          e.stopPropagation();
          onTranslation();
        }}
        title="Translation & Tafsir"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 8l6 6" />
          <path d="M4 14l6-6 2-3" />
          <path d="M2 5h12" />
          <path d="M7 2h1" />
          <path d="M22 22l-5-10-5 10" />
          <path d="M14 18h6" />
        </svg>
      </button>
    </span>
  );
}

// ─── Transition Notification ─────────────────────────────────────────────────

export function TransitionNotification({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  const isJuz = title.toLowerCase().includes("juz");
  const isHizb = title.toLowerCase().includes("hizb");
  const isFinish = message.toLowerCase().includes("finished");

  return (
    <motion.div
      initial={{ opacity: 0, y: -120, scale: 0.8, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 110, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -120, scale: 0.8, filter: "blur(10px)" }}
      transition={{ type: "spring", damping: 20, stiffness: 120 }}
      className={styles.outstandingNotification}
    >
      <div
        className={`${styles.notificationGlow} ${isFinish ? styles.glowSuccess : ""}`}
      ></div>
      <div className={styles.notificationContent}>
        <div
          className={`${styles.notificationIcon} ${isJuz ? styles.iconJuz : isHizb && !title.toLowerCase().includes("rub") ? styles.iconHizb : styles.iconRub} ${isFinish ? styles.iconSuccess : ""}`}
        >
          {isFinish ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M20 6L9 17l-5-5"></path>
            </svg>
          ) : isJuz ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          ) : isHizb ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          )}
        </div>
        <div className={styles.notificationText}>
          <h3 className={isFinish ? styles.titleSuccess : ""}>
            {isFinish ? "Milestone Reached" : title}
          </h3>
          <p>{message}</p>
        </div>
        <button onClick={onClose} className={styles.notificationClose}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      {isFinish && (
        <motion.div
          className={styles.confettiContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.confettiPiece}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 1, delay: 0.1 }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Skeleton Helpers ─────────────────────────────────────────────────────────

/** A single shimmering block — composes the skeleton layouts. */
function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`${styles.skeletonBase} ${className ?? ""}`}
      style={style}
    />
  );
}

// Arabic line widths as percentages – vary them to look realistic
const ARABIC_LINE_WIDTHS = [100, 95, 88, 100, 92, 80, 100, 96, 85, 100, 90, 78, 100, 93, 87];
const TRANS_LINE_WIDTHS = [100, 90, 60];

/** Verse view skeleton: stacked verse cards with shimmering arabic lines + translation */
function VerseViewSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className={styles.verseSkeleton}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.verseSkeletonCard}>
          {/* Verse number circle — top right */}
          <div className={styles.verseSkeletonTopRow}>
            <SkeletonBlock className={styles.verseSkeletonNumber} />
          </div>

          {/* Arabic text block — 2–3 lines */}
          <div className={styles.verseSkeletonArabicBlock}>
            {[0, 1, i % 3 === 0 ? 2 : -1].filter((n) => n >= 0).map((lineIdx) => (
              <SkeletonBlock
                key={lineIdx}
                className={styles.verseSkeletonLine}
                style={{ width: `${ARABIC_LINE_WIDTHS[(i * 3 + lineIdx) % ARABIC_LINE_WIDTHS.length]}%` }}
              />
            ))}
          </div>

          {/* Translation lines */}
          <div className={styles.verseSkeletonTranslation}>
            {TRANS_LINE_WIDTHS.map((w, li) => (
              <SkeletonBlock
                key={li}
                className={styles.verseSkeletonTransLine}
                style={{ width: `${w}%` }}
              />
            ))}
          </div>

          {/* Action buttons row */}
          <div className={styles.verseSkeletonActions}>
            {Array.from({ length: 5 }).map((_, bi) => (
              <SkeletonBlock key={bi} className={`${styles.skeletonBase} ${styles.verseSkeletonBtn}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Mushaf page skeleton: a single page card with shimmer text lines */
function MushafPageSkeleton() {
  return (
    <div className={styles.pageSkeletonCard}>
      {/* Page header chips */}
      <div className={styles.pageSkeletonHeader}>
        <SkeletonBlock className={styles.pageSkeletonHeaderChip} style={{ width: 120 }} />
        <SkeletonBlock className={styles.pageSkeletonHeaderChip} style={{ width: 60 }} />
      </div>

      {/* Text lines */}
      <div className={styles.pageSkeletonLines}>
        {ARABIC_LINE_WIDTHS.map((w, i) => (
          <SkeletonBlock
            key={i}
            className={styles.pageSkeletonTextLine}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>

      {/* Page number footer */}
      <SkeletonBlock className={styles.pageSkeletonFooter} />
    </div>
  );
}

// ─── Quran Skeleton (main export) ─────────────────────────────────────────────

/** Replaces the old QuranPageLoader. Renders a skeleton matching the active view mode. */
export function QuranPageLoader({
  viewMode = "verse",
}: {
  surahName?: string; // kept for backwards-compat, unused
  viewMode?: "verse" | "page";
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {viewMode === "page" ? (
        <div className={styles.pageSkeleton}>
          <MushafPageSkeleton />
        </div>
      ) : (
        <VerseViewSkeleton count={5} />
      )}
    </motion.div>
  );
}

export function NextSurahTrigger({
  onNext,
  nextSurahNumber,
  nextSurahName,
  nextSurahNameArabic,
}: {
  onNext?: () => void;
  nextSurahNumber?: number;
  nextSurahName?: string;
  nextSurahNameArabic?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onNext || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.6 } // 60% visible
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onNext]);

  useEffect(() => {
    if (!isVisible || !onNext) {
      setProgress(0);
      return;
    }

    const duration = 1200; // 1.2 seconds
    const intervalTime = 16; // ~60fps
    const increment = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Defer the parent state update to avoid "Cannot update a component while rendering" error
          setTimeout(onNext, 0);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isVisible, onNext]);

  if (!onNext) {
    return null;
  }

  return (
    <div ref={containerRef} className={styles.nextSurahContainer}>
      <button
        type="button"
        onClick={onNext}
        className={styles.nextSurahBtn}
      >
        <div className={styles.arrowIcon}>
          <svg width="42" height="42" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="18"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="3"
            />
            <circle
              cx="21"
              cy="21"
              r="18"
              fill="transparent"
              stroke="white"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
              strokeLinecap="round"
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                transition: "stroke-dashoffset 16ms linear",
              }}
            />
            <path
              d="M19 16l5 5-5 5"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span>
          Surah {nextSurahNumber} • {nextSurahNameArabic}
        </span>
      </button>
    </div>
  );
}
