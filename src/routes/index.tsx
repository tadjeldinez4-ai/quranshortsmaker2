import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchChapters,
  fetchChapterVerses,
  fetchVerseWithAudio,
  type Segment,
  type VerseWithAudio,
} from "@/lib/quran-api";
import { RECITERS } from "@/lib/reciters";
import { BACKGROUNDS, type Background } from "@/lib/backgrounds";
import { PRESETS, type Preset } from "@/lib/presets";
import { exportVideo, downloadBlob } from "@/lib/exporter";
import { PexelsBrowser } from "@/components/PexelsBrowser";
import type { PexelsResult } from "@/lib/pexels.functions";
import { stripArabicDiacritics } from "@/lib/arabic";
import { MobileStudio, type MobileTab } from "@/components/MobileStudio";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quran Shorts Maker — Studio" },
      { name: "description", content: "Compose karaoke-synced Quran shorts in your browser." },
    ],
  }),
  component: Studio,
});

type Clip = VerseWithAudio;

function Studio() {
  // ─── Data ─────────────────────────────────────────────────────────────
  const chaptersQ = useQuery({ queryKey: ["chapters"], queryFn: fetchChapters });

  const [chapterId, setChapterId] = useState(36); // Ya-Sin opening
  const chapterVersesQ = useQuery({
    queryKey: ["chapter-verses", chapterId],
    queryFn: () => fetchChapterVerses(chapterId),
  });
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(3);
  const [reciterId, setReciterId] = useState(7); // Alafasy
  const [chapterSearch, setChapterSearch] = useState("");

  // Clamp verse range when chapter changes
  useEffect(() => {
    const ch = chaptersQ.data?.find((c) => c.id === chapterId);
    if (!ch) return;
    setStartVerse((v) => Math.min(Math.max(1, v), ch.verses_count));
    setEndVerse((v) => Math.min(Math.max(1, v), ch.verses_count));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, chaptersQ.data]);

  // Build list of verse keys for the selected range.
  const verseKeys = useMemo(() => {
    const keys: string[] = [];
    const lo = Math.min(startVerse, endVerse);
    const hi = Math.max(startVerse, endVerse);
    for (let n = lo; n <= hi; n++) keys.push(`${chapterId}:${n}`);
    return keys;
  }, [chapterId, startVerse, endVerse]);

  const clipsQ = useQuery({
    queryKey: ["clips", reciterId, verseKeys.join(",")],
    enabled: verseKeys.length > 0,
    queryFn: async (): Promise<Clip[]> => {
      return Promise.all(verseKeys.map((k) => fetchVerseWithAudio(k, reciterId)));
    },
  });

  // Manual per-verse segment overrides. Keyed by verse_key.
  const [segmentOverrides, setSegmentOverrides] = useState<Record<string, Segment[]>>({});
  // Reset overrides when reciter changes (timings are reciter-specific)
  useEffect(() => {
    setSegmentOverrides({});
  }, [reciterId]);

  // ─── Styling state ────────────────────────────────────────────────────
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [textColor, setTextColor] = useState(preset.textColor);
  const [highlightColor, setHighlightColor] = useState(preset.highlightColor);
  const [fontSize, setFontSize] = useState(32);
  const [lineHeight, setLineHeight] = useState(1.9);
  const [textY, setTextY] = useState(50); // % from top
  const [overlayOpacity, setOverlayOpacity] = useState(preset.overlayOpacity);
  const [blur, setBlur] = useState(preset.blur);
  const [brightness, setBrightness] = useState(1);
  const [shadow, setShadow] = useState(preset.shadow);
  const [stroke, setStroke] = useState(preset.strokeWidth);
  const [background, setBackground] = useState<Background>(BACKGROUNDS[0]);
  const [uploadedBg, setUploadedBg] = useState<string | null>(null);
  const [wordsPerChunk, setWordsPerChunk] = useState(5);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showArabic, setShowArabic] = useState(true);
  const [translationAsMain, setTranslationAsMain] = useState(false);
  const [translationSize, setTranslationSize] = useState(15);
  const [translationColor, setTranslationColor] = useState("#10b981");
  const [wordSyncEnabled, setWordSyncEnabled] = useState(true);
  const [showSurahName, setShowSurahName] = useState(true);
  const [surahNameSize, setSurahNameSize] = useState(32);
  const [arabicFont, setArabicFont] = useState<"amiri" | "zain">("amiri");
  const arabicFontFamily =
    arabicFont === "zain" ? '"Zain", "Amiri Quran", serif' : '"Amiri Quran", "Amiri", serif';

  // ─── Export state ─────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const exportAbortRef = useRef<AbortController | null>(null);

  function applyPreset(p: Preset) {
    setPreset(p);
    setTextColor(p.textColor);
    setHighlightColor(p.highlightColor);
    setFontSize(p.fontSize);
    setOverlayOpacity(p.overlayOpacity);
    setBlur(p.blur);
    setShadow(p.shadow);
    setStroke(p.strokeWidth);
  }

  // ─── Playback ─────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0); // index in clips
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0); // within current clip

  // Reset on new clips
  useEffect(() => {
    setActiveIdx(0);
    setCurrentMs(0);
    setPlaying(false);
  }, [verseKeys.join(","), reciterId]);

  // Drive currentMs from <audio>
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    let raf = 0;
    const tick = () => {
      setCurrentMs(a.currentTime * 1000);
      raf = requestAnimationFrame(tick);
    };
    if (playing) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, activeIdx]);

  const rawClips = clipsQ.data ?? [];
  const clips = useMemo<Clip[]>(
    () =>
      rawClips.map((c) => {
        const ov = segmentOverrides[c.verse_key];
        return ov ? { ...c, audio: { ...c.audio, segments: ov } } : c;
      }),
    [rawClips, segmentOverrides],
  );
  const activeClip = clips[activeIdx];

  // Auto-advance to next verse
  function handleEnded() {
    if (activeIdx < clips.length - 1) {
      setActiveIdx((i) => i + 1);
      setCurrentMs(0);
      // play next on next tick
      requestAnimationFrame(() => audioRef.current?.play().catch(() => {}));
    } else {
      setPlaying(false);
      setActiveIdx(0);
      setCurrentMs(0);
    }
  }

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  }

  // Highlighted word position for current clip
  const activeWordPos = useMemo(() => {
    if (!activeClip || !wordSyncEnabled) return 0;
    const segs = activeClip.audio.segments;
    if (!segs.length) return 0;
    for (const s of segs) {
      if (currentMs >= s.startMs && currentMs <= s.endMs) return s.wordPosition;
    }
    // pick the last passed
    let last = 0;
    for (const s of segs) if (currentMs > s.endMs) last = s.wordPosition;
    return last;
  }, [activeClip, currentMs, wordSyncEnabled]);

  // Total duration for timeline
  const totalDurationMs = clips.reduce((sum, c) => sum + c.audio.durationMs, 0);
  const elapsedMs =
    clips.slice(0, activeIdx).reduce((s, c) => s + c.audio.durationMs, 0) + currentMs;

  // ─── Filtered chapters ────────────────────────────────────────────────
  const filteredChapters = useMemo(() => {
    if (!chaptersQ.data) return [];
    const q = chapterSearch.trim().toLowerCase();
    if (!q) return chaptersQ.data;
    return chaptersQ.data.filter(
      (c) =>
        c.name_simple.toLowerCase().includes(q) ||
        c.name_arabic.includes(chapterSearch) ||
        String(c.id) === q,
    );
  }, [chaptersQ.data, chapterSearch]);

  const currentChapter = chaptersQ.data?.find((c) => c.id === chapterId);

  // ─── Mobile View & Export Handling ─────────────────────────────────────
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>("select");
  const [mobileModeOverride, setMobileModeOverride] = useState<boolean | null>(null);
  const showMobileView = mobileModeOverride !== null ? mobileModeOverride : isMobile;

  const handleExport = async () => {
    if (!clips.length) return;
    setExporting(true);
    setExportProgress(0);
    const ac = new AbortController();
    exportAbortRef.current = ac;
    try {
      audioRef.current?.pause();
      setPlaying(false);
      const bgKind: "gradient" | "video" | "image" = uploadedBg ? "video" : background.kind;
      const bgVal = uploadedBg ?? background.value;
      const blob = await exportVideo({
        clips,
        style: {
          fontSize,
          lineHeight,
          textY,
          textColor,
          highlightColor,
          shadow,
          stroke,
          overlayOpacity,
          blur,
          brightness,
          wordsPerChunk,
          showTranslation,
          translationSize,
          translationColor,
          showArabic,
          translationAsMain,
          wordSyncEnabled,
          arabicFontFamily,
          showSurahName,
          surahNameSize,
          surahName: currentChapter?.name_arabic,
        },
        backgroundKind: bgKind,
        backgroundValue: bgVal,
        signal: ac.signal,
        onProgress: setExportProgress,
      });
      const ext = (blob as Blob & { _ext?: string })._ext ?? "mp4";
      downloadBlob(
        blob,
        `quran-${currentChapter?.name_simple ?? "clip"}-${startVerse}-${endVerse}.${ext}`,
      );
    } catch (err) {
      if ((err as Error)?.message === "aborted" || (err as Error)?.name === "AbortError") {
        console.log("Export process was cancelled/aborted.");
      } else {
        console.error("Export error:", err);
      }
    } finally {
      setExporting(false);
      exportAbortRef.current = null;
    }
  };

  // ─── Background resolution ─────────────────────────────────────────────
  // uploadedBg (if set) wins, treated as video. Otherwise use selected Background.
  const effectiveBg: { kind: "gradient" | "video" | "image"; value: string } = uploadedBg
    ? { kind: "video", value: uploadedBg }
    : { kind: background.kind, value: background.value };
  const isMediaBg = effectiveBg.kind === "video" || effectiveBg.kind === "image";

  if (showMobileView) {
    return (
      <>
        {/* Toggle back to desktop layout if on wider screen */}
        <div className="fixed top-2 right-14 z-50 hidden md:block">
          <button
            onClick={() => setMobileModeOverride(false)}
            className="rounded bg-[#2e353f] px-2.5 py-1 text-[10px] font-bold text-[#ffe39c] border border-[#eac65f]/40 shadow-lg hover:bg-[#192029]"
          >
            Desktop Studio View
          </button>
        </div>
        <MobileStudio
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
          chapters={chaptersQ.data || []}
          chapterId={chapterId}
          setChapterId={setChapterId}
          startVerse={startVerse}
          setStartVerse={setStartVerse}
          endVerse={endVerse}
          setEndVerse={setEndVerse}
          chapterVerses={chapterVersesQ.data || []}
          reciterId={reciterId}
          setReciterId={setReciterId}
          chapterSearch={chapterSearch}
          setChapterSearch={setChapterSearch}
          clips={clips}
          activeClip={activeClip}
          activeIdx={activeIdx}
          setActiveIdx={setActiveIdx}
          playing={playing}
          togglePlay={togglePlay}
          currentMs={currentMs}
          setCurrentMs={setCurrentMs}
          totalDurationMs={totalDurationMs}
          elapsedMs={elapsedMs}
          activeWordPos={activeWordPos}
          audioRef={audioRef}
          preset={preset}
          applyPreset={applyPreset}
          textColor={textColor}
          setTextColor={setTextColor}
          highlightColor={highlightColor}
          setHighlightColor={setHighlightColor}
          fontSize={fontSize}
          setFontSize={setFontSize}
          lineHeight={lineHeight}
          setLineHeight={setLineHeight}
          textY={textY}
          setTextY={setTextY}
          shadow={shadow}
          setShadow={setShadow}
          stroke={stroke}
          setStroke={setStroke}
          overlayOpacity={overlayOpacity}
          setOverlayOpacity={setOverlayOpacity}
          blur={blur}
          setBlur={setBlur}
          brightness={brightness}
          setBrightness={setBrightness}
          background={background}
          setBackground={setBackground}
          effectiveBg={effectiveBg}
          uploadedBg={uploadedBg}
          setUploadedBg={setUploadedBg}
          wordsPerChunk={wordsPerChunk}
          setWordsPerChunk={setWordsPerChunk}
          showTranslation={showTranslation}
          setShowTranslation={setShowTranslation}
          showArabic={showArabic}
          setShowArabic={setShowArabic}
          translationAsMain={translationAsMain}
          setTranslationAsMain={setTranslationAsMain}
          translationSize={translationSize}
          setTranslationSize={setTranslationSize}
          translationColor={translationColor}
          setTranslationColor={setTranslationColor}
          wordSyncEnabled={wordSyncEnabled}
          setWordSyncEnabled={setWordSyncEnabled}
          showSurahName={showSurahName}
          setShowSurahName={setShowSurahName}
          surahNameSize={surahNameSize}
          setSurahNameSize={setSurahNameSize}
          arabicFont={arabicFont}
          setArabicFont={setArabicFont}
          arabicFontFamily={arabicFontFamily}
          segmentOverrides={segmentOverrides}
          setSegmentOverrides={setSegmentOverrides}
          exporting={exporting}
          exportProgress={exportProgress}
          handleExport={handleExport}
        />
        {activeClip && (
          <audio
            ref={audioRef}
            src={activeClip.audio.url}
            onEnded={handleEnded}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            preload="auto"
          />
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* ─── Top bar ─── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-panel/80 px-5">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 2l2.4 5.4L20 8l-4.2 3.7L17 18l-5-3-5 3 1.2-6.3L4 8l5.6-.6L12 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">Quran Shorts Maker</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Karaoke Quran videos · 1080×1920
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <button
            onClick={() => setMobileModeOverride(true)}
            className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition"
          >
            📱 Phone Layout
          </button>
          {currentChapter && (
            <span
              dir="rtl"
              className="rounded-md bg-secondary px-2.5 py-1 font-medium text-foreground"
            >
              {currentChapter.name_arabic} · {startVerse}–{endVerse}
            </span>
          )}
          {exporting ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-40 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${Math.round(exportProgress * 100)}%` }}
                />
              </div>
              <span className="tabular-nums text-foreground">
                {Math.round(exportProgress * 100)}%
              </span>
              <button
                onClick={() => exportAbortRef.current?.abort()}
                className="rounded-md border border-border bg-surface/60 px-2 py-1 text-[11px] hover:bg-secondary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleExport}
              disabled={!clips.length}
              className="rounded-md bg-gradient-to-r from-primary to-accent px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] disabled:opacity-40"
            >
              Export MP4
            </button>
          )}
        </div>
      </header>

      {/* ─── Main 3-column layout ─── */}
      <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr_300px]">
        {/* ── LEFT panel ── */}
        <aside className="scroll-thin flex min-h-0 flex-col gap-5 overflow-y-auto border-r border-border bg-panel/60 p-4">
          <Section title="Surah">
            <input
              type="text"
              placeholder="Search by name or number…"
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-input/60 px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/60"
            />
            <div className="scroll-thin mt-2 max-h-56 overflow-y-auto rounded-md border border-border/50">
              {chaptersQ.isLoading && (
                <p className="p-3 text-xs text-muted-foreground">Loading surahs…</p>
              )}
              {filteredChapters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChapterId(c.id)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition ${
                    chapterId === c.id ? "bg-primary/15 text-foreground" : "hover:bg-secondary/60"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded text-[10px] text-muted-foreground">
                      {c.id}
                    </span>
                    <span>{c.name_simple}</span>
                  </span>
                  <span dir="rtl" className="font-quran text-sm">
                    {c.name_arabic}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberField
                label="From"
                value={startVerse}
                min={1}
                max={currentChapter?.verses_count ?? 1}
                onChange={(v) => {
                  setStartVerse(v);
                  if (v > endVerse) setEndVerse(v);
                }}
              />
              <NumberField
                label="To"
                value={endVerse}
                min={startVerse}
                max={currentChapter?.verses_count ?? 1}
                onChange={(v) => setEndVerse(v)}
              />
            </div>
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Verses · tap to set range
              </p>
              <div className="scroll-thin max-h-64 overflow-y-auto rounded-md border border-border/50">
                {chapterVersesQ.isLoading && (
                  <p className="p-3 text-xs text-muted-foreground">Loading verses…</p>
                )}
                {chapterVersesQ.data?.map((v) => {
                  const lo = Math.min(startVerse, endVerse);
                  const hi = Math.max(startVerse, endVerse);
                  const inRange = v.verse_number >= lo && v.verse_number <= hi;
                  const isEndpoint = v.verse_number === startVerse || v.verse_number === endVerse;
                  return (
                    <button
                      key={v.verse_key}
                      onClick={() => {
                        // First tap → new single-verse selection.
                        // Second tap → extend range from existing start.
                        if (startVerse === endVerse) {
                          if (v.verse_number >= startVerse) setEndVerse(v.verse_number);
                          else {
                            setEndVerse(startVerse);
                            setStartVerse(v.verse_number);
                          }
                        } else {
                          setStartVerse(v.verse_number);
                          setEndVerse(v.verse_number);
                        }
                      }}
                      className={`flex w-full items-start gap-2 border-b border-border/40 px-3 py-2 text-left transition last:border-b-0 ${
                        isEndpoint
                          ? "bg-primary/20"
                          : inRange
                            ? "bg-primary/10"
                            : "hover:bg-secondary/50"
                      }`}
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] text-muted-foreground">
                        {v.verse_number}
                      </span>
                      <span
                        dir="rtl"
                        className="font-quran text-[15px] leading-relaxed text-foreground"
                      >
                        {v.text_uthmani}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title="Reciter">
            <div className="flex flex-col gap-1.5">
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReciterId(r.id)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition ${
                    reciterId === r.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/60 bg-surface/40 hover:bg-secondary/50"
                  }`}
                >
                  <div>
                    <p dir="rtl" className="font-quran text-sm">
                      {r.nameArabic}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.nameEnglish}
                      {r.style ? ` · ${r.style}` : ""}
                    </p>
                  </div>
                  {reciterId === r.id && <Dot />}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Background">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Presets
            </p>
            <div className="grid grid-cols-3 gap-2">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBackground(b);
                    setUploadedBg(null);
                  }}
                  className={`relative aspect-[9/16] overflow-hidden rounded-md border text-[10px] transition ${
                    background.id === b.id && !uploadedBg
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border/60 hover:border-border"
                  }`}
                  style={b.kind === "gradient" ? { background: b.value } : { background: "#000" }}
                  title={b.label}
                >
                  {b.kind === "video" && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40">
                      <span className="text-foreground">▶</span>
                    </div>
                  )}
                  <span
                    className="absolute bottom-1 left-1 right-1 truncate rounded bg-black/40 px-1 text-foreground"
                    dir="rtl"
                  >
                    {b.label}
                  </span>
                </button>
              ))}
            </div>

            <p className="mb-1 mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              Pexels
            </p>
            <PexelsBrowser
              selectedId={
                background.id.startsWith("pexels-") ? Number(background.id.slice(7)) : null
              }
              onPick={(r: PexelsResult) => {
                setUploadedBg(null);
                setBackground({
                  id: `pexels-${r.id}`,
                  label: r.photographer,
                  kind: r.kind,
                  value: r.url,
                  poster: r.poster,
                  credit: `Pexels · ${r.photographer}`,
                });
              }}
            />

            <label className="mt-2 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-border/80 bg-surface/40 px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/50">
              Upload video (MP4/MOV)
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setUploadedBg(URL.createObjectURL(f));
                }}
              />
            </label>
            {background.credit && !uploadedBg && (
              <p className="mt-1 text-[10px] text-muted-foreground">{background.credit}</p>
            )}
          </Section>
        </aside>

        {/* ── CENTER preview ── */}
        <main className="flex min-h-0 flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-surface p-6">
          <div className="relative aspect-[9/16] h-full max-h-[calc(100vh-220px)] overflow-hidden rounded-xl shadow-2xl shadow-black/50 ring-1 ring-border">
            {/* Background layer */}
            <div
              className="absolute inset-0"
              style={{ background: isMediaBg ? "#000" : effectiveBg.value }}
            />
            {effectiveBg.kind === "video" && (
              <video
                key={effectiveBg.value}
                src={effectiveBg.value}
                autoPlay
                muted
                loop
                playsInline
                crossOrigin="anonymous"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: `blur(${blur}px) brightness(${brightness})` }}
              />
            )}
            {effectiveBg.kind === "image" && (
              <img
                key={effectiveBg.value}
                src={effectiveBg.value}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: `blur(${blur}px) brightness(${brightness})` }}
              />
            )}
            {effectiveBg.kind === "gradient" && (
              <div
                className="absolute inset-0"
                style={{
                  filter: `blur(${blur}px) brightness(${brightness})`,
                  background: effectiveBg.value,
                }}
              />
            )}
            {/* Overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, rgba(0,0,0,${overlayOpacity * 0.6}) 0%, rgba(0,0,0,${overlayOpacity}) 100%)`,
              }}
            />

            {/* Text */}
            <div
              className="absolute inset-x-0 flex flex-col px-8"
              style={{ top: `${textY}%`, transform: "translateY(-50%)" }}
            >
              {clipsQ.isLoading && (
                <p className="text-center text-sm text-foreground/70">Loading recitation…</p>
              )}
              {clipsQ.isError && (
                <p className="text-center text-sm text-destructive">
                  Couldn't load audio. Try another reciter or verse.
                </p>
              )}
              {activeClip &&
                (() => {
                  const words = activeClip.words.filter((w) => w.char_type_name === "word");
                  const chunkSize = Math.max(1, wordsPerChunk);
                  const activeI = wordSyncEnabled
                    ? Math.max(
                        0,
                        words.findIndex((w) => w.position === activeWordPos),
                      )
                    : Math.min(
                        words.length - 1,
                        Math.max(
                          0,
                          Math.floor(
                            (currentMs / Math.max(1, activeClip.audio.durationMs)) * words.length,
                          ),
                        ),
                      );
                  const chunkI = Math.floor(activeI / chunkSize);
                  const chunk = words.slice(chunkI * chunkSize, (chunkI + 1) * chunkSize);
                  const chunkTranslation = chunk
                    .map((w) => w.translation)
                    .filter(Boolean)
                    .join(" ")
                    .trim();
                  return (
                    <>
                      {showArabic && (
                        <p
                          dir="rtl"
                          className="text-center transition-all"
                          style={{
                            fontFamily: arabicFontFamily,
                            fontSize: `${translationAsMain ? translationSize : fontSize}px`,
                            lineHeight,
                            color: textColor,
                            textShadow: `0 2px ${shadow}px rgba(0,0,0,0.85)`,
                            WebkitTextStroke: stroke ? `${stroke}px rgba(0,0,0,0.6)` : undefined,
                            order: translationAsMain ? 2 : 1,
                          }}
                        >
                          {chunk.map((w) => {
                            const isActive = w.position === activeWordPos;
                            const isPast = activeWordPos > 0 && w.position < activeWordPos;
                            return (
                              <span
                                key={w.position}
                                className="inline-block transition-all duration-200"
                                style={{
                                  color: isActive ? highlightColor : textColor,
                                  opacity: isActive ? 1 : isPast ? 0.95 : 0.55,
                                  transform: isActive ? "scale(1.06)" : "scale(1)",
                                  margin: "0 0.18em",
                                  textShadow: isActive
                                    ? `0 0 ${shadow + 8}px ${highlightColor}55, 0 2px ${shadow}px rgba(0,0,0,0.85)`
                                    : `0 2px ${shadow}px rgba(0,0,0,0.85)`,
                                }}
                              >
                                {arabicFont === "zain"
                                  ? stripArabicDiacritics(w.text_uthmani)
                                  : w.text_uthmani}
                              </span>
                            );
                          })}
                        </p>
                      )}
                      {showTranslation && chunkTranslation && (
                        <p
                          dir="ltr"
                          className="text-center italic"
                          style={{
                            marginTop: showArabic ? "1rem" : 0,
                            fontSize: `${translationAsMain ? fontSize : translationSize}px`,
                            lineHeight: translationAsMain ? lineHeight : 1.4,
                            color: translationAsMain ? textColor : translationColor,
                            opacity: 0.95,
                            textShadow: `0 2px ${Math.max(6, shadow)}px rgba(0,0,0,0.9)`,
                            fontFamily: "'Inter', system-ui, sans-serif",
                            order: translationAsMain ? 1 : 2,
                          }}
                        >
                          {chunkTranslation}
                        </p>
                      )}
                    </>
                  );
                })()}
            </div>

            {/* Verse counter chip */}
            {activeClip && (
              <div className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white backdrop-blur">
                {activeClip.verse_key} · {activeIdx + 1}/{clips.length}
              </div>
            )}

            {/* Surah name */}
            {currentChapter && showSurahName && (
              <div
                dir="rtl"
                className="absolute bottom-8 left-0 right-0 px-4 text-center"
                style={{
                  fontFamily: '"Surah Name", "Amiri Quran", serif',
                  fontSize: `${surahNameSize}px`,
                  color: textColor,
                  textShadow: `0 2px ${shadow}px rgba(0,0,0,0.85)`,
                }}
              >
                {currentChapter.name_arabic}
              </div>
            )}
          </div>

          {/* Transport */}
          <div className="flex w-full max-w-md items-center justify-center gap-3">
            <button
              onClick={togglePlay}
              disabled={!clips.length}
              className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105 disabled:opacity-40"
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="text-xs text-muted-foreground tabular-nums">
              {formatMs(elapsedMs)} / {formatMs(totalDurationMs)}
            </div>
          </div>

          {activeClip && (
            <audio
              ref={audioRef}
              src={activeClip.audio.url}
              onEnded={handleEnded}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              preload="auto"
            />
          )}
        </main>

        {/* ── RIGHT panel ── */}
        <aside className="scroll-thin flex min-h-0 flex-col gap-5 overflow-y-auto border-l border-border bg-panel/60 p-4">
          <Section title="Preset">
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className={`rounded-md border px-2 py-2 text-xs transition ${
                    preset.id === p.id
                      ? "border-primary/60 bg-primary/10"
                      : "border-border/60 bg-surface/40 hover:bg-secondary/50"
                  }`}
                >
                  <div
                    className="mb-1 h-6 rounded"
                    style={{
                      background: `linear-gradient(90deg, ${p.textColor}, ${p.highlightColor})`,
                    }}
                  />
                  {p.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Typography">
            <div>
              <p className="mb-1 text-[11px] text-muted-foreground">Arabic font</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "amiri", label: "Amiri Quran", ff: '"Amiri Quran", serif' },
                    { id: "zain", label: "Zain", ff: '"Zain", serif' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setArabicFont(f.id)}
                    className={`rounded-md border px-2 py-2 text-center transition ${
                      arabicFont === f.id
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/60 bg-surface/40 hover:bg-secondary/50"
                    }`}
                  >
                    <span
                      dir="rtl"
                      className="block text-lg leading-tight"
                      style={{ fontFamily: f.ff }}
                    >
                      بِسْمِ اللَّهِ
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {f.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <Slider
              label="Words per screen"
              min={1}
              max={8}
              value={wordsPerChunk}
              onChange={setWordsPerChunk}
            />
            <Slider
              label="Font size"
              min={28}
              max={96}
              value={fontSize}
              onChange={setFontSize}
              unit="px"
            />
            <Slider
              label="Line spacing"
              min={1.2}
              max={2.6}
              step={0.05}
              value={lineHeight}
              onChange={setLineHeight}
            />
            <Slider
              label="Vertical position"
              min={20}
              max={80}
              value={textY}
              onChange={setTextY}
              unit="%"
            />
            <Slider label="Shadow" min={0} max={40} value={shadow} onChange={setShadow} />
            <Slider label="Stroke" min={0} max={3} step={0.5} value={stroke} onChange={setStroke} />
          </Section>

          <Section title="Text Visibility">
            <label className="flex items-center justify-between rounded-md border border-border/60 bg-surface/40 px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">Show Arabic</span>
              <input
                type="checkbox"
                checked={showArabic}
                onChange={(e) => setShowArabic(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--primary)]"
              />
            </label>
            <label className="flex items-center justify-between rounded-md border border-border/60 bg-surface/40 px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">Show translation</span>
              <input
                type="checkbox"
                checked={showTranslation}
                onChange={(e) => setShowTranslation(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--primary)]"
              />
            </label>
            <label className="flex items-center justify-between rounded-md border border-border/60 bg-surface/40 px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">Translation as main text</span>
              <input
                type="checkbox"
                checked={translationAsMain}
                onChange={(e) => setTranslationAsMain(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--primary)]"
              />
            </label>
            {showTranslation && (
              <>
                <Slider
                  label="Translation size"
                  min={14}
                  max={40}
                  value={translationSize}
                  onChange={setTranslationSize}
                  unit="px"
                />
                <ColorRow
                  label="Translation color"
                  value={translationColor}
                  onChange={setTranslationColor}
                />
              </>
            )}
          </Section>

          <Section title="Surah Name">
            <label className="flex items-center justify-between rounded-md border border-border/60 bg-surface/40 px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">Show surah name</span>
              <input
                type="checkbox"
                checked={showSurahName}
                onChange={(e) => setShowSurahName(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--primary)]"
              />
            </label>
            {showSurahName && (
              <Slider
                label="Surah name size"
                min={14}
                max={96}
                value={surahNameSize}
                onChange={setSurahNameSize}
                unit="px"
              />
            )}
          </Section>

          <Section title="Colors">
            <ColorRow label="Text" value={textColor} onChange={setTextColor} />
            <ColorRow label="Highlight" value={highlightColor} onChange={setHighlightColor} />
          </Section>

          <Section title="Background FX">
            <Slider
              label="Overlay"
              min={0}
              max={1}
              step={0.05}
              value={overlayOpacity}
              onChange={setOverlayOpacity}
            />
            <Slider label="Blur" min={0} max={20} value={blur} onChange={setBlur} unit="px" />
            <Slider
              label="Brightness"
              min={0.4}
              max={1.4}
              step={0.05}
              value={brightness}
              onChange={setBrightness}
            />
          </Section>

          <Section title="Word Sync (manual)">
            <label className="flex items-center justify-between rounded-md border border-border/60 bg-surface/40 px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">Enable word sync</span>
              <input
                type="checkbox"
                checked={wordSyncEnabled}
                onChange={(e) => setWordSyncEnabled(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--primary)]"
              />
            </label>
            {!wordSyncEnabled ? (
              <p className="text-[11px] text-muted-foreground">
                Word-by-word highlighting is off. Chunks still advance with the audio.
              </p>
            ) : !activeClip ? (
              <p className="text-[11px] text-muted-foreground">Load a verse to edit timings.</p>
            ) : (
              <WordSyncEditor
                clip={activeClip}
                currentMs={currentMs}
                activeWordPos={activeWordPos}
                arabicFontFamily={arabicFontFamily}
                stripDiacritics={arabicFont === "zain"}
                onChange={(segs) =>
                  setSegmentOverrides((prev) => ({ ...prev, [activeClip.verse_key]: segs }))
                }
                onReset={() =>
                  setSegmentOverrides((prev) => {
                    const next = { ...prev };
                    delete next[activeClip.verse_key];
                    return next;
                  })
                }
                onSeek={(ms) => {
                  setCurrentMs(ms);
                  if (audioRef.current) audioRef.current.currentTime = ms / 1000;
                }}
                isOverridden={Boolean(segmentOverrides[activeClip.verse_key])}
              />
            )}
          </Section>
        </aside>
      </div>

      {/* ─── Bottom timeline ─── */}
      <footer className="flex h-32 shrink-0 flex-col gap-2 border-t border-border bg-panel/80 px-5 py-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Timeline</span>
          <span className="tabular-nums">
            {formatMs(elapsedMs)} / {formatMs(totalDurationMs)}
          </span>
        </div>
        <Timeline
          clips={clips}
          activeIdx={activeIdx}
          currentMs={currentMs}
          activeWordPos={activeWordPos}
          wordSyncEnabled={wordSyncEnabled}
          onSeek={(clipIdx, ms) => {
            setActiveIdx(clipIdx);
            setCurrentMs(ms);
            requestAnimationFrame(() => {
              if (audioRef.current) {
                audioRef.current.currentTime = ms / 1000;
              }
            });
          }}
          onEditSegments={(clipIdx, segs) => {
            const key = clips[clipIdx]?.verse_key;
            if (!key) return;
            setSegmentOverrides((prev) => ({ ...prev, [key]: segs }));
          }}
        />
      </footer>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Dot() {
  return <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />;
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Math.max(min, Math.min(max, Number(e.target.value) || min));
          onChange(v);
        }}
        className="rounded-md border border-border bg-input/60 px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
      />
    </label>
  );
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = "",
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums text-foreground">
          {Number.isInteger(value) ? value : value.toFixed(2)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--primary)]"
      />
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-surface/40 px-2 py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 rounded border border-border bg-input/60 px-1.5 py-0.5 text-[11px] tabular-nums outline-none focus:border-primary/60"
        />
      </div>
    </div>
  );
}

