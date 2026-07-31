// Quran.com Public API v4
const BASE = "https://api.quran.com/api/v4";
const AUDIO_BASE = "https://verses.quran.com/";

export interface Chapter {
  id: number;
  name_arabic: string;
  name_simple: string;
  verses_count: number;
}

export interface Word {
  position: number;
  text_uthmani: string;
  char_type_name: string; // "word" | "end"
  translation?: string;
}

export interface Segment {
  wordPosition: number; // 1-indexed position into verse.words
  startMs: number;
  endMs: number;
}

export interface VerseWithAudio {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  translation?: string;
  words: Word[];
  audio: {
    url: string;
    segments: Segment[];
    durationMs: number;
  };
}

// Saheeh International — widely trusted English translation on Quran.com
export const DEFAULT_TRANSLATION_ID = 20;

export async function fetchChapters(): Promise<Chapter[]> {
  const r = await fetch(`${BASE}/chapters?language=ar`);
  if (!r.ok) throw new Error("Failed to load chapters");
  const j = await r.json();
  return j.chapters;
}

export interface ChapterVerse {
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
}

export async function fetchChapterVerses(chapterId: number): Promise<ChapterVerse[]> {
  const all: ChapterVerse[] = [];
  let page = 1;
  // Quran.com paginates; loop until we've collected everything.
  while (true) {
    const url = `${BASE}/verses/by_chapter/${chapterId}?fields=text_uthmani&per_page=50&page=${page}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Failed to load verses for chapter ${chapterId}`);
    const j = await r.json();
    for (const v of j.verses as ChapterVerse[]) {
      all.push({
        verse_number: v.verse_number,
        verse_key: v.verse_key,
        text_uthmani: v.text_uthmani,
      });
    }
    const totalPages = j.pagination?.total_pages ?? 1;
    if (page >= totalPages) break;
    page++;
  }
  return all;
}

/**
 * Returns verse text + words + audio URL + per-word segments in one call.
 * Segment format from Quran.com is [startWordIdx0Based, endWordIdx0BasedExclusive, startMs, endMs].
 * We map each segment to a single word position (= startWordIdx + 1, 1-indexed).
 */
// Sentinel reciter IDs whose audio comes from external sources (no Quran.com segments).
const ALI_JABER_ID = -1001;
const YASSER_DOSARI_ID = -1002;

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

function loadAudioDurationMs(url: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(0), 3000);
    a.onloadedmetadata = () => {
      clearTimeout(timer);
      resolve(Math.round((a.duration || 0) * 1000));
    };
    a.onerror = () => {
      clearTimeout(timer);
      resolve(0);
    };
    a.src = url;
  });
}

/**
 * Returns verse text + words + audio URL + per-word segments in one call.
 * Segment format from Quran.com is [startWordIdx0Based, endWordIdx0BasedExclusive, startMs, endMs].
 * We map each segment to a single word position (= startWordIdx + 1, 1-indexed).
 *
 * For reciters not available on the Quran.com recitations API (e.g. Ali Jaber via EveryAyah),
 * we fetch text from Quran.com without audio, build the external MP3 URL, load duration via
 * an HTMLAudioElement, and synthesise per-word segments evenly across the clip.
 */
export async function fetchVerseWithAudio(
  verseKey: string,
  recitationId: number,
  translationId: number = DEFAULT_TRANSLATION_ID,
): Promise<VerseWithAudio> {
  const isExternal = recitationId === ALI_JABER_ID || recitationId === YASSER_DOSARI_ID;
  const params = new URLSearchParams({
    words: "true",
    fields: "text_uthmani",
    word_fields: "text_uthmani",
    word_translation_language: "en",
    translations: String(translationId),
  });
  if (!isExternal) params.set("audio", String(recitationId));
  const url = `${BASE}/verses/by_key/${verseKey}?${params.toString()}`;

  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to load ${verseKey}`);
  const j = await r.json();
  const v = j.verse;

  const cleanTr = (s?: string) =>
    s
      ? s
          .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
          .replace(/<[^>]+>/g, "")
          .trim()
      : undefined;

  const words: Word[] = v.words.map((w: Word & { translation?: { text?: string } }) => ({
    position: w.position,
    text_uthmani: w.text_uthmani,
    char_type_name: w.char_type_name,
    translation: cleanTr(w.translation?.text),
  }));

  let audioUrl: string;
  let segments: Segment[];
  let durationMs: number;

  if (isExternal) {
    const [s, a] = verseKey.split(":").map(Number);
    const folder =
      recitationId === YASSER_DOSARI_ID ? "Yasser_Ad-Dussary_128kbps" : "Ali_Jaber_64kbps";
    audioUrl = `https://everyayah.com/data/${folder}/${pad3(s)}${pad3(a)}.mp3`;
    durationMs = await loadAudioDurationMs(audioUrl);
    // Distribute words evenly across duration as a karaoke approximation.
    const realWords = words.filter((w) => w.char_type_name === "word");
    const n = realWords.length || 1;
    const slice = durationMs / n;
    segments = realWords.map((w, i) => ({
      wordPosition: w.position,
      startMs: Math.round(i * slice),
      endMs: Math.round((i + 1) * slice),
    }));
  } else {
    if (!v?.audio) throw new Error(`No audio for ${verseKey}`);

    const rawSegments: (number | string)[][] = v.audio.segments || [];
    const parsedSegments: Segment[] = [];
    for (const rawSeg of rawSegments) {
      const startWordIdx = Number(rawSeg[0] ?? 0);
      const endWordIdx = Number(rawSeg[1] ?? startWordIdx + 1);
      const startMs = Number(rawSeg[2] ?? 0);
      const endMs = Number(rawSeg[3] ?? 0);

      const numWords = Math.max(1, endWordIdx - startWordIdx);
      const durationPerWord = (endMs - startMs) / numWords;

      for (let i = 0; i < numWords; i++) {
        const wordIdx = startWordIdx + i;
        const wordPosition = wordIdx + 1; // 1-indexed position
        const wStart = Math.round(startMs + i * durationPerWord);
        const wEnd = Math.round(startMs + (i + 1) * durationPerWord);
        parsedSegments.push({
          wordPosition,
          startMs: wStart,
          endMs: wEnd,
        });
      }
    }
    segments = parsedSegments;

    const u: string = v.audio.url || "";
    if (u.startsWith("//")) {
      audioUrl = "https:" + u;
    } else if (u.startsWith("http")) {
      audioUrl = u;
    } else {
      audioUrl = AUDIO_BASE + u;
    }

    const segEnd = segments.length ? segments[segments.length - 1].endMs : 0;
    const mediaDuration = await loadAudioDurationMs(audioUrl);
    durationMs = Math.max(segEnd, mediaDuration);
  }

  const translation = cleanTr(v.translations?.[0]?.text);

  return {
    id: v.id,
    verse_number: v.verse_number,
    verse_key: v.verse_key,
    text_uthmani: v.text_uthmani,
    translation,
    words,
    audio: { url: audioUrl, segments, durationMs },
  };
}
