import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchPexels, type PexelsResult } from "@/lib/pexels.functions";

const PRESET_QUERIES = [
  "mosque night",
  "ocean waves",
  "rain window",
  "clouds sky",
  "stars galaxy",
  "mountains sunset",
  "desert dunes",
  "forest mist",
  "candle light",
  "calligraphy",
];

export function PexelsBrowser({
  onPick,
  selectedId,
}: {
  onPick: (r: PexelsResult) => void;
  selectedId?: number | null;
}) {
  const [query, setQuery] = useState("mosque night");
  const [committed, setCommitted] = useState("mosque night");
  const [type, setType] = useState<"video" | "image">("video");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [committed, type]);

  const search = useServerFn(searchPexels);
  const q = useQuery({
    queryKey: ["pexels", type, committed, page],
    queryFn: () => search({ data: { query: committed, type, page, perPage: 18 } }),
    enabled: committed.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setCommitted(query);
        }}
        className="flex gap-1.5"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Pexels…"
          className="flex-1 rounded-md border border-border bg-input/60 px-2.5 py-1.5 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/60"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go
        </button>
      </form>

      <div className="flex items-center gap-1 rounded-md bg-secondary/60 p-0.5 text-[11px]">
        {(["video", "image"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 rounded px-2 py-1 transition ${
              type === t
                ? "bg-primary/20 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "video" ? "Videos" : "Photos"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {PRESET_QUERIES.map((p) => (
          <button
            key={p}
            onClick={() => {
              setQuery(p);
              setCommitted(p);
            }}
            className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
              committed === p
                ? "border-primary/60 bg-primary/15 text-foreground"
                : "border-border/60 bg-surface/40 text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="scroll-thin max-h-72 overflow-y-auto rounded-md border border-border/50 p-1.5">
        {q.isLoading && (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] animate-pulse rounded bg-surface/60" />
            ))}
          </div>
        )}
        {q.isError && (
          <p className="p-2 text-[11px] text-destructive">
            {(q.error as Error)?.message ?? "Search failed"}
          </p>
        )}
        {q.data && q.data.results.length === 0 && (
          <p className="p-2 text-[11px] text-muted-foreground">No results.</p>
        )}
        {q.data && q.data.results.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {q.data.results.map((r) => (
              <button
                key={`${r.kind}-${r.id}`}
                onClick={() => onPick(r)}
                title={`Photo by ${r.photographer} on Pexels`}
                className={`group relative aspect-[9/16] overflow-hidden rounded border transition ${
                  selectedId === r.id
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border/60 hover:border-border"
                }`}
              >
                <img
                  src={r.poster || (r.kind === "image" ? r.url : "")}
                  alt={r.photographer}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {r.kind === "video" && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">
                    ▶ {Math.round(r.duration)}s
                  </span>
                )}
                <span className="absolute top-1 right-1 rounded bg-black/60 px-1 text-[8px] text-white opacity-0 transition group-hover:opacity-100">
                  {r.photographer}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {q.data && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Page {q.data.page} · via Pexels</span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-border/60 px-2 py-0.5 disabled:opacity-40 hover:bg-secondary/50"
            >
              ←
            </button>
            <button
              disabled={!q.data.hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-border/60 px-2 py-0.5 disabled:opacity-40 hover:bg-secondary/50"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