function Timeline({
  clips,
  activeIdx,
  currentMs,
  activeWordPos,
  wordSyncEnabled,
  onSeek,
  onEditSegments,
}: {
  clips: Clip[];
  activeIdx: number;
  currentMs: number;
  activeWordPos: number;
  wordSyncEnabled: boolean;
  onSeek: (clipIdx: number, ms: number) => void;
  onEditSegments: (clipIdx: number, segs: Segment[]) => void;
}) {
  if (!clips.length) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
        Select a surah & reciter to begin
      </div>
    );
  }

  const totalMs = clips.reduce((s, c) => s + c.audio.durationMs, 0);
  const MIN_GAP = 30; // ms

  function beginDrag(e: React.PointerEvent, clipIdx: number, segIdx: number, track: HTMLElement) {
    e.stopPropagation();
    e.preventDefault();
    const clip = clips[clipIdx];
    const dur = clip.audio.durationMs;
    const rect = track.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const rel = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const ms = rel * dur;
      const segs = clip.audio.segments.map((s) => ({ ...s }));
      const cur = segs[segIdx];
      const nxt = segIdx + 1 < segs.length ? segs[segIdx + 1] : null;
      const lo = cur.startMs + MIN_GAP;
      const hi = nxt ? nxt.endMs - MIN_GAP : dur;
      const clamped = Math.max(lo, Math.min(hi, ms));
      cur.endMs = clamped;
      if (nxt) nxt.startMs = clamped;
      onEditSegments(clipIdx, segs);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="relative flex h-full gap-1 overflow-hidden rounded-md border border-border/50 bg-surface-2/40 p-1">
      {clips.map((clip, i) => {
        const widthPct = (clip.audio.durationMs / totalMs) * 100;
        const isActive = i === activeIdx;
        const wordSegs = clip.audio.segments;
        return (
          <div
            key={clip.verse_key}
            className={`relative h-full overflow-hidden rounded ${
              isActive ? "bg-primary/15 ring-1 ring-primary/40" : "bg-surface/60"
            }`}
            style={{ width: `${widthPct}%` }}
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const rel = (e.clientX - rect.left) / rect.width;
              onSeek(i, rel * clip.audio.durationMs);
            }}
          >
            {/* Word boxes */}
            <div className="absolute inset-0">
              {wordSegs.map((s: Segment, segIdx: number) => {
                const left = (s.startMs / clip.audio.durationMs) * 100;
                const w = ((s.endMs - s.startMs) / clip.audio.durationMs) * 100;
                const lit = wordSyncEnabled && isActive && s.wordPosition === activeWordPos;
                const isLast = segIdx === wordSegs.length - 1;
                return (
                  <div
                    key={s.wordPosition}
                    className="group absolute top-1/2 -translate-y-1/2 rounded-sm border border-border/40 transition-[background,height,opacity]"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(0.6, w)}%`,
                      height: lit ? "72%" : "48%",
                      background: lit ? "var(--primary)" : "var(--muted-foreground)",
                      opacity: wordSyncEnabled ? (lit ? 1 : 0.55) : 0.25,
                    }}
                    title={`#${s.wordPosition} · ${(s.startMs / 1000).toFixed(2)}s → ${(s.endMs / 1000).toFixed(2)}s`}
                  >
                    {/* Right-edge drag handle (skip last word) */}
                    {!isLast && (
                      <div
                        onPointerDown={(e) =>
                          beginDrag(
                            e,
                            i,
                            segIdx,
                            e.currentTarget.parentElement!.parentElement!
                              .parentElement as HTMLElement,
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-0 h-full w-2 -mr-1 cursor-ew-resize rounded-sm bg-transparent hover:bg-primary/60"
                        style={{ touchAction: "none" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Playhead */}
            {isActive && (
              <div
                className="pointer-events-none absolute top-0 h-full w-[2px] bg-primary shadow-[0_0_8px_var(--primary)]"
                style={{
                  left: `${(currentMs / clip.audio.durationMs) * 100}%`,
                }}
              />
            )}
            {/* Label */}
            <span className="pointer-events-none absolute bottom-0.5 left-1 text-[10px] text-muted-foreground">
              {clip.verse_key}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function WordSyncEditor({
  clip,
  currentMs,
  activeWordPos,
  arabicFontFamily,
  stripDiacritics,
  onChange,
  onReset,
  onSeek,
  isOverridden,
}: {
  clip: Clip;
  currentMs: number;
  activeWordPos: number;
  arabicFontFamily: string;
  stripDiacritics: boolean;
  onChange: (segs: Segment[]) => void;
  onReset: () => void;
  onSeek: (ms: number) => void;
  isOverridden: boolean;
}) {
  const words = clip.words.filter((w) => w.char_type_name === "word");
  const segsByPos = new Map<number, Segment>();
  for (const s of clip.audio.segments) segsByPos.set(s.wordPosition, s);

  function updateSeg(pos: number, patch: Partial<Segment>) {
    const next: Segment[] = words.map((w) => {
      const cur = segsByPos.get(w.position) ?? {
        wordPosition: w.position,
        startMs: 0,
        endMs: 0,
      };
      return w.position === pos ? { ...cur, ...patch, wordPosition: pos } : cur;
    });
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {clip.verse_key} · {words.length} words
          {isOverridden && <span className="ml-1 text-primary">· edited</span>}
        </span>
        {isOverridden && (
          <button
            onClick={onReset}
            className="rounded border border-border/60 bg-surface/40 px-2 py-0.5 text-[10px] hover:bg-secondary/50"
          >
            Reset
          </button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Values in seconds. Use <span className="text-foreground">Set</span> to snap to the current
        playback position.
      </p>
      <div className="scroll-thin max-h-72 space-y-1 overflow-y-auto rounded-md border border-border/50 bg-surface/30 p-1.5">
        {words.map((w) => {
          const seg = segsByPos.get(w.position) ?? {
            wordPosition: w.position,
            startMs: 0,
            endMs: 0,
          };
          const isActive = w.position === activeWordPos;
          return (
            <div
              key={w.position}
              className={`rounded border px-1.5 py-1 transition ${
                isActive ? "border-primary/60 bg-primary/10" : "border-border/40 bg-surface/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => onSeek(seg.startMs)}
                  dir="rtl"
                  className="truncate text-right"
                  style={{ fontFamily: arabicFontFamily, fontSize: 16 }}
                  title="Jump to word"
                >
                  {stripDiacritics ? stripArabicDiacritics(w.text_uthmani) : w.text_uthmani}
                </button>
                <span className="text-[10px] text-muted-foreground">#{w.position}</span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <TimeInput
                  value={seg.startMs}
                  onChange={(ms) => updateSeg(w.position, { startMs: ms })}
                />
                <button
                  onClick={() => updateSeg(w.position, { startMs: Math.round(currentMs) })}
                  className="rounded bg-secondary/70 px-1.5 py-0.5 text-[10px] hover:bg-secondary"
                  title="Set start to current time"
                >
                  Set
                </button>
                <span className="text-[10px] text-muted-foreground">→</span>
                <TimeInput
                  value={seg.endMs}
                  onChange={(ms) => updateSeg(w.position, { endMs: ms })}
                />
                <button
                  onClick={() => updateSeg(w.position, { endMs: Math.round(currentMs) })}
                  className="rounded bg-secondary/70 px-1.5 py-0.5 text-[10px] hover:bg-secondary"
                  title="Set end to current time"
                >
                  Set
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeInput({ value, onChange }: { value: number; onChange: (ms: number) => void }) {
  return (
    <input
      type="number"
      step={0.01}
      value={(value / 1000).toFixed(2)}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v)) onChange(Math.max(0, Math.round(v * 1000)));
      }}
      className="w-16 rounded border border-border bg-input/60 px-1 py-0.5 text-[10px] tabular-nums outline-none focus:border-primary/60"
    />
  );
}
