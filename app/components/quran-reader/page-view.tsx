"use client";

import { Fragment, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./quran-reader.module.css";
import { VersePopup } from "./quran-reader-ui";
import { SharedViewProps } from "./quran-reader.types";
import { surahs } from "@/data/surah-data";
import {
  alignPageWordsToLines,
  AlignedLine,
  AlignedWord,
  QPC_BASMALAH_WORDS,
} from "./qpc-layout";

interface PageViewProps extends SharedViewProps {
  verses: any[];
  allVerses: any[];
}

interface VerseSegment {
  verseId: string;
  verse: any;
  words: AlignedWord[];
}

function groupLineWordsIntoSegments(lineWords: AlignedWord[]): VerseSegment[] {
  const segments: VerseSegment[] = [];
  if (lineWords.length === 0) return segments;

  let currentSegment: VerseSegment = {
    verseId: lineWords[0].verseId,
    verse: lineWords[0].verse,
    words: [lineWords[0]],
  };

  for (let i = 1; i < lineWords.length; i++) {
    const w = lineWords[i];
    if (w.verseId === currentSegment.verseId) {
      currentSegment.words.push(w);
    } else {
      segments.push(currentSegment);
      currentSegment = {
        verseId: w.verseId,
        verse: w.verse,
        words: [w],
      };
    }
  }
  segments.push(currentSegment);
  return segments;
}

export default function PageView({
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
  displayLineHeight,
  juzData,
  pageMapping,
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
  allVerses,
}: PageViewProps) {
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== "undefined") {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 375, height: 667 };
  });
  const [hoveredVerseId, setHoveredVerseId] = useState<string | null>(null);
  const [selectedVerseId, setSelectedVerseId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      const handleResize = () =>
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener("resize", handleResize);

      const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target && !target.closest("[data-verse-id]") && !target.closest(`.${styles.versePopup}`)) {
          setSelectedVerseId(null);
          setHoveredVerseId(null);
        }
      };
      document.addEventListener("click", handleGlobalClick);
      document.addEventListener("touchstart", handleGlobalClick);

      return () => {
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("click", handleGlobalClick);
        document.removeEventListener("touchstart", handleGlobalClick);
      };
    }
  }, []);

  const handleVerseMouseEnter = (verseId: string) => {
    if (typeof document !== "undefined") {
      const els = document.querySelectorAll(`[data-verse-id="${verseId}"]`);
      els.forEach((el) => el.classList.add(styles.verseHovered));
    }
  };

  const handleVerseMouseLeave = (verseId: string) => {
    if (typeof document !== "undefined") {
      const els = document.querySelectorAll(`[data-verse-id="${verseId}"]`);
      els.forEach((el) => {
        if (el.getAttribute("data-selected") !== "true") {
          el.classList.remove(styles.verseHovered);
        }
      });
    }
  };

  const handlePageContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.closest("[data-verse-id]") ||
        target.closest(`.${styles.versePopup}`) ||
        target.closest("button") ||
        target.closest("a"))
    ) {
      return;
    }
    if (typeof document !== "undefined") {
      const isZen = document.documentElement.getAttribute("data-zen-mode") === "true";
      if (isZen) {
        document.documentElement.removeAttribute("data-zen-mode");
      } else {
        document.documentElement.setAttribute("data-zen-mode", "true");
      }
    }
  };

  const isMobile = windowSize.width < 768;

  // Standard Madani Mushaf page dimensions for single page mode
  const BASE_PAGE_FONT_SIZE = 26;
  const BASE_PAGE_WIDTH = mushafLayout === "v1" ? 500 : 520;

  // On mobile screens, maximize page width and scale text larger for maximum readability
  const effectiveDisplayFontSize = isMobile ? Math.min(displayFontSize, 28) : displayFontSize;

  // Compute zoom ratio based on user's displayFontSize
  const basePageZoom = effectiveDisplayFontSize / BASE_PAGE_FONT_SIZE;

  // Maximum allowed width fitting viewport on mobile
  const maxAllowedWidth = isMobile
    ? windowSize.width
    : Math.max(300, Math.min(windowSize.width - 32, 920));

  // Desired page width based on requested font size
  const desiredPageWidth = basePageZoom * BASE_PAGE_WIDTH;

  // Page width maximized to fit full view on mobile
  const actualPageWidth = isMobile ? windowSize.width : Math.min(desiredPageWidth, maxAllowedWidth);

  // Scaled font size strictly proportional to actual page width with mobile boost
  const finalFontSize = isMobile
    ? Math.max((actualPageWidth / BASE_PAGE_WIDTH) * BASE_PAGE_FONT_SIZE, 19.5)
    : (actualPageWidth / BASE_PAGE_WIDTH) * BASE_PAGE_FONT_SIZE;
  // Memoize page bucketing and active page list sorting for continuous Quran swiping
  const { sortedActivePages, pages } = useMemo(() => {
    const pageSet = new Set<number>();

    // Add pages from qpcData
    Object.values(qpcData).forEach((v) => {
      if (v.page) pageSet.add(v.page);
    });

    // Add starting pages from pageMapping for all surahs
    Object.values(pageMapping || {}).forEach((p) => {
      if (p) pageSet.add(p);
    });

    // Expand page window around current surah start page for continuous swiping
    const startP = pageMapping?.[`${surahNumber}:1`] || 1;
    for (let p = Math.max(1, startP - 15); p <= Math.min(604, startP + 25); p++) {
      pageSet.add(p);
    }

    const activePagesList = Array.from(pageSet).sort((a, b) => a - b);

    // Bucket verses per page: a verse belongs to pageNum if ANY of its words belong to pageNum
    const versesByPage: Record<number, any[]> = {};
    allVerses.forEach((v) => {
      const vQpc = qpcData[v.verseKey];
      const pagesForVerse = new Set<number>();
      if (vQpc?.words && vQpc.words.length > 0) {
        vQpc.words.forEach((w: any) => {
          if (w.page) pagesForVerse.add(w.page);
        });
      }
      if (pagesForVerse.size === 0 && vQpc?.page) {
        pagesForVerse.add(vQpc.page);
      }

      pagesForVerse.forEach((p) => {
        if (!versesByPage[p]) versesByPage[p] = [];
        if (!versesByPage[p].some((existing: any) => existing.verseKey === v.verseKey)) {
          versesByPage[p].push(v);
        }
      });
    });

    const pagesRecord: Record<number, any[]> = {};
    activePagesList.forEach((p) => {
      pagesRecord[p] = versesByPage[p] && versesByPage[p].length > 0 ? versesByPage[p] : verses;
    });

    return { sortedActivePages: activePagesList, pages: pagesRecord };
  }, [verses, qpcData, surahNumber, pageMapping, allVerses]);

  // Smooth scroll container to active surah start page when surah selection changes
  useEffect(() => {
    const startP = pageMapping?.[`${surahNumber}:1`];
    if (startP) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`mushaf-page-${startP}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [surahNumber, pageMapping]);

const toArabicNumerals = (num: number | string): string => {
  if (num === undefined || num === null || num === "") return "";
  return String(num).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d, 10)]);
};

  const getPageInfo = (pNum: number) => {
    const pVerses = pages[pNum];
    if (!pVerses || pVerses.length === 0)
      return { sName: "", jNum: "", pageNumArabic: toArabicNumerals(pNum) };
    const firstV = pVerses[0];
    const sInfo = surahs.find((s) => s.number === firstV.chapter);
    let jNum = "";
    if (juzData) {
      const found = Object.values(juzData).find((j: any) => {
        const mapping = j.verse_mapping[firstV.chapter];
        if (!mapping) return false;
        const parts = mapping.split("-");
        const vIndex = firstV.verse;
        return parts.length === 2
          ? vIndex >= Number(parts[0]) && vIndex <= Number(parts[1])
          : vIndex === Number(parts[0]);
      });
      if (found) jNum = (found as any).juz_number;
    }

    const surahNameArabic = sInfo
      ? sInfo.name.startsWith("سورة")
        ? sInfo.name
        : `سورة ${sInfo.name}`
      : "";

    const juzTextArabic = jNum ? `الجزء ${toArabicNumerals(jNum)}` : "";

    return {
      sName: surahNameArabic,
      jNum: juzTextArabic,
      pageNumArabic: toArabicNumerals(pNum),
    };
  };

  const isQpcReady =
    fontMode === "qpc" &&
    !loadingQPC &&
    fontsLoaded &&
    Object.keys(qpcData).length > 0;

  const isEndOfSurahLine = (line: AlignedLine) => {
    return line.words.some((w) => {
      const sInfo = surahs.find((s) => s.number === w.surahNum);
      if (!sInfo) return false;
      const isLastVerse = w.verseNum === sInfo.totalVerses;
      if (!isLastVerse) return false;
      const verseQPC = qpcData[`${w.surahNum}-${w.verseNum}`];
      if (!verseQPC) return false;
      return w.word === verseQPC.words.length;
    });
  };

  const renderSurahHeader = (sNum: number, pageNum?: number) => {
    const s = surahs.find((x) => x.number === sNum);
    if (!s) return null;
    const surahStr = `surah${sNum.toString().padStart(3, "0")}`;
    const isFirstPages = pageNum !== undefined ? pageNum <= 2 : sNum <= 2;
    const headerWidth = isFirstPages ? "72%" : "88%";

    return (
      <div
        className={styles.appSurahHeader}
        key={`header-${sNum}`}
        style={{
          width: headerWidth,
          maxWidth: headerWidth,
          height: `${finalFontSize * displayLineHeight}px`,
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <span
          className={styles.appSurahHeaderIcon}
          style={{
            fontSize: `${finalFontSize * 1.3}px`,
          }}
        >
          {surahStr}
        </span>
      </div>
    );
  };

  const renderBasmalah = () => {
    const basmalahWords =
      QPC_BASMALAH_WORDS[mushafLayout] ?? QPC_BASMALAH_WORDS.v1;

    return (
      <div
        className={styles.basmalahLine}
        key="basmalah"
        style={{
          height: `${finalFontSize * displayLineHeight}px`,
          margin: 0,
        }}
      >
        {fontMode === "qpc" ? (
          <span className="qpc-page-1" style={{ fontSize: "1.36em", lineHeight: 1 }}>
            {basmalahWords.map((word, idx) => (
              <span key={idx} className="qpc-word">
                {word}
                {idx < basmalahWords.length - 1 && mushafLayout !== "v1" ? " " : "\u200B"}
              </span>
            ))}
          </span>
        ) : (
          <span
            style={{
              fontSize: "1.25em",
              lineHeight: 1,
              fontFamily: "'Uthmanic Hafs', var(--font-arabic)",
            }}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </span>
        )}
      </div>
    );
  };

  const renderQpcPageSkeleton = (pageNum: number, info: any) => {
    const isEven = pageNum % 2 === 0;
    return (
      <div
        key={pageNum}
        className={`${styles.realisticPageWrapper} ${isEven ? styles.evenPage : styles.oddPage}`}
        style={{
          "--page-width": `${actualPageWidth}px`,
          width: `${actualPageWidth}px`,
          maxWidth: "100%",
        } as React.CSSProperties}
      >
        <div className={styles.paperLayer3} />
        <div className={styles.paperLayer2} />
        <div className={styles.paperLayer1} />
        <div
          className={`${styles.mushafPage} ${pageNum <= 2 ? styles.mushafPageFirst : ""} ${mushafLayout === "v1" ? styles.v1Book : ""}`}
          style={{
            marginBottom: "0px",
          }}
        >
          <div className={styles.pageHeader}>
            <span className={styles.pageHeaderJuz}>{info.jNum}</span>
            <span className={styles.pageHeaderSurah}>{info.sName}</span>
          </div>
          <div className={styles.spineShadowOverlay} />
          <div
            className={`${styles.pageText} ${styles.pageSkeletonContainer}`}
            style={{
              fontSize: `${finalFontSize}px`,
              lineHeight: displayLineHeight,
            }}
          >
            {Array.from({ length: 15 }).map((_, idx) => (
              <div key={idx} className={styles.pageSkeletonLine} />
            ))}
          </div>
          <div className={styles.pageFooter}>
            <span>{info.pageNumArabic || pageNum}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {sortedActivePages.map((pageNum) => {
        const info = getPageInfo(pageNum);

        if (fontMode === "qpc" && !isQpcReady) {
          return renderQpcPageSkeleton(pageNum, info);
        }

        const alignedLines = alignPageWordsToLines(
          pageNum,
          pages[pageNum],
          qpcData,
          mushafLayout,
          pageMapping
        );

        const isEven = pageNum % 2 === 0;
        const rightStackRatio = pageNum / 604;
        const leftStackRatio = (604 - pageNum) / 604;
        const rightStackWidth = Math.max(2, Math.round(rightStackRatio * 14));
        const leftStackWidth = Math.max(2, Math.round(leftStackRatio * 14));

        return (
          <div
            key={pageNum}
            id={`mushaf-page-${pageNum}`}
            className={`${styles.realisticPageWrapper} ${isEven ? styles.evenPage : styles.oddPage}`}
            style={{
              "--page-width": `${actualPageWidth}px`,
              "--right-stack-width": `${rightStackWidth}px`,
              "--left-stack-width": `${leftStackWidth}px`,
              width: `${actualPageWidth}px`,
              maxWidth: "100%",
            } as React.CSSProperties}
          >
            <div className={styles.paperLayer3} />
            <div className={styles.paperLayer2} />
            <div className={styles.paperLayer1} />
            <div
              className={`${styles.mushafPage} ${pageNum <= 2 ? styles.mushafPageFirst : ""} ${mushafLayout === "v1" ? styles.v1Book : ""}`}
              onClick={handlePageContainerClick}
              style={{
                marginBottom: "0px",
              }}
            >
              <div className={styles.pageHeader}>
                <span className={styles.pageHeaderJuz}>{info.jNum}</span>
                <span className={styles.pageHeaderSurah}>{info.sName}</span>
              </div>
              <div className={styles.spineShadowOverlay} />
              <div
                className={`${styles.pageText} ${
                  fontMode === "qpc"
                    ? styles.qpcTextContainer
                    : styles.normalTextContainer
                }`}
                style={
                  {
                    fontSize: `${finalFontSize}px`,
                    lineHeight: displayLineHeight,
                  } as React.CSSProperties
                }
              >
                {fontMode === "qpc"
                  ? alignedLines.map((line, lIdx) => {
                        const isEndLine = isEndOfSurahLine(line);
                        const segments = line.words
                          ? groupLineWordsIntoSegments(line.words)
                          : [];

                        return (
                          <Fragment key={lIdx}>
                            {line.surahHeader &&
                              renderSurahHeader(line.surahHeader.surahNumber, pageNum)}
                            {line.hasBasmalah && renderBasmalah()}
                            {line.words && line.words.length > 0 && (
                              <div
                                className={`${styles.mushafLine} ${mushafLayout === "v4" ? styles.v4Line : ""} ${isEndLine ? styles.lastLineOfSurah : ""}`}
                              >
                                {segments.map((seg, sIdx) => {
                                  const verseId = seg.verseId;
                                  const isBlurred =
                                    isTestMode && !revealedVerses.has(verseId);
                                  const isPlaying =
                                    audioCurrentSurah === seg.words[0].surahNum &&
                                    audioCurrentVerse === seg.words[0].verseNum;
                                  const isPaused = isPlaying && !audioIsPlaying;
                                  const isSelected = selectedVerseId === verseId;
                                  const isFirstSegmentOfVerse = seg.words[0]?.word === 1;
                                  const shouldRenderPopup = !isTestMode && isSelected && isFirstSegmentOfVerse;

                                  return (
                                    <span
                                      key={`${verseId}-${sIdx}`}
                                      id={`verse-${verseId}`}
                                      data-verse-id={verseId}
                                      data-selected={isSelected ? "true" : "false"}
                                      className={`${styles.pageVerse} ${isBlurred ? styles.blurred : styles.revealed} ${isPlaying ? styles.playing : ""} ${isPaused ? styles.paused : ""} ${isSelected ? styles.verseHovered : ""}`}
                                      onMouseEnter={() => handleVerseMouseEnter(verseId)}
                                      onMouseLeave={() => handleVerseMouseLeave(verseId)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isTestMode) {
                                          toggleVerseReveal(verseId);
                                        } else {
                                          if (selectedVerseId === verseId) {
                                            setSelectedVerseId(null);
                                          } else {
                                            setSelectedVerseId(verseId);
                                          }
                                        }
                                      }}
                                    >
                                      <span className={`qpc-page-${pageNum}`}>
                                        {seg.words.map((w, wordIdx) => (
                                          <span
                                            key={`${w.id}-${wordIdx}`}
                                            className="qpc-word"
                                          >
                                            {w.text}
                                            {w.spaceAfter && mushafLayout === "v1" ? "\u200B" : ""}
                                          </span>
                                        ))}
                                      </span>
                                      {shouldRenderPopup && (
                                        <VersePopup
                                          verse={seg.verse}
                                          verseId={verseId}
                                          isBookmarked={bookmarkedVerses.has(
                                            verseId
                                          )}
                                          onCopy={copyVerse}
                                          onBookmark={handleBookmark}
                                          onShare={shareVerse}
                                          onTafsir={setActiveTafsirVerse}
                                          onMutashabihat={
                                            setActiveMutashabihatVerse
                                          }
                                          onPlay={(v) =>
                                            playVerseAudio(v.chapter, v.verse)
                                          }
                                        />
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </Fragment>
                        );
                      })
                    : pages[pageNum].map((verse: any) => {
                      const verseId = `${verse.chapter}-${verse.verse}`;
                      const isBlurred =
                        isTestMode && !revealedVerses.has(verseId);
                      const isPlaying =
                        audioCurrentSurah === verse.chapter &&
                        audioCurrentVerse === verse.verse;
                      const isPaused = isPlaying && !audioIsPlaying;
                      const isSurahStart = verse.verse === 1;

                      return (
                        <Fragment key={verseId}>
                          {isSurahStart && renderSurahHeader(verse.chapter)}
                          {isSurahStart && verse.chapter !== 9 && verse.chapter !== 1 && renderBasmalah()}
                          <span
                            id={`verse-${verseId}`}
                            className={`${styles.pageVerse} ${isBlurred ? styles.blurred : styles.revealed} ${isPlaying ? styles.playing : ""} ${isPaused ? styles.paused : ""}`}
                            onClick={() => isTestMode && toggleVerseReveal(verseId)}
                          >
                          <span
                            className="arabic-text"
                            style={{
                              fontSize: `${finalFontSize}px`,
                              lineHeight: "inherit",
                              fontFamily: "'Uthmanic Hafs', var(--font-arabic)",
                            }}
                          >
                            {verse.text}
                            <span className={styles.hafsVerseMarker}>
                              {verse.verse}
                            </span>
                          </span>
                          {!isTestMode && (
                            <VersePopup
                              verse={verse}
                              verseId={verseId}
                              isBookmarked={bookmarkedVerses.has(verseId)}
                              onCopy={copyVerse}
                              onBookmark={handleBookmark}
                              onShare={shareVerse}
                              onTafsir={setActiveTafsirVerse}
                              onMutashabihat={setActiveMutashabihatVerse}
                              onPlay={(v) => playVerseAudio(v.chapter, v.verse)}
                            />
                          )}
                        </span>
                      </Fragment>
                    );
                  })}
              </div>
              <div className={styles.pageFooter}>
                <span>{info.pageNumArabic || pageNum}</span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
