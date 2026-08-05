import React, { useState } from "react";
import {
  Menu,
  Settings,
  ListChecks,
  Film,
  Palette,
  RefreshCw,
  PlayCircle,
  Play,
  Pause,
  Search,
  CheckCircle2,
  Upload,
  Download,
  Bookmark,
  Share2,
  FastForward,
  Rewind,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
} from "lucide-react";
import type { Chapter, ChapterVerse, Segment, VerseWithAudio } from "@/lib/quran-api";
import type { Reciter } from "@/lib/reciters";
import type { Background } from "@/lib/backgrounds";
import type { Preset } from "@/lib/presets";
import { RECITERS } from "@/lib/reciters";
import { PRESETS } from "@/lib/presets";
import { SocialOverlay, type SocialPlatform } from "./SocialOverlay";
import { PexelsBrowser } from "@/components/PexelsBrowser";
import type { PexelsResult } from "@/lib/pexels.functions";
import { stripArabicDiacritics } from "@/lib/arabic";

export type MobileTab = "select" | "media" | "style" | "sync" | "preview";

interface MobileStudioProps {
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;

  // Data
  chapters: Chapter[];
  chapterId: number;
  setChapterId: (id: number) => void;
  startVerse: number;
  setStartVerse: (v: number) => void;
  endVerse: number;
  setEndVerse: (v: number) => void;
  chapterVerses: ChapterVerse[];
  reciterId: number;
  setReciterId: (id: number) => void;
  chapterSearch: string;
  setChapterSearch: (s: string) => void;

  // Clips & Playback
  clips: VerseWithAudio[];
  activeClip: VerseWithAudio | null;
  activeIdx: number;
  setActiveIdx: (idx: number) => void;
  playing: boolean;
  togglePlay: () => void;
  currentMs: number;
  setCurrentMs: (ms: number) => void;
  totalDurationMs: number;
  elapsedMs: number;
  activeWordPos: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;

  // Styling state
  preset: Preset;
  applyPreset: (p: Preset) => void;
  textColor: string;
  setTextColor: (c: string) => void;
  highlightColor: string;
  setHighlightColor: (c: string) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  lineHeight: number;
  setLineHeight: (v: number) => void;
  textY: number;
  setTextY: (v: number) => void;
  shadow: number;
  setShadow: (v: number) => void;
  stroke: number;
  setStroke: (v: number) => void;
  overlayOpacity: number;
  setOverlayOpacity: (v: number) => void;
  blur: number;
  setBlur: (v: number) => void;
  brightness: number;
  setBrightness: (v: number) => void;

  // Background
  background: Background;
  setBackground: (bg: Background) => void;
  effectiveBg: Background;
  uploadedBg: string | null;
  setUploadedBg: (url: string | null) => void;

  // Text / Sync options
  wordsPerChunk: number;
  setWordsPerChunk: (v: number) => void;
  showTranslation: boolean;
  setShowTranslation: (b: boolean) => void;
  showArabic: boolean;
  setShowArabic: (b: boolean) => void;
  translationAsMain: boolean;
  setTranslationAsMain: (b: boolean) => void;
  translationSize: number;
  setTranslationSize: (v: number) => void;
  translationColor: string;
  setTranslationColor: (c: string) => void;
  wordSyncEnabled: boolean;
  setWordSyncEnabled: (b: boolean) => void;
  showSurahName: boolean;
  setShowSurahName: (b: boolean) => void;
  surahNameSize: number;
  setSurahNameSize: (v: number) => void;
  surahY: number;
  setSurahY: (v: number) => void;
  socialPlatform: SocialPlatform;
  setSocialPlatform: (p: SocialPlatform) => void;
  arabicFont: "amiri" | "zain";
  setArabicFont: (f: "amiri" | "zain") => void;
  arabicFontFamily: string;

  // Segment overrides
  segmentOverrides: Record<string, Segment[]>;
  setSegmentOverrides: React.Dispatch<React.SetStateAction<Record<string, Segment[]>>>;

  // Export & Trimming
  startOffsetSec: number;
  setStartOffsetSec: (v: number) => void;
  exporting: boolean;
  exportProgress: number;
  handleExport: () => void;
}

