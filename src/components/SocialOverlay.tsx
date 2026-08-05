import React from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Music2,
  Search,
  Camera,
  ThumbsUp,
  ThumbsDown,
  Repeat,
  Plus,
  Send,
} from "lucide-react";

export type SocialPlatform = "none" | "tiktok" | "instagram" | "youtube" | "facebook";

interface SocialOverlayProps {
  platform: SocialPlatform;
  surahName?: string;
  verseRange?: string;
}

export const SocialOverlay: React.FC<SocialOverlayProps> = ({
  platform,
  surahName = "يس",
  verseRange = "1-3",
}) => {
  if (platform === "none") return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 select-none text-white font-sans">
      {/* TikTok Overlay */}
      {platform === "tiktok" && (
        <>
          {/* Top Bar */}
          <div className="flex items-center justify-between pt-1 px-2">
            <div className="w-6" />
            <div className="flex gap-4 text-xs font-semibold drop-shadow">
              <span className="opacity-60">Following</span>
              <span className="font-bold border-b-2 border-white pb-0.5">For You</span>
            </div>
            <Search className="w-5 h-5 drop-shadow" />
          </div>

          {/* Bottom & Right Content */}
          <div className="flex items-end justify-between pb-2">
            {/* Left Info */}
            <div className="flex-1 pr-3 space-y-1.5 drop-shadow-md">
              <div className="font-bold text-sm tracking-wide">@quran.recitations</div>
              <p className="text-xs line-clamp-2 leading-snug font-normal opacity-95">
                Surah {surahName} ({verseRange}) ✨ #quran #recitation #tilawat #islamic
              </p>
              <div className="flex items-center gap-2 text-[11px] opacity-80 pt-0.5">
                <Music2 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "6s" }} />
                <span className="truncate max-w-[180px]">Original Sound - Quran Tilawat</span>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="flex flex-col items-center gap-4 text-xs font-medium">
              {/* Profile Avatar */}
              <div className="relative mb-1">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-700 flex items-center justify-center font-bold text-sm shadow">
                  📖
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-rose-500 rounded-full p-0.5 text-white">
                  <Plus className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <Heart className="w-6 h-6 fill-white text-white" />
                </div>
                <span className="text-[10px] font-semibold">128.4K</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <MessageCircle className="w-6 h-6 fill-white text-white" />
                </div>
                <span className="text-[10px] font-semibold">1,420</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <Bookmark className="w-6 h-6 fill-amber-400 text-amber-400" />
                </div>
                <span className="text-[10px] font-semibold">8,910</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold">3,200</span>
              </div>

              {/* Spinning Record */}
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-900 to-gray-700 p-1 flex items-center justify-center border-2 border-white/40 animate-spin"
                style={{ animationDuration: "8s" }}
              >
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Instagram Reels Overlay */}
      {platform === "instagram" && (
        <>
          {/* Top Bar */}
          <div className="flex items-center justify-between pt-1 px-1">
            <span className="font-bold text-base tracking-tight drop-shadow">Reels</span>
            <Camera className="w-5 h-5 drop-shadow" />
          </div>

          {/* Bottom & Right Content */}
          <div className="flex items-end justify-between pb-2">
            {/* Left Info */}
            <div className="flex-1 pr-3 space-y-2 drop-shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/60 bg-emerald-800 flex items-center justify-center text-xs font-bold shadow">
                  ☪️
                </div>
                <span className="font-semibold text-xs">quran_verses</span>
                <span className="text-[10px] border border-white/80 rounded px-2 py-0.5 font-semibold">
                  Follow
                </span>
              </div>
              <p className="text-xs line-clamp-2 opacity-95">
                Surah {surahName} ({verseRange}) 📖
              </p>
              <div className="flex items-center gap-1.5 text-[10px] opacity-85">
                <Music2 className="w-3 h-3" />
                <span className="truncate max-w-[160px]">quran_verses • Original audio</span>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="flex flex-col items-center gap-4 text-xs font-medium">
              <div className="flex flex-col items-center gap-1">
                <Heart className="w-6 h-6 text-white" />
                <span className="text-[10px]">84.2K</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <MessageCircle className="w-6 h-6 text-white" />
                <span className="text-[10px]">912</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <Send className="w-6 h-6 text-white" />
                <span className="text-[10px]">12.5K</span>
              </div>

              <Bookmark className="w-5 h-5 text-white" />
              <MoreVertical className="w-5 h-5 text-white" />

              <div className="w-6 h-6 rounded border border-white/80 bg-gray-800 flex items-center justify-center text-[8px] font-bold">
                🎵
              </div>
            </div>
          </div>
        </>
      )}

      {/* YouTube Shorts Overlay */}
      {platform === "youtube" && (
        <>
          {/* Top Bar */}
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> Shorts
            </div>
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 drop-shadow" />
              <MoreVertical className="w-5 h-5 drop-shadow" />
            </div>
          </div>

          {/* Bottom & Right Content */}
          <div className="flex items-end justify-between pb-2">
            {/* Left Info */}
            <div className="flex-1 pr-3 space-y-2 drop-shadow-md">
              <p className="text-xs font-medium line-clamp-2 leading-tight">
                Surah {surahName} Ayat {verseRange} #Shorts #Quran
              </p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-red-700 flex items-center justify-center text-xs font-bold">
                  🕌
                </div>
                <span className="font-bold text-xs">@QuranChannel</span>
                <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Subscribe
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                <Music2 className="w-3 h-3" />
                <span className="truncate max-w-[150px]">Original audio - QuranChannel</span>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="flex flex-col items-center gap-4 text-xs font-medium">
              <div className="flex flex-col items-center gap-0.5">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <ThumbsUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px]">245K</span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <ThumbsDown className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px]">Dislike</span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px]">3.1K</span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px]">Share</span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <Repeat className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px]">Remix</span>
              </div>

              <div className="w-7 h-7 rounded-md bg-gray-800 border border-white/50 flex items-center justify-center text-[10px]">
                🎵
              </div>
            </div>
          </div>
        </>
      )}

      {/* Facebook Reels Overlay */}
      {platform === "facebook" && (
        <>
          {/* Top Bar */}
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                f
              </div>
              <span className="font-bold text-sm tracking-tight drop-shadow">Reels</span>
            </div>
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 drop-shadow" />
              <Camera className="w-5 h-5 drop-shadow" />
            </div>
          </div>

          {/* Bottom & Right Content */}
          <div className="flex items-end justify-between pb-2">
            {/* Left Info */}
            <div className="flex-1 pr-3 space-y-1.5 drop-shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-blue-400 bg-blue-900 flex items-center justify-center text-xs font-bold">
                  ✨
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs">Daily Quran Recitations</span>
                    <span className="text-blue-400 text-xs font-bold">· Follow</span>
                  </div>
                </div>
              </div>
              <p className="text-xs line-clamp-2 leading-snug">
                Surah {surahName} ({verseRange}) - Beautiful Recitation
              </p>
              <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                <Music2 className="w-3 h-3" />
                <span className="truncate max-w-[160px]">Original Audio - Daily Quran</span>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="flex flex-col items-center gap-4 text-xs font-medium">
              <div className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <ThumbsUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px]">52K</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px]">820</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="p-2 rounded-full bg-black/20 backdrop-blur-xs">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px]">1.8K</span>
              </div>

              <MoreVertical className="w-5 h-5 text-white" />

              <div className="w-7 h-7 rounded-full bg-gray-900 border border-white/50 flex items-center justify-center text-[10px]">
                🎶
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
