import { QuranVerse } from "@/data/quran-verses";

export interface FastSurahPayload {
  verses: QuranVerse[];
  translations: Record<string, string>;
  transliterations: Record<string, string>;
}

let quranDataCache: Record<string, any[]> | null = null;
let translationDataCache: Record<string, any> | null = null;
let transliterationDataCache: Record<string, string> | null = null;

let loadingPromise: Promise<void> | null = null;

/**
 * Pre-warms the static Quran dataset in memory for sub-millisecond (0ms) page loads.
 */
export function preloadQuranData(): Promise<void> {
  if (quranDataCache) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = Promise.all([
    import("@/data/quran.json").then((m) => m.default),
    import("@/data/translation/en-maarif-ul-quran-simple.json").then((m) => m.default),
    import("@/data/translitration/syllables-transliteration.json").then((m) => m.default),
  ])
    .then(([quranModule, transModule, translitModule]) => {
      quranDataCache = quranModule as Record<string, any[]>;
      translationDataCache = transModule as Record<string, any>;
      transliterationDataCache = translitModule as Record<string, string>;
    })
    .catch((err) => {
      console.warn("Fast loader fallback error:", err);
    });

  return loadingPromise;
}

/**
 * Retrieves Surah verses, translations, and transliterations in 0ms directly from client memory.
 */
export async function getFastSurahVerses(surahNumber: number): Promise<FastSurahPayload> {
  await preloadQuranData();

  const rawVerses = quranDataCache ? quranDataCache[surahNumber.toString()] || [] : [];
  const verses: QuranVerse[] = rawVerses.map((v) => ({
    id: v.verse,
    verse: v.verse,
    chapter: v.chapter,
    verseKey: `${v.chapter}:${v.verse}`,
    text: v.text,
  }));

  const translations: Record<string, string> = {};
  const transliterations: Record<string, string> = {};

  verses.forEach((v) => {
    const k = `${v.chapter}:${v.verse}`;
    if (translationDataCache && translationDataCache[k]) {
      const item = translationDataCache[k];
      translations[k] = typeof item === "string" ? item : item?.t || "";
    }
    if (transliterationDataCache && transliterationDataCache[k]) {
      transliterations[k] = transliterationDataCache[k];
    }
  });

  return { verses, translations, transliterations };
}
