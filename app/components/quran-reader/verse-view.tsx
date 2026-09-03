"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./quran-reader.module.css";
import { CollapsibleSection } from "./quran-reader-ui";
import { SharedViewProps } from "./quran-reader.types";

interface VerseViewProps extends SharedViewProps {
  verses: any[];
}

export default function VerseView({
  surahNumber,
  qpcData,
  loadingQPC,
  fontsLoaded,
  isTestMode,
  revealedVerses,
  bookmarkedVerses,
  fontMode,
  mushafLayout,
  displayFontSize,
  audioCurrentSurah,
  audioCurrentVerse,
  audioIsPlaying,
  toggleVerseReveal,
  copyVerse,
  handleBookmark,
  shareVerse,
  setActiveTafsirVerse,
  setActiveMutashabihatVerse,
  playVerseAudio,
  verses,
  translations,
  transliterations,
}: VerseViewProps) {
  const [playingWordKey, setPlayingWordKey] = useState<string | null>(null);
  const [wordTranslations, setWordTranslations] = useState<
    Record<string, string[]>
  >({});
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window !== "undefined") return window.innerWidth;
    return 375;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const isMobile = windowWidth < 768;
  const effectiveFontSize = isMobile ? Math.min(displayFontSize, 30) : displayFontSize;

  useEffect(() => {
    let isMounted = true;
    fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?words=true&word_fields=translation`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch words");
        return res.json();
      })
      .then((data) => {
        if (!isMounted || !data.verses) return;
        const map: Record<string, string[]> = {};
        for (const v of data.verses) {
          map[v.verse_key] = (v.words || [])
            .filter((w: any) => w.char_type_name === "word")
            .map((w: any) => w.translation?.text || "");
        }
        setWordTranslations(map);
      })
      .catch((err) => {
        console.warn("Could not load word-by-word translations:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [surahNumber]);

  const playWordOnly = (surah: number, verse: number, wordIdx: number) => {
    const key = `${surah}-${verse}-${wordIdx}`;
    const pad = (n: number) => n.toString().padStart(3, "0");
    const wordPosition = wordIdx + 1;
    const url = `https://audio.qurancdn.com/wbw/${pad(surah)}_${pad(verse)}_${pad(wordPosition)}.mp3`;

    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
    }

    const audio = new Audio(url);
    wordAudioRef.current = audio;
    setPlayingWordKey(key);

    audio.play().catch((err) => {
      console.warn("Word audio playback failed, fallback:", err);
      setPlayingWordKey(null);
    });

    audio.onended = () => {
      setPlayingWordKey(null);
    };

    audio.onerror = () => {
      setPlayingWordKey(null);
    };
  };

  return (
    <>
      {verses.map((verse) => {
        const verseId = `${surahNumber}-${verse.verse}`;
        const isBookmarked = bookmarkedVerses.has(verseId);
        const isBlurred = isTestMode && !revealedVerses.has(verseId);
        const isPlaying =
          audioCurrentSurah === surahNumber &&
          audioCurrentVerse === verse.verse;
        const isPaused = isPlaying && !audioIsPlaying;

        return (
          <div
            key={verseId}
            id={`verse-${verseId}`}
            className={`${styles.verseCard} ${isBlurred ? styles.blurredVerse : styles.revealedVerse} ${isPlaying ? styles.playing : ""} ${isPaused ? styles.paused : ""}`}
            onClick={() => isTestMode && toggleVerseReveal(verseId)}
          >
            {/* Verse Number Badge */}
            {fontMode !== "qpc" && (
              <div
                className={styles.hafsVerseMarker}
                style={{
                  position: isMobile ? "static" : "absolute",
                  top: "24px",
                  left: "24px",
                  margin: isMobile ? "0 0 10px 0" : "0",
                  fontSize: isMobile ? "0.85rem" : "1rem",
                  width: isMobile ? "32px" : "40px",
                  height: isMobile ? "32px" : "40px",
                }}
              >
                {verse.verse}
              </div>
            )}

            {/* Arabic Text with Word Hover Translation & Click Audio */}
            <div className={styles.verseTextContainer}>
              <div className={styles.arabicText}>
                {fontMode === "qpc" &&
                (loadingQPC || !fontsLoaded || !qpcData[verseId]) ? (
                  <div className={styles.skeletonVerse}>
                    <div
                      className={styles.skeletonLine}
                      style={{ width: "95%" }}
                    />
                    <div
                      className={styles.skeletonLine}
                      style={{ width: "80%" }}
                    />
                    <div
                      className={styles.skeletonLine}
                      style={{ width: "70%" }}
                    />
                  </div>
                ) : (
                  <p
                    className={
                      fontMode === "qpc"
                        ? `qpc-page-${qpcData[verseId]?.page || 0}`
                        : "arabic-text"
                    }
                    style={{
                      fontSize: `${effectiveFontSize}px`,
                      lineHeight: "1.6",
                      marginBottom: "0",
                      textAlign: "right",
                      direction: "rtl",
                      fontFamily:
                        fontMode === "qpc"
                          ? "inherit"
                          : "'Uthmanic Hafs', var(--font-arabic)",
                    }}
                  >
                    {fontMode === "qpc" && qpcData[verseId]
                      ? qpcData[verseId].words.map((w: any, wIdx: number) => {
                          const wordKey = `${surahNumber}-${verse.verse}-${wIdx}`;
                          const translation =
                            wordTranslations[`${surahNumber}:${verse.verse}`]?.[
                              wIdx
                            ] || "";
                          const isPlayingWord = playingWordKey === wordKey;

                          return (
                            <span
                              key={w.id || wIdx}
                              className={`${styles.verseWord} ${isPlayingWord ? styles.wordPlaying : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                playWordOnly(surahNumber, verse.verse, wIdx);
                              }}
                              title={
                                translation
                                  ? `Click to listen • "${translation}"`
                                  : "Click to listen"
                              }
                            >
                              {w.text}
                              {mushafLayout !== "v1" ? " " : "\u200B"}
                              {translation && (
                                <span
                                  className={styles.wordTranslationTooltip}
                                >
                                  {translation}
                                </span>
                              )}
                            </span>
                          );
                        })
                      : verse.text.split(" ").map((w: string, wIdx: number) => {
                          const wordKey = `${surahNumber}-${verse.verse}-${wIdx}`;
                          const translation =
                            wordTranslations[`${surahNumber}:${verse.verse}`]?.[
                              wIdx
                            ] || "";
                          const isPlayingWord = playingWordKey === wordKey;

                          return (
                            <span
                              key={wIdx}
                              className={`${styles.verseWord} ${isPlayingWord ? styles.wordPlaying : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                playWordOnly(surahNumber, verse.verse, wIdx);
                              }}
                              title={
                                translation
                                  ? `Click to listen • "${translation}"`
                                  : "Click to listen"
                              }
                            >
                              {w}{" "}
                              {translation && (
                                <span
                                  className={styles.wordTranslationTooltip}
                                >
                                  {translation}
                                </span>
                              )}
                            </span>
                          );
                        })}
                  </p>
                )}
              </div>
            </div>

            {/* Translation and Transliteration */}
            <div className={styles.verseTranslations}>
              {transliterations[`${surahNumber}:${verse.verse}`] && (
                <CollapsibleSection title="Transliteration">
                  <div className={styles.transliteration}>
                    <p>
                      {transliterations[`${surahNumber}:${verse.verse}`]}
                    </p>
                  </div>
                </CollapsibleSection>
              )}
              {translations[`${surahNumber}:${verse.verse}`] && (
                <CollapsibleSection title="Translation">
                  <div className={styles.translation}>
                    <p>
                      {translations[`${surahNumber}:${verse.verse}`]}
                    </p>
                  </div>
                </CollapsibleSection>
              )}
            </div>

            {/* Verse Actions */}
            <div
              className={styles.verseActions}
              style={{
                opacity: isBlurred ? 0 : 1,
                pointerEvents: isBlurred ? "none" : "auto",
              }}
            >
              <button
                className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookmark(verseId);
                }}
                aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                title={isBookmarked ? "Remove bookmark" : "Bookmark this verse"}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={isBookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
              <button
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  copyVerse(verse);
                }}
                aria-label="Copy verse"
                title="Copy verse"
              >
                <svg
                  width="18"
                  height="18"
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
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  playVerseAudio(surahNumber, verse.verse);
                }}
                aria-label="Play audio"
                title="Play verse audio"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
              <button
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMutashabihatVerse(verseId);
                }}
                aria-label="Mutashabihat"
                title="Similar Verses (Mutashabihat)"
              >
                <svg
                  width="18"
                  height="18"
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
              <button
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTafsirVerse(verseId);
                }}
                aria-label="Read Tafsir"
                title="Read Tafsir"
              >
                <svg
                  width="18"
                  height="18"
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
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  shareVerse(verse);
                }}
                aria-label="Share verse"
                title="Share verse"
              >
                <svg
                  width="18"
                  height="18"
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
            </div>
          </div>
        );
      })}
    </>
  );
}
