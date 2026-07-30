import { createServerFn } from "@tanstack/react-start";

export interface PexelsVideoResult {
  id: number;
  kind: "video";
  url: string; // best 9:16 mp4
  poster: string;
  width: number;
  height: number;
  duration: number;
  photographer: string;
  pexelsUrl: string;
}

export interface PexelsImageResult {
  id: number;
  kind: "image";
  url: string; // large portrait jpg
  poster: string;
  width: number;
  height: number;
  photographer: string;
  pexelsUrl: string;
}

export type PexelsResult = PexelsVideoResult | PexelsImageResult;

interface PexelsResponse {
  results: PexelsResult[];
  page: number;
  hasMore: boolean;
}

interface PexelsVideoFile {
  link: string;
  file_type: string;
  width: number | null;
  height: number | null;
  quality: string;
}

interface PexelsVideoItem {
  id: number;
  width: number;
  height: number;
  duration: number;
  url: string;
  user: { name: string };
  video_files: PexelsVideoFile[];
  video_pictures: { picture: string }[];
}

interface PexelsPhotoItem {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  src: { portrait: string; large2x: string; large: string; medium: string };
}

function pickBestVideoFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
  const mp4 = files.filter((f) => f.file_type === "video/mp4" && f.width && f.height);
  if (!mp4.length) return null;
  // Prefer portrait, then closest to 1920 height, capped (no 4K for bandwidth)
  mp4.sort((a, b) => {
    const ap = (a.height ?? 0) >= (a.width ?? 0) ? 1 : 0;
    const bp = (b.height ?? 0) >= (b.width ?? 0) ? 1 : 0;
    if (ap !== bp) return bp - ap;
    const aScore = Math.abs((a.height ?? 0) - 1920) + ((a.height ?? 0) > 2200 ? 2000 : 0);
    const bScore = Math.abs((b.height ?? 0) - 1920) + ((b.height ?? 0) > 2200 ? 2000 : 0);
    return aScore - bScore;
  });
  return mp4[0];
}

export const searchPexels = createServerFn({ method: "GET" })
  .inputValidator(
    (data: { query: string; type: "video" | "image"; page?: number; perPage?: number }) => ({
      query: String(data.query || "").slice(0, 100),
      type: data.type === "image" ? ("image" as const) : ("video" as const),
      page: Math.max(1, Math.min(50, Number(data.page) || 1)),
      perPage: Math.max(1, Math.min(40, Number(data.perPage) || 20)),
    }),
  )
  .handler(async ({ data }): Promise<PexelsResponse> => {
    const key = process.env.PEXELS_API_KEY;
    if (!key) throw new Error("PEXELS_API_KEY not configured");
    const { query, type, page, perPage } = data;
    if (!query.trim()) return { results: [], page, hasMore: false };

    const endpoint =
      type === "video"
        ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=${perPage}&page=${page}`
        : `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&size=large&per_page=${perPage}&page=${page}`;

    const res = await fetch(endpoint, { headers: { Authorization: key } });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Pexels ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      videos?: PexelsVideoItem[];
      photos?: PexelsPhotoItem[];
      next_page?: string;
    };

    let results: PexelsResult[] = [];
    if (type === "video" && json.videos) {
      results = json.videos
        .map((v): PexelsVideoResult | null => {
          const file = pickBestVideoFile(v.video_files);
          if (!file) return null;
          return {
            id: v.id,
            kind: "video",
            url: file.link,
            poster: v.video_pictures[0]?.picture ?? "",
            width: file.width ?? v.width,
            height: file.height ?? v.height,
            duration: v.duration,
            photographer: v.user?.name ?? "Pexels",
            pexelsUrl: v.url,
          };
        })
        .filter((x): x is PexelsVideoResult => x !== null);
    } else if (type === "image" && json.photos) {
      results = json.photos.map((p): PexelsImageResult => ({
        id: p.id,
        kind: "image",
        url: p.src.portrait || p.src.large2x || p.src.large,
        poster: p.src.medium || p.src.large,
        width: p.width,
        height: p.height,
        photographer: p.photographer,
        pexelsUrl: p.url,
      }));
    }

    return { results, page, hasMore: Boolean(json.next_page) };
  });
