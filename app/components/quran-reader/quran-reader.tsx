"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { surahs } from "@/data/surah-data";
import { QuranVerse } from "@/data/quran-verses";
import { ViewMode } from "./quran-reader.types";
import { AnimatePresence } from "framer-motion";
import styles from "./quran-reader.module.css";
import Toast from "../ui/toast";
import { fetchSurahQPCData } from "@/app/actions/get-qpc-data";
import {
  fetchQuranMetadata,
  fetchPageMapping,
} from "@/app/actions/get-metadata";
import { getPersistentCache, setPersistentCache } from "@/app/lib/quran-cache";
import QPCFontLoader from "./qpc-font-loader";
import { QPCVerseData } from "@/types/qpc";
import dynamic from "next/dynamic";

// Dynamic imports for heavy dialogs/sheets
const TafsirSheet = dynamic(() => import("../tafsir/tafsir-sheet"), {
  ssr: false,
});
const MutashabihatView = dynamic(() => import("./mutashabihat-view"), {
  ssr: false,
});
const ShareModal = dynamic(() => import("../share/share-modal"), {
  ssr: false,
});
import { useAudio } from "@/app/context/audio-context";
import { useUserData } from "@/app/context/user-data-context";
import {
  ORDINAL_WORDS,
  QuranReaderProps,
  RUB_POSITIONS,
} from "./quran-reader.types";

// Sub-components
import {
  TransitionNotification,
  QuranPageLoader,
} from "./quran-reader-ui";
import PageView from "./page-view";
import VerseView from "./verse-view";

// Types & constants

