import fs from 'fs';
import path from 'path';
import { QPCVerseData } from '@/types/qpc';

export type { QPCVerseData };

interface QPCItem {
  id: number;
  surah: number;
  ayah: number;
  word: string;
  text: string;
  page?: number;
  line?: number;
  layoutText?: string;
}

let qpcData: Record<string, QPCItem> | null = null;
let qpcV4Data: Record<string, QPCItem> | null = null;
let pageMapping: Record<string, number> | null = null;
let qpcV1BySurah: Record<number, QPCVerseData[]> | null = null;
let qpcV4BySurah: Record<number, QPCVerseData[]> | null = null;

const DATA_DIR = path.join(process.cwd(), 'data/qpc_data');

function getLayoutLines(layout: string = 'v1'): Record<string, string[]> {
  const fileName = layout === 'v4' ? 'mushaf-layout-v4.json' : 'mushaf-layout-v1.json';
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`Failed to load ${fileName}:`, e);
    return {};
  }
}

function getQPCData(layout: string = 'v1'): Record<string, QPCItem> {
  if (layout === 'v4') {
    if (!qpcV4Data) {
      const filePath = path.join(DATA_DIR, '../qpc-v4_tajweed/qpc-v4.json');
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        qpcV4Data = JSON.parse(fileContent);
      } catch (e) {
        console.error('Failed to load V4 QPC data:', e);
        return {};
      }
    }
    return qpcV4Data || {};
  }

  if (!qpcData) {
    const filePath = path.join(DATA_DIR, 'qpc-v1-glyph-codes-wbw.json', 'qpc-v1-glyph-codes-wbw.json');
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      qpcData = JSON.parse(fileContent) as Record<string, QPCItem>;
    } catch (e) {
      console.error('Failed to load QPC data:', e);
      return {};
    }
  }
  return qpcData || {};
}

function getPageMapping() {
  if (!pageMapping) {
    const filePath = path.join(DATA_DIR, 'quran-page-mapping.json');
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      pageMapping = JSON.parse(fileContent);
    } catch (e) {
      console.error('Failed to load page mapping:', e);
      return {};
    }
  }
  return pageMapping;
}

export function getPageForVerse(surah: number, verse: number): number {
  const mapping = getPageMapping();
  return mapping?.[`${surah}:${verse}`] || 0;
}

function buildSurahCache(
  allData: Record<string, QPCItem>,
  layoutName: string = 'v1',
  mapping: Record<string, number> | null
): Record<number, QPCVerseData[]> {
  const layoutLinesMap = getLayoutLines(layoutName);

  // 1. Sort all word items sequentially by their canonical Quran word ID (1..77430)
  const sortedItems = Object.values(allData).sort((a, b) => Number(a.id) - Number(b.id));

  // 2. Walk page 1 to 604 through the layout definition per-page using mapping to prevent line drift
  if (mapping && Object.keys(mapping).length > 0) {
    const verseItemsMap: Record<string, QPCItem[]> = {};
    sortedItems.forEach((item) => {
      const vk = `${item.surah}:${item.ayah}`;
      if (!verseItemsMap[vk]) verseItemsMap[vk] = [];
      verseItemsMap[vk].push(item);
    });

    const itemsByPage: Record<number, QPCItem[]> = {};
    for (let p = 1; p <= 604; p++) itemsByPage[p] = [];

    Object.entries(mapping).forEach(([vk, p]) => {
      if (verseItemsMap[vk]) {
        itemsByPage[p].push(...verseItemsMap[vk]);
      }
    });

    for (let p = 1; p <= 604; p++) {
      const pageWords = itemsByPage[p];
      const lines = layoutLinesMap[String(p)] || [];
      let wordPtr = 0;
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const tokens = lines[lineIdx].trim().split(/\s+/).filter(Boolean);
        for (const token of tokens) {
          if (wordPtr < pageWords.length) {
            pageWords[wordPtr].page = p;
            pageWords[wordPtr].line = lineIdx;
            pageWords[wordPtr].layoutText = token;
            wordPtr++;
          }
        }
      }
    }
  } else {
    let itemPtr = 0;
    for (let p = 1; p <= 604; p++) {
      const lines = layoutLinesMap[String(p)] || [];
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const tokens = lines[lineIdx].trim().split(/\s+/).filter(Boolean);
        for (const token of tokens) {
          if (itemPtr < sortedItems.length) {
            sortedItems[itemPtr].page = p;
            sortedItems[itemPtr].line = lineIdx;
            sortedItems[itemPtr].layoutText = token;
            itemPtr++;
          }
        }
      }
    }
  }

  // 3. Group words into Surah and Verse records
  const cache: Record<number, Record<string, QPCVerseData>> = {};

  for (const item of sortedItems) {
    const sNum = Number(item.surah);
    const verseKey = `${item.surah}:${item.ayah}`;
    const verseId = `${item.surah}:${item.ayah}`;

    if (!cache[sNum]) {
      cache[sNum] = {};
    }

    if (!cache[sNum][verseId]) {
      cache[sNum][verseId] = {
        id: verseId,
        page: item.page || mapping?.[verseKey] || 0,
        words: []
      };
    }

    cache[sNum][verseId].words.push({
      word: parseInt(item.word),
      text: item.text,
      layoutText: item.layoutText ?? item.text,
      id: item.id,
      page: item.page || mapping?.[verseKey] || 0,
      line: item.line ?? 0,
    } as any);
  }

  const result: Record<number, QPCVerseData[]> = {};
  for (const sNumStr in cache) {
    const sNum = parseInt(sNumStr);
    result[sNum] = Object.values(cache[sNum]).map(verse => {
      verse.words.sort((a, b) => a.word - b.word);
      return verse;
    });
  }
  return result;
}

export function getSurahQPCData(surahNumber: number, layout: string = 'v1'): QPCVerseData[] {
  const mapping = getPageMapping();
  if (layout === 'v4') {
    if (!qpcV4BySurah) {
      const allData = getQPCData('v4');
      qpcV4BySurah = buildSurahCache(allData, 'v4', mapping);
    }
    return qpcV4BySurah[surahNumber] || [];
  } else {
    if (!qpcV1BySurah) {
      const allData = getQPCData('v1');
      qpcV1BySurah = buildSurahCache(allData, 'v1', mapping);
    }
    return qpcV1BySurah[surahNumber] || [];
  }
}

