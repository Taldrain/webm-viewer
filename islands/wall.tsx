import { useEffect, useRef, useState } from "preact/hooks";
import { isGif } from "~/utils/path.ts";

type WallIslandProps = {
  publicPath: string;
  initWebms: string[];
};

// All values are percentages of the viewport.
type Rect = { x: number; y: number; w: number; h: number };
type Tile = { id: number; rect: Rect; src: string };

const TARGET_TILE_AREA = 480 * 360;
const MIN_TILES = 2;
const MAX_TILES = 24;
// Videos have no controls on this page, so keep unmuted playback quiet.
const DEFAULT_VOLUME = 0.3;
// Gifs loop forever and never fire "ended", so rotate them after a
// randomized delay instead.
const GIF_MIN_MS = 8_000;
const GIF_MAX_MS = 20_000;

// Recursively split a rect into n rects with randomized cut positions.
// The cut orientation is biased by the rect's on-screen aspect ratio so
// tiles stay roughly watchable, but never deterministic.
function splitRect(rect: Rect, n: number, viewportAspect: number, out: Rect[]) {
  if (n <= 1) {
    out.push(rect);
    return;
  }

  const aspect = (rect.w / rect.h) * viewportAspect;
  const vertical = Math.random() < (aspect >= 1 ? 0.85 : 0.15);
  const ratio = 0.35 + Math.random() * 0.3;
  const nFirst = Math.min(n - 1, Math.max(1, Math.round(n * ratio)));

  if (vertical) {
    const w = rect.w * ratio;
    splitRect({ ...rect, w }, nFirst, viewportAspect, out);
    splitRect(
      { ...rect, x: rect.x + w, w: rect.w - w },
      n - nFirst,
      viewportAspect,
      out,
    );
  } else {
    const h = rect.h * ratio;
    splitRect({ ...rect, h }, nFirst, viewportAspect, out);
    splitRect(
      { ...rect, y: rect.y + h, h: rect.h - h },
      n - nFirst,
      viewportAspect,
      out,
    );
  }
}

function buildLayout(width: number, height: number): Rect[] {
  const count = Math.max(
    MIN_TILES,
    Math.min(MAX_TILES, Math.round((width * height) / TARGET_TILE_AREA)),
  );
  const rects: Rect[] = [];
  splitRect({ x: 0, y: 0, w: 100, h: 100 }, count, width / height, rects);
  return rects;
}

function GifTile({ src, onDone }: { src: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(
      onDone,
      GIF_MIN_MS + Math.random() * (GIF_MAX_MS - GIF_MIN_MS),
    );
    return () => clearTimeout(timer);
  }, []);

  return <img className="h-full w-full object-cover" src={src} />;
}

export default function WallIsland({ publicPath, initWebms }: WallIslandProps) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const tilesRef = useRef<Tile[]>([]);
  const pool = useRef<string[]>([...initWebms]);
  const nextId = useRef(0);

  const applyTiles = (next: Tile[]) => {
    tilesRef.current = next;
    setTiles(next);
  };

  const refill = async (count: number) => {
    const res = await fetch(`${publicPath}wall`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    const { srcs } = await res.json();
    pool.current.push(...srcs);
  };

  const takeSrc = async (): Promise<string> => {
    if (pool.current.length === 0) {
      await refill(MAX_TILES);
    }
    return pool.current.pop()!;
  };

  // Rebuild the whole grid. Surviving tiles keep their id/src (so their
  // video keeps playing, only its rect moves); `fresh` discards everything.
  const relayout = async (fresh = false) => {
    const rects = buildLayout(globalThis.innerWidth, globalThis.innerHeight);
    const prev = fresh ? [] : tilesRef.current;
    const missing = Math.max(0, rects.length - prev.length);
    if (pool.current.length < missing) {
      await refill(missing + MAX_TILES);
    }
    applyTiles(
      rects.map((rect, i) =>
        prev[i]
          ? { ...prev[i], rect }
          : { id: nextId.current++, rect, src: pool.current.pop()! }
      ),
    );
  };

  const replaceTile = async (id: number) => {
    const src = await takeSrc();
    applyTiles(
      tilesRef.current.map((tile) =>
        tile.id === id ? { id: nextId.current++, rect: tile.rect, src } : tile
      ),
    );
  };

  useEffect(() => {
    relayout();
    let timer: number | undefined;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => relayout(), 250);
    };
    globalThis.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      globalThis.removeEventListener("resize", onResize);
    };
  }, []);

  const unmute = (e: MouseEvent) => {
    const video = e.currentTarget as HTMLVideoElement;
    video.volume = DEFAULT_VOLUME;
    video.muted = false;
    // If the browser refuses audible playback (no user gesture yet),
    // fall back to muted so the video keeps playing.
    video.play().catch(() => {
      video.muted = true;
      video.play();
    });
  };

  const mute = (e: MouseEvent) => {
    const video = e.currentTarget as HTMLVideoElement;
    video.muted = true;
    video.play().catch(() => {});
  };

  return (
    <>
      <div className="fixed inset-0 overflow-hidden bg-black select-none">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className="absolute"
            style={{
              left: `${tile.rect.x}%`,
              top: `${tile.rect.y}%`,
              width: `${tile.rect.w}%`,
              height: `${tile.rect.h}%`,
            }}
          >
            {isGif(tile.src)
              ? (
                <GifTile
                  src={`${publicPath}${tile.src}`}
                  onDone={() => replaceTile(tile.id)}
                />
              )
              : (
                <video
                  className="h-full w-full object-cover"
                  src={`${publicPath}${tile.src}`}
                  autoPlay
                  muted
                  playsInline
                  onEnded={() => replaceTile(tile.id)}
                  onMouseEnter={unmute}
                  onMouseLeave={mute}
                  onClick={unmute}
                />
              )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => relayout(true)}
        className="fixed left-4 bottom-4 rounded-full bg-gray-600 p-2 text-white shadow-sm focus:outline-none opacity-40 hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </>
  );
}