// Client-side cache for fetched QPC data and verses to make loading instantaneous
const qpcCache: Record<string, QPCVerseData[]> = {};
const versesCache: Record<number, QuranVerse[]> = {};
const translationsCache: Record<number, Record<string, string>> = {};
const transliterationsCache: Record<number, Record<string, string>> = {};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuranReader({
  surahNumber,
  viewMode = "verse",
  bookmarkedVerses,
  onToggleBookmark,
  onNextSurah,
  fontSize = 64,
  onPageChange,
  onPageSurahsChange,
}: QuranReaderProps) {
  const { playVerse: playVerseAudio, state: audioState } = useAudio();

  // ── Data ──────────────────────────────────────────
  const surah = surahs.find((s) => s.number === surahNumber);
  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [transliterations, setTransliterations] = useState<Record<string, string>>({});
  const [allActiveVerses, setAllActiveVerses] = useState<any[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(true);
  const [layoutLoaded, setLayoutLoaded] = useState(false);

  // Load layout data dynamically on mount
  useEffect(() => {
    import("./qpc-layout").then(({ ensureLayoutDataLoaded }) => {
      ensureLayoutDataLoaded().then(() => setLayoutLoaded(true));
    });
  }, []);

  // Load verses asynchronously using Server Action
  useEffect(() => {
    let active = true;
    const loadVerses = async () => {
      setLoadingVerses(true);
      const { fetchSurahVerses } = await import("@/app/actions/get-verses");
      const data = await fetchSurahVerses(surahNumber);
      if (active) {
        setVerses(data.verses);
        setTranslations(data.translations);
        setTransliterations(data.transliterations);
        setLoadingVerses(false);
      }
    };
    loadVerses();
    return () => {
      active = false;
    };
  }, [surahNumber]);

  // ── User settings ────────────────────────────────
  const { settings, updateSettings } = useUserData();
  const fontMode = settings.fontMode;
  const isTestMode = settings.isTestMode;

  // ── Font size helpers ─────────────────────────────
  const baseFontSize =
    settings.fontMode === "qpc" && settings.mushafLayout === "v4"
      ? fontSize * 0.80 // Scaled down slightly to fit the new compact 530px container width
      : fontSize * 0.92; // Scaled down slightly for V1 as well to make it compact
  const displayFontSize =
    viewMode === "page"
      ? baseFontSize * 0.74 // Make page mode font size bigger (0.74 instead of 0.58)
      : baseFontSize;
  const displayLineHeight = viewMode === "page" ? 1.62 : 2.0;

  // ── UI State ──────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null);
  const [activeTafsirVerse, setActiveTafsirVerse] = useState<string | null>(
    null
  );
  const [activeMutashabihatVerse, setActiveMutashabihatVerse] = useState<
    string | null
  >(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareVerseData, setShareVerseData] = useState<{
    arabic: string;
    english: string;
    verseNumber: number;
    surahName?: string;
  } | null>(null);

  const [revealedVerses, setRevealedVerses] = useState<Set<string>>(new Set());

  // ── QPC / Font state ─────────────────────────────
  const [qpcData, setQpcData] = useState<Record<string, QPCVerseData>>({});
  const [loadingQPC, setLoadingQPC] = useState(false);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    setLoadedPages(new Set());
    setFontsLoaded(false);
    setQpcData({});
  }, [settings.mushafLayout]);

  // ── Metadata for transition notifications ─────────
  const [juzData, setJuzData] = useState<any>(null);
  const [hizbData, setHizbData] = useState<any>(null);
  const [rubData, setRubData] = useState<any>(null);
  const [outstandingNotification, setOutstandingNotification] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [lastKeys, setLastKeys] = useState({ juz: "", hizb: "", rub: "" });
  const [pageMapping, setPageMapping] = useState<Record<string, number>>({});

  useEffect(() => {
    // 1. Instant load from persistent cache (<5ms)
    getPersistentCache<any>("quran_all_metadata").then((cached) => {
      if (cached) {
        setJuzData(cached.juz);
        setHizbData(cached.hizb);
        setRubData(cached.rub);
        setPageMapping(cached.mapping);
      }
    });

    // 2. Fetch fresh data and update persistent cache
    import("@/app/actions/get-all-metadata").then(
      ({ fetchAllQuranSettings }) => {
        fetchAllQuranSettings().then((data) => {
          setJuzData(data.juz);
          setHizbData(data.hizb);
          setRubData(data.rub);
          setPageMapping(data.mapping);
          setPersistentCache("quran_all_metadata", data);
        });
      }
    );
  }, []);

  // Transition detection
  useEffect(() => {
    if (
      !audioState.currentVerse ||
      !audioState.currentSurah ||
      !juzData ||
      !hizbData ||
      !rubData
    )
      return;

    const currentKey = `${audioState.currentSurah}:${audioState.currentVerse}`;
    let newNotif: { title: string; message: string } | null = null;
    const nextLastKeys = { ...lastKeys };
    let triggered = false;

    // 1. Juz
    for (const j of Object.values(juzData) as any[]) {
      // Check for start of Juz 1
      if (
        j.juz_number === 1 &&
        j.first_verse_key === currentKey &&
        lastKeys.juz !== "juz-1-start"
      ) {
        triggered = true;
        nextLastKeys.juz = "juz-1-start";
        newNotif = { title: "Al-Juz", message: "Juz 1 starts here" };
        break;
      }
      // Check for completion of any Juz
      if (
        j.last_verse_key === currentKey &&
        lastKeys.juz !== `juz-${j.juz_number}-finished`
      ) {
        triggered = true;
        nextLastKeys.juz = `juz-${j.juz_number}-finished`;
        newNotif = {
          title: "Al-Juz",
          message: `You just finished the ${ORDINAL_WORDS[j.juz_number]} Juz`,
        };
        break;
      }
    }

    // 2. Hizb (only if no Juz notification)
    if (!newNotif) {
      for (const h of Object.values(hizbData) as any[]) {
        // Check for start of Hizb 1
        if (
          h.hizb_number === 1 &&
          h.first_verse_key === currentKey &&
          lastKeys.hizb !== "hizb-1-start"
        ) {
          triggered = true;
          nextLastKeys.hizb = "hizb-1-start";
          newNotif = { title: "Al-Hizb", message: "Hizb 1 starts here" };
          break;
        }
        // Check for completion of any Hizb
        if (
          h.last_verse_key === currentKey &&
          lastKeys.hizb !== `hizb-${h.hizb_number}-finished`
        ) {
          triggered = true;
          nextLastKeys.hizb = `hizb-${h.hizb_number}-finished`;
          newNotif = {
            title: "Al-Hizb",
            message: `You just finished the ${ORDINAL_WORDS[h.hizb_number]} Hizb`,
          };
          break;
        }
      }
    }

    // 3. Rub (only if no notification yet)
    if (!newNotif) {
      for (const r of Object.values(rubData) as any[]) {
        // Check for start of Rub 1
        if (
          r.rub_number === 1 &&
          r.first_verse_key === currentKey &&
          lastKeys.rub !== "rub-1-start"
        ) {
          triggered = true;
          nextLastKeys.rub = "rub-1-start";
          newNotif = { title: "Rub el Hizb", message: "A new quarter started" };
          break;
        }
        // Check for completion of any Rub
        if (
          r.last_verse_key === currentKey &&
          lastKeys.rub !== `rub-${r.rub_number}-finished`
        ) {
          triggered = true;
          nextLastKeys.rub = `rub-${r.rub_number}-finished`;
          const juz = Math.ceil(r.rub_number / 8);
          const rubInJuz = ((r.rub_number - 1) % 8) + 1;
          newNotif = {
            title: "Rub el Hizb",
            message: `You just finished ${RUB_POSITIONS[rubInJuz - 1].toLowerCase()} rub from the ${ORDINAL_WORDS[juz].toLowerCase()} juz`,
          };
          break;
        }
      }
    }

    if (triggered) {
      if (newNotif) setOutstandingNotification(newNotif);
      setLastKeys(nextLastKeys);
    }
  }, [
    audioState.currentVerse,
    audioState.currentSurah,
    juzData,
    hizbData,
    rubData,
    lastKeys,
  ]);

  // Auto-close notification after 5 s
  useEffect(() => {
    if (outstandingNotification) {
      const t = setTimeout(() => setOutstandingNotification(null), 5000);
      return () => clearTimeout(t);
    }
  }, [outstandingNotification]);

  // Notify parent of current page and surahs on it
  useEffect(() => {
    if (visiblePages.size > 0) {
      const minPage = Math.min(...Array.from(visiblePages));
      if (onPageChange) onPageChange(minPage);

      if (onPageSurahsChange && Object.keys(pageMapping).length > 0) {
        const surahsOnPage: number[] = [];
        // Find all surahs that have at least one verse on the minPage
        const seen = new Set<number>();
        Object.entries(pageMapping).forEach(([key, page]) => {
          if (page === minPage) {
            const sNum = parseInt(key.split(":")[0]);
            if (!seen.has(sNum)) {
              seen.add(sNum);
              surahsOnPage.push(sNum);
            }
          }
        });

        // Also check if Verse 1 of any surah is on this page
        const startsSurahOnPage = surahsOnPage.filter((s) => {
          return pageMapping[`${s}:1`] === minPage;
        });

        onPageSurahsChange({
          page: minPage,
          surahs: surahsOnPage,
          startsSurahOnPage,
        });
      }
    }
  }, [visiblePages, onPageChange, onPageSurahsChange, pageMapping]);

  // Load QPC data and verses for all surahs present on the pages containing the current surah
  useEffect(() => {
    if (Object.keys(pageMapping).length === 0) return;

    const loadQPCAndVerses = async () => {
      // 1. Find all pages that contain verses from the current surah
      const surahPages = new Set<number>();
      Object.entries(pageMapping).forEach(([key, page]) => {
        const [s] = key.split(":");
        if (parseInt(s) === surahNumber) surahPages.add(page);
      });

      // 2. Find all surahs that have verses on those pages
      const surahsOnThesePages = new Set<number>();
      Object.entries(pageMapping).forEach(([key, page]) => {
        if (surahPages.has(page)) {
          const [s] = key.split(":");
          surahsOnThesePages.add(parseInt(s));
        }
      });

      const surahsToLoad = Array.from(surahsOnThesePages).filter(
        (n) => n >= 1 && n <= 114
      );

      const layout = settings.mushafLayout;

      // 1. Check in-memory cache and IndexedDB cache for all required surahs
      await Promise.all(
        surahsToLoad.map(async (n) => {
          const cacheKey = `${layout}-${n}`;
          if (!qpcCache[cacheKey]) {
            const cachedQPC = await getPersistentCache<QPCVerseData[]>(`qpc_v10_${cacheKey}`);
            if (cachedQPC) qpcCache[cacheKey] = cachedQPC;
          }
          if (!versesCache[n]) {
            const cachedPayload = await getPersistentCache<{
              verses: QuranVerse[];
              translations: Record<string, string>;
              transliterations: Record<string, string>;
            }>(`verses_${n}`);
            if (cachedPayload) {
              versesCache[n] = cachedPayload.verses;
              translationsCache[n] = cachedPayload.translations;
              transliterationsCache[n] = cachedPayload.transliterations;
            }
          }
        })
      );

      // Check if all surahs to load are now available
      const allCached = surahsToLoad.every(
        (n) => qpcCache[`${layout}-${n}`] && versesCache[n]
      );

      let qpcResults: QPCVerseData[][];
      let versesResults: { verses: QuranVerse[]; translations: Record<string, string>; transliterations: Record<string, string> }[];

      if (allCached) {
        // Instant load from memory / IndexedDB cache (< 5ms) - ZERO delay!
        qpcResults = surahsToLoad.map((n) => qpcCache[`${layout}-${n}`]);
        versesResults = surahsToLoad.map((n) => ({
          verses: versesCache[n],
          translations: translationsCache[n] || {},
          transliterations: transliterationsCache[n] || {},
        }));
      } else {
        setLoadingQPC(true);

        const { fetchSurahVerses } = await import("@/app/actions/get-verses");

        // Fetch each surah, checking cache first to avoid duplicate network calls
        const qpcPromises = surahsToLoad.map(async (n) => {
          const cacheKey = `${layout}-${n}`;
          if (qpcCache[cacheKey]) return qpcCache[cacheKey];
          const data = await fetchSurahQPCData(n, layout);
          qpcCache[cacheKey] = data;
          setPersistentCache(`qpc_v10_${cacheKey}`, data);
          return data;
        });

        const versesPromises = surahsToLoad.map(async (n) => {
          if (versesCache[n]) {
            return {
              verses: versesCache[n],
              translations: translationsCache[n] || {},
              transliterations: transliterationsCache[n] || {},
            };
          }
          const payload = await fetchSurahVerses(n);
          versesCache[n] = payload.verses;
          translationsCache[n] = payload.translations;
          transliterationsCache[n] = payload.transliterations;
          setPersistentCache(`verses_${n}`, payload);
          return payload;
        });

        [qpcResults, versesResults] = await Promise.all([
          Promise.all(qpcPromises),
          Promise.all(versesPromises),
        ]);
      }

      const map: Record<string, QPCVerseData> = {};
      qpcResults.forEach((surahData) => {
        if (Array.isArray(surahData)) {
          surahData.forEach((d) => {
            if (d && d.id) {
              const parts = d.id.includes(":") ? d.id.split(":") : d.id.split("-");
              const s = parts[0];
              const v = parts[1];
              map[`${s}-${v}`] = d;
            }
          });
        }
      });
      setQpcData(map);
      setLoadingQPC(false);

      // Background prefetch adjacent surahs in idle time
      if (typeof window !== "undefined") {
        const prefetchAdjacent = async () => {
          const neighbors = [surahNumber + 1, surahNumber - 1].filter(
            (n) => n >= 1 && n <= 114
          );
          const { fetchSurahVerses } = await import("@/app/actions/get-verses");
          for (const n of neighbors) {
            const cacheKey = `${layout}-${n}`;
            if (!qpcCache[cacheKey]) {
              const cached = await getPersistentCache<QPCVerseData[]>(`qpc_v10_${cacheKey}`);
              if (!cached) {
                fetchSurahQPCData(n, layout).then((data) => {
                  qpcCache[cacheKey] = data;
                  setPersistentCache(`qpc_v10_${cacheKey}`, data);
                });
              } else {
                qpcCache[cacheKey] = cached;
              }
            }
            if (!versesCache[n]) {
              const cached = await getPersistentCache<any>(`verses_${n}`);
              if (!cached) {
                fetchSurahVerses(n).then((payload) => {
                  versesCache[n] = payload.verses;
                  translationsCache[n] = payload.translations;
                  transliterationsCache[n] = payload.transliterations;
                  setPersistentCache(`verses_${n}`, payload);
                });
              } else {
                versesCache[n] = cached.verses;
                translationsCache[n] = cached.translations;
                transliterationsCache[n] = cached.transliterations;
              }
            }
          }
        };

        if ("requestIdleCallback" in window) {
          (window as any).requestIdleCallback(() => prefetchAdjacent());
        } else {
          setTimeout(prefetchAdjacent, 1000);
        }
      }

      const combinedVerses = versesResults.flatMap((payload, idx) => {
        const sNum = surahsToLoad[idx];
        return payload.verses.map((v) => ({
          ...v,
          chapter: sNum,
          verseKey: `${sNum}-${v.verse}`,
        }));
      });
      setAllActiveVerses(combinedVerses);

      const initialData = qpcResults.find(
        (_, idx) => surahsToLoad[idx] === surahNumber
      );
      if (initialData && initialData.length > 0) {
        const firstPage = initialData[0]?.page;
        if (firstPage) setVisiblePages(new Set([firstPage]));
      }

      // Background prefetching of adjacent surahs (+1 and -1)
      const adjacentSurahs = [surahNumber - 1, surahNumber + 1].filter(
        (n) => n >= 1 && n <= 114 && (!qpcCache[`${layout}-${n}`] || !versesCache[n])
      );

      if (adjacentSurahs.length > 0) {
        const { fetchSurahVerses } = await import("@/app/actions/get-verses");
        adjacentSurahs.forEach(async (n) => {
          try {
            const cacheKey = `${layout}-${n}`;
            if (!qpcCache[cacheKey]) {
              fetchSurahQPCData(n, layout).then((data) => {
                qpcCache[cacheKey] = data;
              });
            }
            if (!versesCache[n]) {
              fetchSurahVerses(n).then((payload) => {
                versesCache[n] = payload.verses;
                translationsCache[n] = payload.translations;
                transliterationsCache[n] = payload.transliterations;
              });
            }
          } catch (e) {
            console.error("Failed to prefetch adjacent surah:", n, e);
          }
        });
      }
    };

    loadQPCAndVerses();
  }, [surahNumber, viewMode, pageMapping, settings.mushafLayout]);

  // IntersectionObserver – track visible pages
  useEffect(() => {
    if (fontMode !== "qpc" || Object.keys(qpcData).length === 0) return;
    const cb = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const verseId = entry.target.id.replace("verse-", "");
          const page = qpcData[verseId]?.page;
          if (page) {
            setVisiblePages((prev) => {
              if (prev.has(page)) return prev;
              return new Set([...prev, page]);
            });
          }
        }
      });
    };
    const observer = new IntersectionObserver(cb, {
      rootMargin: "200px 0px",
      threshold: 0.1,
    });
    document
      .querySelectorAll('[id^="verse-"]')
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [fontMode, qpcData]);

  // Load all pages for the current surah so there is no FOUT
  useEffect(() => {
    if (fontMode !== "qpc") {
      setFontsLoaded(true);
      return;
    }

    // Don't try to load fonts until we actually have QPC data for this surah
    if (Object.keys(qpcData).length === 0) {
      // If QPC data hasn't arrived yet, stay in loading state
      // (fontsLoaded will be set once data arrives and fonts are checked)
      return;
    }

    const surahPages = new Set<number>();
    surahPages.add(1); // ALWAYS load page 1 for Basmalah typography
    Object.values(qpcData).forEach((v) => {
      const [sNum] = v.id.split(":");
      if (v.page && parseInt(sNum) === surahNumber) {
        surahPages.add(v.page);
        if (v.page % 2 === 1) {
          surahPages.add(v.page + 1);
        } else {
          surahPages.add(Math.max(1, v.page - 1));
        }
      }
    });

    const targetPages = Array.from(surahPages).sort((a, b) => a - b);
    if (targetPages.length === 0) {
      setFontsLoaded(true);
      return;
    }

    let cancelled = false;

    const checkFonts = async () => {
      // Prioritize the visible pages for this view mode (first 2-3 pages + page 1)
      const initialPages = targetPages.slice(0, 4);
      const initialToLoad = initialPages.filter((p) => !loadedPages.has(p));

      if (initialToLoad.length === 0) {
        setFontsLoaded(true);
      } else {
        const initialPromises = initialToLoad.map((page) =>
          document.fonts.load(`16px "QPC_Page_${page}"`)
        );

        // Fast safety timeout of 400ms so skeleton never hangs
        const timeout = new Promise<void>((resolve) => setTimeout(resolve, 400));

        try {
          await Promise.race([Promise.all(initialPromises), timeout]);
        } catch {
          // Ignore font errors
        }

        if (!cancelled) {
          setLoadedPages((prev) => new Set([...prev, ...initialToLoad]));
          setFontsLoaded(true);
        }
      }

      // Stream the remaining pages asynchronously in the background
      const remainingToLoad = targetPages.slice(4).filter((p) => !loadedPages.has(p));
      if (remainingToLoad.length > 0 && !cancelled) {
        const loadRest = () => {
          remainingToLoad.forEach((page) => {
            document.fonts.load(`16px "QPC_Page_${page}"`).then(() => {
              if (!cancelled) {
                setLoadedPages((prev) => new Set([...prev, page]));
              }
            });
          });
        };

        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(loadRest);
        } else {
          setTimeout(loadRest, 200);
        }
      }
    };
    checkFonts();

    return () => {
      cancelled = true;
    };
  }, [fontMode, qpcData, loadingQPC, loadedPages, surahNumber]);

  // ── Scroll to top on Surah change ────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [surahNumber]);

  // ── Audio-driven Surah transition ────────────────────────────────────────────
  // Track previous audio Surah so we can detect cross-Surah transitions
  const prevAudioSurahRef = useRef<number | null>(null);

  useEffect(() => {
    const audioSurah = audioState.currentSurah;
    if (!audioSurah) return;

    // If audio moved into a DIFFERENT Surah than the one currently displayed,
    // notify the user and give them an option to switch
    if (audioSurah !== surahNumber && prevAudioSurahRef.current !== audioSurah) {
      prevAudioSurahRef.current = audioSurah;
      const targetSurahInfo = surahs.find((s) => s.number === audioSurah);
      const targetName = targetSurahInfo
        ? `Surat ${targetSurahInfo.transliteration}`
        : `Surah #${audioSurah}`;

      setOutstandingNotification({
        title: "Now Playing",
        message: `Audio moved to ${targetName}. Click to open.`,
      });
    } else if (audioSurah === surahNumber) {
      prevAudioSurahRef.current = audioSurah;
    }
  }, [audioState.currentSurah, surahNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll active verse into view ────────────────────────────────────────────
  useEffect(() => {
    if (audioState.currentVerse && audioState.currentSurah) {
      const el = document.getElementById(
        `verse-${audioState.currentSurah}-${audioState.currentVerse}`
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [audioState.currentSurah, audioState.currentVerse]);

  // ── Derived ───────────────────────────────────────

  const qpcPagesForLoader = useMemo(() => {
    const p = new Set<number>();
    p.add(1); // ALWAYS load page 1 for Basmalah typography
    Object.values(qpcData).forEach((v) => {
      if (v.page) p.add(v.page);
    });

    // Prefetch adjacent surahs' font pages from pageMapping
    const adjacentSurahs = [surahNumber - 1, surahNumber + 1];
    adjacentSurahs.forEach((surahNum) => {
      if (surahNum >= 1 && surahNum <= 114) {
        Object.entries(pageMapping).forEach(([key, page]) => {
          const [s] = key.split(":");
          if (parseInt(s) === surahNum) {
            p.add(page);
          }
        });
      }
    });

    return Array.from(p).sort();
  }, [qpcData, surahNumber, pageMapping]);

  const isLoadingPages =
    fontMode === "qpc" &&
    (loadingQPC || !layoutLoaded);

  // ── Handlers ──────────────────────────────────────

  const toggleTestMode = () => {
    const newMode = !isTestMode;
    updateSettings({ isTestMode: newMode });
    setRevealedVerses(new Set());
    setToast(newMode ? "Test Mode Enabled" : "Test Mode Disabled");
  };

  const toggleVerseReveal = (verseId: string) => {
    setRevealedVerses((prev) => {
      const next = new Set(prev);
      next.has(verseId) ? next.delete(verseId) : next.add(verseId);
      return next;
    });
  };

  const handleBookmark = (verseId: string) => {
    const isBookmarked = bookmarkedVerses.has(verseId);
    onToggleBookmark(verseId);
    setToast(isBookmarked ? "Bookmark removed" : "Verse bookmarked");
  };

  const copyVerse = async (verse: any) => {
    const text = `${verse.text}\n\n— Quran ${surahNumber}:${verse.verse}`;
    try {
      await navigator.clipboard.writeText(text);
      setToast("Verse copied to clipboard");
    } catch {
      setToast("Failed to copy");
    }
  };

  const shareVerse = (verse: any) => {
    const englishText = translations[`${surahNumber}:${verse.verse}`] || "";
    setShareVerseData({
      arabic: verse.text,
      english: englishText,
      verseNumber: verse.verse,
    });
    setShareModalOpen(true);
  };

  // Shared props for view sub-components
  const sharedViewProps = {
    surahNumber,
    qpcData,
    loadingQPC,
    fontsLoaded,
    isTestMode,
    revealedVerses,
    bookmarkedVerses,
    fontMode,
    mushafLayout: settings.mushafLayout,
    displayFontSize,
    displayLineHeight,
    juzData,
    pageMapping,
    translations,
    transliterations,
    audioCurrentSurah: audioState.currentSurah,
    audioCurrentVerse: audioState.currentVerse,
    audioIsPlaying: audioState.isPlaying,
    toggleVerseReveal,
    copyVerse,
    handleBookmark,
    shareVerse,
    setActiveTafsirVerse,
    setActiveMutashabihatVerse,
    playVerseAudio,
  };

  // ── Guard renders ─────────────────────────────────

  if (!surah) {
    return (
      <div className={styles.error}>
        <h2>Surah not found</h2>
        <p>Surah #{surahNumber} could not be loaded.</p>
      </div>
    );
  }

  if (loadingVerses && viewMode === "verse") {
    return (
      <div className={styles.reader}>
        <QuranPageLoader viewMode={viewMode} />
      </div>
    );
  }

  if (!loadingVerses && verses.length === 0) {
    return (
      <div className={styles.error}>
        <h2>No verses found</h2>
        <p>Surah {surah.name} has no verses loaded.</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────

  return (
    <div className={styles.reader}>
      {/* Skeleton loader for Verse view mode only - Page mode renders in-place with real dimensions */}
      <AnimatePresence>
        {isLoadingPages && viewMode === "verse" && (
          <QuranPageLoader viewMode={viewMode} />
        )}
      </AnimatePresence>

      {/* Transition Notification */}
      <AnimatePresence>
        {outstandingNotification && (
          <TransitionNotification
            title={outstandingNotification.title}
            message={outstandingNotification.message}
            onClose={() => setOutstandingNotification(null)}
          />
        )}
      </AnimatePresence>

      <QPCFontLoader
        pages={qpcPagesForLoader}
        mushafLayout={settings.mushafLayout}
      />

      {/* Share Modal */}
      {shareVerseData && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          title={`Share Surah ${surah.name} : ${shareVerseData.verseNumber}`}
          sourceTitle={`Surah ${surah.transliteration}`}
          arabicText={shareVerseData.arabic}
          englishText={shareVerseData.english}
          meta={{
            title: `Surah ${surah.transliteration} (${surahNumber}:${shareVerseData.verseNumber})`,
            subtitle: "QuranMaster",
          }}
        />
      )}

      {/* Verses */}
      <div className={styles.verses}>
        {verses.length > 0 || viewMode === "page" || loadingVerses ? (
          <>
            {/* Page View */}
            {viewMode === "page" && (
              <div className={styles.pageView}>
                <PageView {...sharedViewProps} allVerses={allActiveVerses} verses={verses} />
              </div>
            )}

            {/* List/Verse View */}
            {viewMode === "verse" && (
              <VerseView {...sharedViewProps} verses={verses} />
            )}


          </>
        ) : (
          <div className={styles.noVerses}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.2"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <h3>No Verses Found</h3>
            <p>This Surah doesn&apos;t have any verses in the database.</p>
          </div>
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
      <TafsirSheet
        verseKey={activeTafsirVerse}
        onClose={() => setActiveTafsirVerse(null)}
      />
      {activeMutashabihatVerse && (
        <MutashabihatView
          verseKey={activeMutashabihatVerse}
          onClose={() => setActiveMutashabihatVerse(null)}
          verseWords={qpcData[activeMutashabihatVerse]?.words}
          versePage={qpcData[activeMutashabihatVerse]?.page}
        />
      )}
    </div>
  );
}