export function MobileStudio(props: MobileStudioProps) {
  const {
    mobileTab,
    setMobileTab,
    chapters,
    chapterId,
    setChapterId,
    startVerse,
    setStartVerse,
    endVerse,
    setEndVerse,
    chapterVerses,
    reciterId,
    setReciterId,
    chapterSearch,
    setChapterSearch,
    clips,
    activeClip,
    activeIdx,
    setActiveIdx,
    playing,
    togglePlay,
    currentMs,
    setCurrentMs,
    totalDurationMs,
    elapsedMs,
    activeWordPos,
    startOffsetSec,
    setStartOffsetSec,
    audioRef,
    preset,
    applyPreset,
    textColor,
    setTextColor,
    highlightColor,
    setHighlightColor,
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    textY,
    setTextY,
    shadow,
    setShadow,
    stroke,
    setStroke,
    overlayOpacity,
    setOverlayOpacity,
    blur,
    setBlur,
    brightness,
    setBrightness,
    background,
    setBackground,
    effectiveBg,
    uploadedBg,
    setUploadedBg,
    wordsPerChunk,
    setWordsPerChunk,
    showTranslation,
    setShowTranslation,
    showArabic,
    setShowArabic,
    translationAsMain,
    setTranslationAsMain,
    translationSize,
    setTranslationSize,
    translationColor,
    setTranslationColor,
    wordSyncEnabled,
    setWordSyncEnabled,
    showSurahName,
    setShowSurahName,
    surahNameSize,
    setSurahNameSize,
    surahY,
    setSurahY,
    socialPlatform,
    setSocialPlatform,
    arabicFont,
    setArabicFont,
    arabicFontFamily,
    segmentOverrides,
    setSegmentOverrides,
    exporting,
    exportProgress,
    handleExport,
  } = props;

  const [openAccordion, setOpenAccordion] = useState<string | null>("typography");
  const [showDrawer, setShowDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((prev) => (prev === msg ? null : prev)), 3000);
  };

  const currentChapter = chapters.find((c) => c.id === chapterId);
  const currentReciter = RECITERS.find((r) => r.id === reciterId);

  // Filter chapters
  const filteredChapters = chapters.filter((c) => {
    if (!chapterSearch.trim()) return true;
    const q = chapterSearch.toLowerCase();
    return (
      c.id.toString() === q || c.name_simple.toLowerCase().includes(q) || c.name_arabic.includes(q)
    );
  });

  const isMediaBg = effectiveBg.kind === "video" || effectiveBg.kind === "image";

  // Shared 9:16 Video Preview Box Component
  const renderPreviewBox = (showTimelineBar = false) => {
    return (
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Clip selector tabs if multiple clips exist */}
        {clips.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[280px] w-full pb-1 scrollbar-hide">
            {clips.map((clip, idx) => (
              <button
                key={clip.verse_key}
                onClick={() => {
                  setActiveIdx(idx);
                  setCurrentMs(0);
                  if (audioRef.current) audioRef.current.currentTime = 0;
                }}
                className={`flex-none px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                  activeIdx === idx
                    ? "bg-[#eac65f] text-[#685200] shadow-sm scale-105"
                    : "bg-[#192029] text-[#d0c5b1] border border-[#4d4637]/30 hover:bg-[#2e353f]"
                }`}
              >
                Verse {clip.verse_key}
              </button>
            ))}
          </div>
        )}

        {/* Social UI Overlay Selector Pills */}
        <div className="flex items-center justify-center gap-1 bg-[#151c25] border border-[#4d4637]/30 p-1 rounded-full text-[10px] mx-auto max-w-[320px] overflow-x-auto scrollbar-none">
          {(
            [
              { id: "none", label: "Clean" },
              { id: "tiktok", label: "TikTok" },
              { id: "instagram", label: "Reels" },
              { id: "youtube", label: "Shorts" },
              { id: "facebook", label: "Facebook" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setSocialPlatform(p.id)}
              className={`px-2.5 py-0.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                socialPlatform === p.id
                  ? "bg-[#eac65f] text-[#685200] shadow-xs"
                  : "text-[#d0c5b1] hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="relative mx-auto w-full max-w-[280px] aspect-[9/16] rounded-xl overflow-hidden border border-[#4d4637]/30 shadow-2xl bg-[#080f17]">
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

          {/* Verse text */}
          <div
            className="absolute inset-x-0 flex flex-col px-4 text-center"
            style={{ top: `${textY}%`, transform: "translateY(-50%)" }}
          >
            {activeClip ? (
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
                        className="transition-all"
                        style={{
                          fontFamily: arabicFontFamily,
                          fontSize: `${translationAsMain ? translationSize : Math.min(fontSize, 36)}px`,
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
                                margin: "0 0.15em",
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
                        className="italic text-center mt-2 text-xs"
                        style={{
                          fontSize: `${translationAsMain ? Math.min(fontSize, 28) : translationSize}px`,
                          color: translationAsMain ? textColor : translationColor,
                          order: translationAsMain ? 1 : 2,
                        }}
                      >
                        {chunkTranslation}
                      </p>
                    )}
                  </>
                );
              })()
            ) : (
              <p className="font-['Amiri_Quran'] text-xl text-[#ffe39c]">
                {currentChapter?.name_arabic || "يس"}
              </p>
            )}
          </div>

          {/* Surah name */}
          {currentChapter && showSurahName && (
            <div
              dir="rtl"
              className="absolute left-0 right-0 px-2 text-center flex items-center justify-center gap-2 -translate-y-1/2"
              style={{
                top: `${surahY}%`,
                color: textColor,
                textShadow: `0 2px ${shadow}px rgba(0,0,0,0.85)`,
              }}
            >
              <span
                style={{
                  fontFamily: '"Surah Name", "Amiri Quran", serif',
                  fontSize: `${Math.min(surahNameSize, 28)}px`,
                }}
              >
                {currentChapter.name_arabic}
              </span>
              <span style={{ fontSize: "15px", fontFamily: '"Amiri Quran", "Inter", sans-serif' }}>
                {startVerse === endVerse ? startVerse : `${startVerse}-${endVerse}`}
              </span>
            </div>
          )}

          {/* Verse Key Chip top right */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-[#dce3f0]">
            {activeClip ? activeClip.verse_key : `${chapterId}:1`} - {activeIdx + 1}/
            {clips.length || 1}
          </div>

          {/* Timeline bar overlay if in Sync tab */}
          {showTimelineBar && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-[#0d141d]/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <button
                onClick={togglePlay}
                className="text-[#ffe39c] active:scale-90 transition-transform"
              >
                {playing ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>
              <div className="flex-1 h-1 bg-[#2e353f] rounded-full relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#ffe39c]"
                  style={{
                    width: `${totalDurationMs ? (elapsedMs / totalDurationMs) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-[#d0c5b1]">
                {formatMs(elapsedMs)} / {formatMs(totalDurationMs)}
              </span>
            </div>
          )}

          {/* Social UI Overlay */}
          <SocialOverlay
            platform={socialPlatform}
            surahName={currentChapter?.name_simple}
            verseRange={startVerse === endVerse ? `${startVerse}` : `${startVerse}-${endVerse}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d141d] text-[#dce3f0] font-['Work_Sans',sans-serif] flex flex-col relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#eac65f] text-[#3d2f00] font-bold px-4 py-2 rounded-full shadow-2xl text-xs flex items-center gap-2 animate-pulse border border-[#ffe39c]">
          <CheckCircle2 className="w-4 h-4 fill-current" />
          {toastMessage}
        </div>
      )}
      {/* ─── Top App Bar ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d141d] border-b border-[#4d4637]/60 flex justify-between items-center px-4 h-14">
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className="flex items-center justify-center w-10 h-10 hover:bg-[#2e353f] rounded-full active:scale-95 transition-all text-[#ffe39c]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-['Manrope',sans-serif] font-extrabold text-xs text-[#ffe39c] uppercase tracking-widest">
          {mobileTab === "select" && "SELECTION"}
          {mobileTab === "media" && "BACKGROUND"}
          {mobileTab === "style" && "STYLE SETTINGS"}
          {mobileTab === "sync" && "WORD SYNC"}
          {mobileTab === "preview" && "PREVIEW"}
        </h1>
        <button
          onClick={() => setMobileTab("style")}
          className="flex items-center justify-center w-10 h-10 hover:bg-[#2e353f] rounded-full active:scale-95 transition-all text-[#ffe39c]"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Quick Drawer Modal */}
      {showDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start"
          onClick={() => setShowDrawer(false)}
        >
          <div
            className="w-72 bg-[#0d141d] border-r border-[#4d4637]/60 h-full p-5 space-y-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-['Manrope'] font-bold text-sm text-[#ffe39c] uppercase tracking-wider">
                  Al-Qalam Studio
                </h2>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="text-xs text-[#d0c5b1] hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-[#d0c5b1]/80 leading-relaxed">
                Create elegant vertical Quran video shorts with word-by-word karaoke timing, Uthmani
                script, and reciter audio.
              </p>
              <nav className="space-y-1 pt-2">
                {(
                  [
                    { id: "select", label: "Surah Selection", icon: ListChecks },
                    { id: "media", label: "Background Media", icon: Film },
                    { id: "style", label: "Style Settings", icon: Palette },
                    { id: "sync", label: "Word Sync Timing", icon: RefreshCw },
                    { id: "preview", label: "Preview & Export", icon: PlayCircle },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setMobileTab(item.id);
                        setShowDrawer(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition ${
                        mobileTab === item.id
                          ? "bg-[#eac65f] text-[#685200]"
                          : "text-[#dce3f0] hover:bg-[#2e353f]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 bg-[#192029] rounded-xl border border-[#4d4637]/30 text-[11px] text-[#d0c5b1]">
              <p className="font-bold text-[#ffe39c] mb-1">Active Selection</p>
              <p>
                {currentChapter?.name_simple || "Ya Seen"} ({chapterId})
              </p>
              <p className="text-[10px] opacity-70">
                Verses {startVerse} - {endVerse}
              </p>
              <p className="text-[10px] opacity-70">{currentReciter?.nameEnglish}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content Body ─── */}
      <main className="flex-1 pt-14 pb-28 px-4 max-w-md mx-auto w-full space-y-6">
        {/* ════════════════ TAB 1: SELECT ════════════════ */}
        {mobileTab === "select" && (
          <div className="space-y-6 mt-2">
            {/* Surah Selection */}
            <section className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-['Manrope'] text-[11px] font-bold text-[#d0c5b1] uppercase tracking-wider">
                  Surah
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#d0c5b1] w-4 h-4" />
                <input
                  type="text"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="Search by name or number..."
                  className="w-full bg-[#192029] border-b border-[#4d4637] py-3 pl-10 pr-4 rounded-xl text-xs text-[#dce3f0] placeholder:text-[#d0c5b1]/50 focus:border-[#eac65f] focus:outline-none"
                />
              </div>

              <div className="bg-[#151c25] rounded-xl border border-[#4d4637]/30 overflow-hidden max-h-52 overflow-y-auto">
                <div className="flex flex-col">
                  {filteredChapters.map((ch) => {
                    const isSelected = ch.id === chapterId;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setChapterId(ch.id);
                          setStartVerse(1);
                          setEndVerse(1);
                        }}
                        className={`flex items-center justify-between p-3.5 border-b border-[#4d4637]/20 cursor-pointer active:scale-[0.99] transition-all ${
                          isSelected
                            ? "active-gold-glow text-[#ffe39c]"
                            : "hover:bg-[#2e353f]/30 text-[#dce3f0]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-['Manrope'] text-xs font-bold w-5 ${
                              isSelected ? "text-[#ffe39c]" : "text-[#d0c5b1]"
                            }`}
                          >
                            {ch.id}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              isSelected ? "text-[#ffe39c] font-bold" : "text-[#dce3f0]"
                            }`}
                          >
                            {ch.name_simple}
                          </span>
                        </div>
                        <span
                          className={`font-['Amiri_Quran'] text-lg leading-none ${
                            isSelected ? "text-[#ffe39c]" : "text-[#dce3f0]"
                          }`}
                        >
                          {ch.name_arabic}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Range Selectors */}
            <section className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-['Manrope'] text-[11px] font-bold text-[#d0c5b1] uppercase tracking-wider block mb-2">
                  From
                </span>
                <input
                  type="number"
                  min={1}
                  max={currentChapter?.verses_count || 286}
                  value={startVerse}
                  onChange={(e) =>
                    setStartVerse(
                      Math.max(
                        1,
                        Math.min(currentChapter?.verses_count || 286, Number(e.target.value) || 1),
                      ),
                    )
                  }
                  className="w-full bg-[#192029] border-b border-[#4d4637] py-3 px-4 rounded-xl text-center font-bold text-[#ffe39c] text-sm focus:border-[#eac65f] focus:outline-none"
                />
              </div>
              <div>
                <span className="font-['Manrope'] text-[11px] font-bold text-[#d0c5b1] uppercase tracking-wider block mb-2">
                  To
                </span>
                <input
                  type="number"
                  min={1}
                  max={currentChapter?.verses_count || 286}
                  value={endVerse}
                  onChange={(e) =>
                    setEndVerse(
                      Math.max(
                        1,
                        Math.min(currentChapter?.verses_count || 286, Number(e.target.value) || 1),
                      ),
                    )
                  }
                  className="w-full bg-[#192029] border-b border-[#4d4637] py-3 px-4 rounded-xl text-center font-bold text-[#ffe39c] text-sm focus:border-[#eac65f] focus:outline-none"
                />
              </div>
            </section>

            {/* Verses Selection Display */}
            <section className="space-y-2">
              <span className="font-['Manrope'] text-[11px] font-bold text-[#d0c5b1] uppercase tracking-wider block">
                Verses · Tap to set range
              </span>
              <div className="bg-[#151c25] rounded-xl border border-[#4d4637]/30 overflow-hidden flex flex-col max-h-64 overflow-y-auto">
                {chapterVerses.length > 0 ? (
                  chapterVerses.map((v) => {
                    const lo = Math.min(startVerse, endVerse);
                    const hi = Math.max(startVerse, endVerse);
                    const inRange = v.verse_number >= lo && v.verse_number <= hi;
                    const isEndpoint = v.verse_number === startVerse || v.verse_number === endVerse;
                    return (
                      <div
                        key={v.verse_key}
                        onClick={() => {
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
                        className={`p-3.5 border-b border-[#4d4637]/10 cursor-pointer transition-all ${
                          isEndpoint
                            ? "bg-[#eac65f]/20 text-[#ffe39c]"
                            : inRange
                              ? "bg-[#eac65f]/10 text-[#ffe39c]"
                              : "hover:bg-[#2e353f]/20 text-[#dce3f0]"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={`font-['Manrope'] text-xs font-bold ${
                              inRange ? "text-[#ffe39c]" : "text-[#d0c5b1]/60"
                            }`}
                          >
                            {v.verse_number}
                          </span>
                          <div className="text-right flex-1 pr-3">
                            <p
                              className="font-['Amiri_Quran'] text-lg text-[#ffe39c] mb-1 leading-snug"
                              dir="rtl"
                            >
                              {v.text_uthmani}
                            </p>
                            {v.translations?.[0]?.text && (
                              <p className="text-xs text-[#d0c5b1]/80 line-clamp-2">
                                {v.translations[0].text.replace(/<[^>]+>/g, "")}
                              </p>
                            )}
                          </div>
                          {inRange && (
                            <CheckCircle2 className="w-5 h-5 text-[#ffe39c] shrink-0 fill-current" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-xs text-[#d0c5b1] text-center">
                    Loading verses for {currentChapter?.name_simple || "Surah"}...
                  </div>
                )}
              </div>
            </section>

            {/* Reciter Section */}
            <section className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-['Manrope'] text-[11px] font-bold text-[#d0c5b1] uppercase tracking-wider">
                  Reciter
                </span>
                <span className="text-[#4edea3] font-['Manrope'] text-[10px] font-bold uppercase tracking-wider">
                  View All
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                {RECITERS.map((r) => {
                  const isSelected = r.id === reciterId;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setReciterId(r.id)}
                      className={`flex-none w-32 rounded-2xl p-3 border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#192029] border-[#eac65f]/40 ring-1 ring-[#eac65f]/20"
                          : "bg-[#192029]/50 border-[#4d4637]/30 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden mb-2.5 relative bg-[#151c25]">
                        {r.image ? (
                          <img
                            src={r.image}
                            alt={r.nameEnglish}
                            className={`w-full h-full object-cover ${
                              isSelected ? "" : "grayscale"
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#2e353f] text-[#ffe39c] font-['Amiri_Quran'] text-2xl">
                            {r.nameArabic.slice(0, 2)}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute bottom-1 right-1">
                            <CheckCircle2 className="w-4 h-4 text-[#4edea3] bg-[#0d141d]/80 rounded-full fill-current" />
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-[11px] font-bold text-center leading-tight truncate ${
                          isSelected ? "text-[#ffe39c]" : "text-[#d0c5b1]"
                        }`}
                      >
                        {r.nameEnglish}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ════════════════ TAB 2: MEDIA ════════════════ */}
        {mobileTab === "media" && (
          <div className="space-y-6">
            {/* Top 9:16 Video Preview Card */}
            <section className="flex flex-col items-center space-y-3">
              <div className="flex justify-between items-center w-full">
                <span className="font-['Manrope'] text-[11px] font-bold text-[#d0c5b1] uppercase">
                  Preview
                </span>
                <span className="text-[10px] text-[#ffe39c] font-bold uppercase tracking-widest">
                  Active Selection
                </span>
              </div>
              {renderPreviewBox(false)}
            </section>

            {/* Background Selector */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-['Manrope'] text-[11px] font-bold text-[#d0c5b1] uppercase">
                  Background
                </span>
              </div>

              {/* Pexels Integration */}
              <div className="space-y-2 pt-2">
                <p className="text-[10px] uppercase tracking-wider text-[#d0c5b1]/80 font-bold">
                  Search Pexels Videos
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
              </div>

              {/* Upload Custom Video */}
              <label className="w-full py-4 border-2 border-dashed border-[#4d4637]/50 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-[#2e353f]/20 transition-colors cursor-pointer active:scale-[0.98]">
                <Upload className="w-5 h-5 text-[#ffe39c]" />
                <span className="text-xs font-bold text-[#d0c5b1] uppercase tracking-wider">
                  Upload video (MP4/MOV)
                </span>
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
            </section>
          </div>
        )}

        {/* ════════════════ TAB 3: STYLE ════════════════ */}
        {mobileTab === "style" && (
          <div className="space-y-6">
            {/* Top 9:16 Video Preview Card */}
            <section className="flex flex-col items-center space-y-3">
              <div className="flex justify-between items-center w-full">
                <span className="font-['Manrope'] text-[11px] font-bold text-[#d0c5b1] uppercase">
                  Preview
                </span>
                <span className="text-[10px] text-[#ffe39c] font-bold uppercase tracking-widest">
                  Active Selection
                </span>
              </div>
              {renderPreviewBox(false)}
            </section>

            {/* Accordion Style Settings */}
            <section className="space-y-3 pb-8">
              <div className="flex justify-between items-center mb-1">
                <span className="font-['Manrope'] text-[11px] font-bold text-[#d0c5b1] uppercase">
                  Style
                </span>
              </div>

              {/* 1. PRESET Accordion */}
              <div className="bg-[#192029] rounded-xl overflow-hidden border border-[#4d4637]/30">
                <button
                  onClick={() => setOpenAccordion(openAccordion === "preset" ? null : "preset")}
                  className="w-full px-4 py-3 flex justify-between items-center hover:bg-[#2e353f]/20 transition-colors"
                >
                  <span className="text-xs font-bold text-[#dce3f0] uppercase tracking-wider">
                    Preset
                  </span>
                  {openAccordion === "preset" ? (
                    <ChevronUp className="w-4 h-4 text-[#d0c5b1]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#d0c5b1]" />
                  )}
                </button>
                {openAccordion === "preset" && (
                  <div className="p-4 grid grid-cols-2 gap-2 border-t border-[#4d4637]/20 bg-[#151c25]">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p)}
                        className={`rounded-lg border px-3 py-2 text-xs transition ${
                          preset.id === p.id
                            ? "border-[#eac65f] bg-[#eac65f]/10 text-[#ffe39c]"
                            : "border-[#4d4637]/40 bg-[#192029] text-[#dce3f0] hover:bg-[#2e353f]"
                        }`}
                      >
                        <div
                          className="mb-1.5 h-4 rounded"
                          style={{
                            background: `linear-gradient(90deg, ${p.textColor}, ${p.highlightColor})`,
                          }}
                        />
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. TYPOGRAPHY Accordion */}
              <div className="bg-[#192029] rounded-xl overflow-hidden border border-[#eac65f]/30">
                <button
                  onClick={() =>
                    setOpenAccordion(openAccordion === "typography" ? null : "typography")
                  }
                  className="w-full px-4 py-3 flex justify-between items-center bg-[#eac65f]/5"
                >
                  <span className="text-xs font-bold text-[#ffe39c] uppercase tracking-wider">
                    Typography
                  </span>
                  {openAccordion === "typography" ? (
                    <ChevronUp className="w-4 h-4 text-[#ffe39c]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#ffe39c]" />
                  )}
                </button>
                {openAccordion === "typography" && (
                  <div className="p-4 space-y-5 border-t border-[#4d4637]/20 bg-[#151c25]">
                    {/* Arabic Font picker */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#d0c5b1] uppercase tracking-widest block">
                        Arabic Font
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setArabicFont("amiri")}
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition ${
                            arabicFont === "amiri"
                              ? "border-[#eac65f] bg-[#eac65f]/10 text-[#ffe39c]"
                              : "border-[#4d4637]/30 text-[#dce3f0] hover:bg-[#2e353f]/30"
                          }`}
                        >
                          <span className="font-['Amiri_Quran'] text-lg">بِسْمِ اللهِ</span>
                          <span className="text-[10px]">Amiri Quran</span>
                        </button>
                        <button
                          onClick={() => setArabicFont("zain")}
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition ${
                            arabicFont === "zain"
                              ? "border-[#eac65f] bg-[#eac65f]/10 text-[#ffe39c]"
                              : "border-[#4d4637]/30 text-[#dce3f0] hover:bg-[#2e353f]/30"
                          }`}
                        >
                          <span className="font-['Zain'] text-lg">بِسْمِ اللهِ</span>
                          <span className="text-[10px]">Zain</span>
                        </button>
                      </div>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-[#d0c5b1]">Words per screen</span>
                          <span className="text-[#ffe39c]">{wordsPerChunk}</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={8}
                          value={wordsPerChunk}
                          onChange={(e) => setWordsPerChunk(Number(e.target.value))}
                          className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer gold-slider-thumb accent-[#eac65f]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-[#d0c5b1]">Font size</span>
                          <span className="text-[#ffe39c]">{fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={72}
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer gold-slider-thumb accent-[#eac65f]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-[#d0c5b1]">Line spacing</span>
                          <span className="text-[#ffe39c]">{lineHeight.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={1.2}
                          max={2.6}
                          step={0.05}
                          value={lineHeight}
                          onChange={(e) => setLineHeight(Number(e.target.value))}
                          className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer gold-slider-thumb accent-[#eac65f]"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-[#d0c5b1]">Vertical position</span>
                          <span className="text-[#ffe39c]">{textY}%</span>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={80}
                          value={textY}
                          onChange={(e) => setTextY(Number(e.target.value))}
                          className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer gold-slider-thumb accent-[#eac65f]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. TEXT VISIBILITY Accordion */}
              <div className="bg-[#192029] rounded-xl overflow-hidden border border-[#4d4637]/30">
                <button
                  onClick={() =>
                    setOpenAccordion(openAccordion === "visibility" ? null : "visibility")
                  }
                  className="w-full px-4 py-3 flex justify-between items-center hover:bg-[#2e353f]/20 transition-colors"
                >
                  <span className="text-xs font-bold text-[#dce3f0] uppercase tracking-wider">
                    Text Visibility
                  </span>
                  {openAccordion === "visibility" ? (
                    <ChevronUp className="w-4 h-4 text-[#d0c5b1]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#d0c5b1]" />
                  )}
                </button>
                {openAccordion === "visibility" && (
                  <div className="p-4 space-y-3 border-t border-[#4d4637]/20 bg-[#151c25]">
                    <label className="flex items-center justify-between rounded-lg border border-[#4d4637]/30 bg-[#192029] px-3 py-2 text-xs">
                      <span className="text-[#d0c5b1]">Show Arabic</span>
                      <input
                        type="checkbox"
                        checked={showArabic}
                        onChange={(e) => setShowArabic(e.target.checked)}
                        className="h-4 w-4 accent-[#eac65f]"
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-[#4d4637]/30 bg-[#192029] px-3 py-2 text-xs">
                      <span className="text-[#d0c5b1]">Show translation</span>
                      <input
                        type="checkbox"
                        checked={showTranslation}
                        onChange={(e) => setShowTranslation(e.target.checked)}
                        className="h-4 w-4 accent-[#eac65f]"
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-[#4d4637]/30 bg-[#192029] px-3 py-2 text-xs">
                      <span className="text-[#d0c5b1]">Translation as main text</span>
                      <input
                        type="checkbox"
                        checked={translationAsMain}
                        onChange={(e) => setTranslationAsMain(e.target.checked)}
                        className="h-4 w-4 accent-[#eac65f]"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* 4. SURAH NAME Accordion */}
              <div className="bg-[#192029] rounded-xl overflow-hidden border border-[#4d4637]/30">
                <button
                  onClick={() => setOpenAccordion(openAccordion === "surah" ? null : "surah")}
                  className="w-full px-4 py-3 flex justify-between items-center hover:bg-[#2e353f]/20 transition-colors"
                >
                  <span className="text-xs font-bold text-[#dce3f0] uppercase tracking-wider">
                    Surah Name
                  </span>
                  {openAccordion === "surah" ? (
                    <ChevronUp className="w-4 h-4 text-[#d0c5b1]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#d0c5b1]" />
                  )}
                </button>
                {openAccordion === "surah" && (
                  <div className="p-4 space-y-4 border-t border-[#4d4637]/20 bg-[#151c25]">
                    <label className="flex items-center justify-between rounded-lg border border-[#4d4637]/30 bg-[#192029] px-3 py-2 text-xs">
                      <span className="text-[#d0c5b1]">Show surah name</span>
                      <input
                        type="checkbox"
                        checked={showSurahName}
                        onChange={(e) => setShowSurahName(e.target.checked)}
                        className="h-4 w-4 accent-[#eac65f]"
                      />
                    </label>
                    {showSurahName && (
                      <>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-[#d0c5b1]">Surah name size</span>
                            <span className="text-[#ffe39c]">{surahNameSize}px</span>
                          </div>
                          <input
                            type="range"
                            min={14}
                            max={96}
                            value={surahNameSize}
                            onChange={(e) => setSurahNameSize(Number(e.target.value))}
                            className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer gold-slider-thumb accent-[#eac65f]"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-[#d0c5b1]">Vertical position (Y)</span>
                            <span className="text-[#ffe39c]">{surahY}%</span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={98}
                            value={surahY}
                            onChange={(e) => setSurahY(Number(e.target.value))}
                            className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer gold-slider-thumb accent-[#eac65f]"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 5. COLORS Accordion */}
              <div className="bg-[#192029] rounded-xl overflow-hidden border border-[#4d4637]/30">
                <button
                  onClick={() => setOpenAccordion(openAccordion === "colors" ? null : "colors")}
                  className="w-full px-4 py-3 flex justify-between items-center hover:bg-[#2e353f]/20 transition-colors"
                >
                  <span className="text-xs font-bold text-[#dce3f0] uppercase tracking-wider">
                    Colors
                  </span>
                  {openAccordion === "colors" ? (
                    <ChevronUp className="w-4 h-4 text-[#d0c5b1]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#d0c5b1]" />
                  )}
                </button>
                {openAccordion === "colors" && (
                  <div className="p-4 space-y-3 border-t border-[#4d4637]/20 bg-[#151c25]">
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-[#4d4637]/30 bg-[#192029] px-3 py-2 text-xs">
                      <span className="text-[#d0c5b1]">Text</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="h-6 w-8 cursor-pointer rounded border border-[#4d4637] bg-transparent"
                        />
                        <input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-20 rounded border border-[#4d4637] bg-[#151c25] px-1.5 py-0.5 text-[11px] text-[#ffe39c] outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-[#4d4637]/30 bg-[#192029] px-3 py-2 text-xs">
                      <span className="text-[#d0c5b1]">Highlight</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={highlightColor}
                          onChange={(e) => setHighlightColor(e.target.value)}
                          className="h-6 w-8 cursor-pointer rounded border border-[#4d4637] bg-transparent"
                        />
                        <input
                          type="text"
                          value={highlightColor}
                          onChange={(e) => setHighlightColor(e.target.value)}
                          className="w-20 rounded border border-[#4d4637] bg-[#151c25] px-1.5 py-0.5 text-[11px] text-[#ffe39c] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. BACKGROUND FX Accordion */}
              <div className="bg-[#192029] rounded-xl overflow-hidden border border-[#4d4637]/30">
                <button
                  onClick={() => setOpenAccordion(openAccordion === "fx" ? null : "fx")}
                  className="w-full px-4 py-3 flex justify-between items-center hover:bg-[#2e353f]/20 transition-colors"
                >
                  <span className="text-xs font-bold text-[#dce3f0] uppercase tracking-wider">
                    Background FX
                  </span>
                  {openAccordion === "fx" ? (
                    <ChevronUp className="w-4 h-4 text-[#d0c5b1]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#d0c5b1]" />
                  )}
                </button>
                {openAccordion === "fx" && (
                  <div className="p-4 space-y-3 border-t border-[#4d4637]/20 bg-[#151c25]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-[#d0c5b1]">Overlay</span>
                        <span className="text-[#ffe39c]">{overlayOpacity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={overlayOpacity}
                        onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                        className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer gold-slider-thumb accent-[#eac65f]"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-[#d0c5b1]">Blur</span>
                        <span className="text-[#ffe39c]">{blur}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={blur}
                        onChange={(e) => setBlur(Number(e.target.value))}
                        className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer gold-slider-thumb accent-[#eac65f]"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-[#d0c5b1]">Brightness</span>
                        <span className="text-[#ffe39c]">{brightness.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.4}
                        max={1.4}
                        step={0.05}
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer gold-slider-thumb accent-[#eac65f]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ════════════════ TAB 4: SYNC ════════════════ */}
        {mobileTab === "sync" && (
          <div className="space-y-6">
            {/* Top Video Preview Box with Timeline Bar */}
            <section className="flex flex-col items-center space-y-3">
              {renderPreviewBox(true)}
            </section>

            {/* Playback Controls */}
            <section className="space-y-3">
              <div className="flex flex-col items-center gap-4 bg-[#192029] border border-[#4d4637] p-5 rounded-xl shadow-lg">
                <div className="w-full flex justify-between items-center text-xs font-['Manrope'] text-[#d0c5b1]">
                  <span>{formatMs(elapsedMs)}</span>
                  <span>{formatMs(totalDurationMs)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={totalDurationMs || 1}
                  value={elapsedMs}
                  onChange={(e) => {
                    const targetMs = Number(e.target.value);
                    setCurrentMs(targetMs);
                    if (audioRef.current) audioRef.current.currentTime = targetMs / 1000;
                  }}
                  className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer accent-[#ffe39c]"
                />

                <div className="flex items-center gap-8">
                  <button
                    onClick={() => {
                      const prev = Math.max(0, currentMs - 3000);
                      setCurrentMs(prev);
                      if (audioRef.current) audioRef.current.currentTime = prev / 1000;
                    }}
                    className="text-[#d0c5b1] hover:text-[#ffe39c] transition-colors active:scale-90"
                  >
                    <Rewind className="w-6 h-6" />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-[#eac65f] text-[#685200] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  >
                    {playing ? (
                      <Pause className="w-7 h-7 fill-current" />
                    ) : (
                      <Play className="w-7 h-7 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const next = Math.min(totalDurationMs, currentMs + 3000);
                      setCurrentMs(next);
                      if (audioRef.current) audioRef.current.currentTime = next / 1000;
                    }}
                    className="text-[#d0c5b1] hover:text-[#ffe39c] transition-colors active:scale-90"
                  >
                    <FastForward className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </section>

            {/* Start Trim / Skip Silence Card */}
            <section className="space-y-2">
              <div className="bg-[#192029] border border-[#4d4637] rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#d0c5b1]">
                    Video Start Trim (Skip Silence)
                  </span>
                  <span className="text-xs font-bold text-[#ffe39c]">
                    {startOffsetSec.toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={0.1}
                  value={startOffsetSec}
                  onChange={(e) => setStartOffsetSec(Number(e.target.value))}
                  className="w-full h-1 bg-[#2e353f] rounded-lg appearance-none cursor-pointer accent-[#eac65f]"
                />
                <div className="flex justify-between items-center text-[10px] text-[#d0c5b1]/80">
                  <button
                    onClick={() => {
                      if (activeIdx === 0 && currentMs > 0) {
                        setStartOffsetSec(Number((currentMs / 1000).toFixed(1)));
                      }
                    }}
                    className="px-2.5 py-1 rounded-md bg-[#2e353f] text-[#ffe39c] font-bold hover:bg-[#3d4552] transition-colors"
                  >
                    Set trim at current time ({(currentMs / 1000).toFixed(1)}s)
                  </button>
                  <button
                    onClick={() => setStartOffsetSec(0)}
                    className="px-2 py-1 rounded-md bg-[#2e353f] text-[#d0c5b1] hover:bg-[#3d4552] transition-colors"
                  >
                    Reset (0s)
                  </button>
                </div>
                {startOffsetSec > 0 && (
                  <p className="text-[10px] text-[#4edea3]">
                    ✓ Export will start at {startOffsetSec.toFixed(1)}s (trimmed length:{" "}
                    {formatMs(Math.max(0, totalDurationMs - startOffsetSec * 1000))})
                  </p>
                )}
              </div>
            </section>

            {/* Sync Controls Section */}
            <section className="space-y-4 pb-8">
              <div className="flex justify-between items-center px-1">
                <h2 className="font-['Manrope'] text-xs font-bold uppercase tracking-widest text-[#d0c5b1]">
                  Sync Controls
                </h2>
                <div className="flex items-center gap-3">
                  <span className="font-['Manrope'] text-xs text-[#d0c5b1] opacity-80">
                    Enable Word Sync
                  </span>
                  <button
                    onClick={() => setWordSyncEnabled(!wordSyncEnabled)}
                    className={`w-10 h-5 rounded-full relative flex items-center px-1 transition-colors ${
                      wordSyncEnabled ? "bg-[#00a572]" : "bg-[#2e353f]"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 bg-white rounded-full absolute transition-all ${
                        wordSyncEnabled ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sync Verse List */}
              <div className="flex flex-col gap-3">
                {clips.map((clip, clipIndex) => {
                  const verseSegs = clip.audio.segments;
                  const startMs = verseSegs[0]?.startMs || 0;
                  const endMs = verseSegs[verseSegs.length - 1]?.endMs || clip.audio.durationMs;

                  return (
                    <div
                      key={clip.verse_key}
                      className="bg-[#192029] border border-[#4d4637] rounded-xl p-4 flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-['Manrope'] text-[#4edea3] text-[10px] font-bold">
                            VERSE {clipIndex + 1}
                          </span>
                          <div
                            className="font-['Amiri_Quran'] text-2xl text-[#dce3f0] mt-1"
                            dir="rtl"
                          >
                            {clip.text_uthmani}
                          </div>
                        </div>
                        <span className="text-[#d0c5b1] text-xs font-['Manrope'] font-bold">
                          {clip.verse_key}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-['Manrope'] text-[#99907d] uppercase font-bold">
                            Start Time
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={(startMs / 1000).toFixed(2)}
                              onChange={(e) => {
                                const newSec = Number(e.target.value);
                                if (Number.isFinite(newSec) && verseSegs.length) {
                                  const updated = verseSegs.map((s, idx) =>
                                    idx === 0 ? { ...s, startMs: newSec * 1000 } : s,
                                  );
                                  setSegmentOverrides((prev) => ({
                                    ...prev,
                                    [clip.verse_key]: updated,
                                  }));
                                }
                              }}
                              className="bg-[#2e353f] border-none text-[#dce3f0] font-['Manrope'] text-xs w-full py-2 px-3 rounded focus:ring-1 focus:ring-[#ffe39c]"
                            />
                            <button
                              onClick={() => {
                                if (verseSegs.length) {
                                  const updated = verseSegs.map((s, idx) =>
                                    idx === 0 ? { ...s, startMs: Math.round(currentMs) } : s,
                                  );
                                  setSegmentOverrides((prev) => ({
                                    ...prev,
                                    [clip.verse_key]: updated,
                                  }));
                                }
                              }}
                              className="bg-[#ffe39c]/10 hover:bg-[#ffe39c]/20 text-[#ffe39c] border border-[#ffe39c]/30 font-['Manrope'] text-[10px] font-bold px-3 py-2 rounded transition-colors active:scale-95"
                            >
                              SET
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-['Manrope'] text-[#99907d] uppercase font-bold">
                            End Time
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={(endMs / 1000).toFixed(2)}
                              onChange={(e) => {
                                const newSec = Number(e.target.value);
                                if (Number.isFinite(newSec) && verseSegs.length) {
                                  const lastIdx = verseSegs.length - 1;
                                  const updated = verseSegs.map((s, idx) =>
                                    idx === lastIdx ? { ...s, endMs: newSec * 1000 } : s,
                                  );
                                  setSegmentOverrides((prev) => ({
                                    ...prev,
                                    [clip.verse_key]: updated,
                                  }));
                                }
                              }}
                              className="bg-[#2e353f] border-none text-[#dce3f0] font-['Manrope'] text-xs w-full py-2 px-3 rounded focus:ring-1 focus:ring-[#ffe39c]"
                            />
                            <button
                              onClick={() => {
                                if (verseSegs.length) {
                                  const lastIdx = verseSegs.length - 1;
                                  const updated = verseSegs.map((s, idx) =>
                                    idx === lastIdx ? { ...s, endMs: Math.round(currentMs) } : s,
                                  );
                                  setSegmentOverrides((prev) => ({
                                    ...prev,
                                    [clip.verse_key]: updated,
                                  }));
                                }
                              }}
                              className="bg-[#ffe39c]/10 hover:bg-[#ffe39c]/20 text-[#ffe39c] border border-[#ffe39c]/30 font-['Manrope'] text-[10px] font-bold px-3 py-2 rounded transition-colors active:scale-95"
                            >
                              SET
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ════════════════ TAB 5: PREVIEW ════════════════ */}
        {mobileTab === "preview" && (
          <div className="space-y-6">
            {/* Main Video Canvas */}
            <section className="flex flex-col items-center">{renderPreviewBox(true)}</section>

            {/* Selection Summary Card */}
            <section className="bg-[#192029] rounded-xl p-5 border border-[#4d4637] space-y-4">
              <h2 className="font-['Manrope'] text-xs font-bold text-[#d0c5b1] uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-[#ffe39c]" /> Selection Summary
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#d0c5b1]/70 font-['Manrope']">Surah</span>
                  <span className="text-[#ffe39c] font-bold">
                    {currentChapter?.name_simple || "Ya Seen"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#d0c5b1]/70 font-['Manrope']">Verses</span>
                  <span className="text-[#dce3f0] font-bold">
                    {startVerse} - {endVerse}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#d0c5b1]/70 font-['Manrope']">Reciter</span>
                  <span className="text-[#4edea3] font-bold flex items-center gap-1.5">
                    {currentReciter?.nameEnglish || "Mishari Alafasy"}{" "}
                    <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#4d4637]/30 pt-3">
                  <span className="text-[#d0c5b1]/70 font-['Manrope']">Format</span>
                  <span className="text-[#dce3f0]">1080x1920 (9:16)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#d0c5b1]/70 font-['Manrope']">Start Trim</span>
                  <span className="text-[#ffe39c] font-bold">
                    {startOffsetSec > 0 ? `Skip first ${startOffsetSec.toFixed(1)}s` : "0s (Full)"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#d0c5b1]/70 font-['Manrope']">Export Duration</span>
                  <span className="text-[#4edea3] font-bold">
                    {formatMs(Math.max(0, totalDurationMs - startOffsetSec * 1000))}
                  </span>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <section className="space-y-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="gold-gradient w-full py-4 rounded-full flex items-center justify-center gap-3 text-[#3d2f00] font-bold transition-all active:scale-95 shadow-lg shadow-[#eac65f]/20 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                <span className="font-['Manrope'] uppercase tracking-widest text-xs font-extrabold">
                  {exporting ? `Rendering... ${Math.round(exportProgress * 100)}%` : "Export Video"}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem(
                        "quran_shorts_draft",
                        JSON.stringify({ chapterId, startVerse, endVerse, reciterId, preset }),
                      );
                      triggerToast("Draft saved locally!");
                    } catch {
                      triggerToast("Failed to save draft.");
                    }
                  }}
                  className="flex items-center justify-center gap-2 border border-[#4d4637] py-3 rounded-full text-[#d0c5b1] font-['Manrope'] uppercase tracking-tight text-[11px] font-bold hover:bg-[#2e353f] transition-colors"
                >
                  <Bookmark className="w-4 h-4" /> Save Draft
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: "Quran Short",
                          text: `Quran recitation short - ${currentChapter?.name_simple}`,
                          url: window.location.href,
                        })
                        .catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      triggerToast("Share link copied to clipboard!");
                    }
                  }}
                  className="flex items-center justify-center gap-2 border border-[#4d4637] py-3 rounded-full text-[#d0c5b1] font-['Manrope'] uppercase tracking-tight text-[11px] font-bold hover:bg-[#2e353f] transition-colors"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </section>

            {/* Pro Status Banner */}
            <section className="flex items-start gap-3 p-4 bg-[#00a572]/10 border border-[#4edea3]/20 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-[#4edea3] shrink-0 mt-0.5" />
              <p className="text-xs text-[#d0c5b1] leading-relaxed">
                Rendering is optimized for <strong className="text-[#4edea3]">4K quality</strong>.
                High-fidelity audio normalization and Arabic ligatures have been pre-processed.
              </p>
            </section>
          </div>
        )}
      </main>

      {/* ─── Fixed Bottom Nav Bar ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-[#0d141d]/90 backdrop-blur-xl border-t border-[#4d4637]/40 px-2 py-2 rounded-t-2xl shadow-2xl">
        {(
          [
            { id: "select", label: "Select", icon: ListChecks },
            { id: "media", label: "Media", icon: Film },
            { id: "style", label: "Style", icon: Palette },
            { id: "sync", label: "Sync", icon: RefreshCw },
            { id: "preview", label: "Preview", icon: PlayCircle },
          ] as const
        ).map((tab) => {
          const isActive = mobileTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={
                isActive
                  ? "flex items-center gap-1.5 bg-[#eac65f] text-[#685200] rounded-full px-4 py-1.5 font-bold text-xs shadow-md transition-all scale-105"
                  : "flex flex-col items-center justify-center text-[#d0c5b1] hover:text-[#ffe39c] px-2.5 py-1 transition-all active:scale-95"
              }
            >
              <Icon className={isActive ? "w-4 h-4 fill-current" : "w-5 h-5 mb-0.5"} />
              <span className="font-['Manrope'] text-[10px] tracking-wide uppercase">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function formatMs(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
