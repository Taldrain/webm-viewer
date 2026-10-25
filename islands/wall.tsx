import { useEffect, useRef, useState } from "preact/hooks";
import { isGif } from "~/utils/path.ts";

type WallIslandProps = {
  publicPath: string;
  initWebms: string[];
};

// All values are percentages of the viewport.
type Rect = { x: number; y: number; w: number; h: number };
type Tile = { id: number; rect: Rect; src: string };

// The wall is a tree of cuts: a split divides its rect in two at `ratio`,
// a leaf is a tile. Rects are derived from the tree, so moving a cut
// resizes the tiles under it without reordering them.
type Leaf = { kind: "leaf"; id: number; src: string };
type Split = {
  kind: "split";
  vertical: boolean;
  ratio: number;
  a: Cell;
  b: Cell;
};
type Cell = Leaf | Split;
type Side = "a" | "b";

// What happens when a tile ends: "swap" puts a new file in its place,
// "add" splits its place between two new files, "remove" hands its place
// to its neighbour, "move" swaps it and shifts a nearby cut.
type Change = "swap" | "add" | "remove" | "move";

const FULL: Rect = { x: 0, y: 0, w: 100, h: 100 };
const TARGET_TILE_AREA = 480 * 360;
const MIN_TILES = 2;
const MAX_TILES = 24;
// A change may not shrink a tile below this many pixels on either side.
const MIN_TILE_PX = 160;
// How often a tile ending rearranges the wall instead of a plain swap.
const REARRANGE_CHANCE = 1 / 3;
// Moved cuts stay at least this far from the edges of their rect.
const MIN_RATIO = 0.2;
// Videos have no controls on this page, so keep unmuted playback quiet.
const DEFAULT_VOLUME = 0.3;
// Gifs loop forever and never fire "ended", so rotate them after a
// randomized delay instead.
const GIF_MIN_MS = 8_000;
const GIF_MAX_MS = 20_000;

function targetCount(width: number, height: number): number {
  return Math.max(
    MIN_TILES,
    Math.min(MAX_TILES, Math.round((width * height) / TARGET_TILE_AREA)),
  );
}

function cut(rect: Rect, vertical: boolean, ratio: number): [Rect, Rect] {
  if (vertical) {
    const w = rect.w * ratio;
    return [{ ...rect, w }, { ...rect, x: rect.x + w, w: rect.w - w }];
  }
  const h = rect.h * ratio;
  return [{ ...rect, h }, { ...rect, y: rect.y + h, h: rect.h - h }];
}

// The cut orientation is biased by the rect's on-screen aspect ratio so
// tiles stay roughly watchable, but never deterministic.
function randomCut(rect: Rect, viewportAspect: number) {
  const aspect = (rect.w / rect.h) * viewportAspect;
  return {
    vertical: Math.random() < (aspect >= 1 ? 0.85 : 0.15),
    ratio: 0.35 + Math.random() * 0.3,
  };
}

// Recursively split a rect into n leaves with randomized cut positions.
function buildTree(
  rect: Rect,
  n: number,
  viewportAspect: number,
  leaf: () => Leaf,
): Cell {
  if (n <= 1) {
    return leaf();
  }

  const { vertical, ratio } = randomCut(rect, viewportAspect);
  const nFirst = Math.min(n - 1, Math.max(1, Math.round(n * ratio)));
  const [a, b] = cut(rect, vertical, ratio);
  return {
    kind: "split",
    vertical,
    ratio,
    a: buildTree(a, nFirst, viewportAspect, leaf),
    b: buildTree(b, n - nFirst, viewportAspect, leaf),
  };
}

function collectTiles(cell: Cell, rect: Rect, out: Tile[] = []): Tile[] {
  if (cell.kind === "leaf") {
    out.push({ id: cell.id, rect, src: cell.src });
  } else {
    const [a, b] = cut(rect, cell.vertical, cell.ratio);
    collectTiles(cell.a, a, out);
    collectTiles(cell.b, b, out);
  }
  return out;
}

function pathTo(cell: Cell, id: number): Side[] | null {
  if (cell.kind === "leaf") {
    return cell.id === id ? [] : null;
  }
  for (const side of ["a", "b"] as const) {
    const rest = pathTo(cell[side], id);
    if (rest) {
      return [side, ...rest];
    }
  }
  return null;
}

function getAt(cell: Cell, path: Side[]): Cell {
  return path.reduce((c, side) => (c as Split)[side], cell);
}

function setAt(cell: Cell, path: Side[], value: Cell): Cell {
  if (path.length === 0) {
    return value;
  }
  const split = cell as Split;
  const [side, ...rest] = path;
  return side === "a"
    ? { ...split, a: setAt(split.a, rest, value) }
    : { ...split, b: setAt(split.b, rest, value) };
}

// Rearrange only sometimes, leaning towards add or remove depending on how
// far the tile count drifted from what the viewport calls for. A swap
// always applies, so it is the fallback.
function planChanges(count: number, target: number): Change[] {
  if (Math.random() >= REARRANGE_CHANCE) {
    return ["swap"];
  }
  const drift = count - target;
  const recount: Change = Math.random() < 0.5 + drift * 0.15 ? "remove" : "add";
  return Math.random() < 0.5
    ? [recount, "move", "swap"]
    : ["move", recount, "swap"];
}

// Apply `change` around the ended leaf at `path`, or return null when it
// does not apply. `fresh` hands out leaves for new files.
function applyChange(
  tree: Cell,
  path: Side[],
  change: Change,
  rect: Rect,
  count: number,
  viewportAspect: number,
  fresh: () => Leaf,
): Cell | null {
  switch (change) {
    case "swap":
      return setAt(tree, path, fresh());
    case "add":
      if (count >= MAX_TILES) {
        return null;
      }
      return setAt(tree, path, {
        kind: "split",
        ...randomCut(rect, viewportAspect),
        a: fresh(),
        b: fresh(),
      });
    case "remove": {
      if (count <= MIN_TILES || path.length === 0) {
        return null;
      }
      const parent = path.slice(0, -1);
      const other = path[path.length - 1] === "a" ? "b" : "a";
      return setAt(tree, parent, getAt(tree, [...parent, other]));
    }
    case "move": {
      if (path.length === 0) {
        return null;
      }
      // Shift the parent cut or one a bit higher up: the higher it is, the
      // more neighbours get resized.
      const level = 1 + Math.floor(Math.random() * Math.min(3, path.length));
      const at = path.slice(0, path.length - level);
      const swapped = setAt(tree, path, fresh());
      const split = getAt(swapped, at) as Split;
      const shift = (0.1 + Math.random() * 0.15) *
        (Math.random() < 0.5 ? -1 : 1);
      let ratio = split.ratio + shift;
      if (ratio < MIN_RATIO || ratio > 1 - MIN_RATIO) {
        ratio = split.ratio - shift;
      }
      return setAt(swapped, at, { ...split, ratio });
    }
  }
}

// A change may not shrink a tile below MIN_TILE_PX, nor create one that
// small. Tiles already under it (e.g. after a resize) may stay as they are.
function fits(next: Tile[], prev: Tile[], width: number, height: number) {
  const before = new Map(prev.map((tile) => [tile.id, tile.rect]));
  return next.every(({ id, rect }) => {
    if (
      (rect.w * width) / 100 >= MIN_TILE_PX &&
      (rect.h * height) / 100 >= MIN_TILE_PX
    ) {
      return true;
    }
    const old = before.get(id);
    return old !== undefined && rect.w >= old.w && rect.h >= old.h;
  });
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
  const treeRef = useRef<Cell | null>(null);
  const tilesRef = useRef<Tile[]>([]);
  const pool = useRef<string[]>([...initWebms]);
  const nextId = useRef(0);

  // Tiles are kept in id order so a tree change never moves a surviving
  // tile in the DOM; they are absolutely positioned anyway.
  const commit = (tree: Cell, next = collectTiles(tree, FULL)) => {
    next.sort((a, b) => a.id - b.id);
    treeRef.current = tree;
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

  // Build a brand new wall, discarding every tile.
  const shuffle = async () => {
    const width = globalThis.innerWidth;
    const height = globalThis.innerHeight;
    const count = targetCount(width, height);
    if (pool.current.length < count) {
      await refill(count + MAX_TILES);
    }
    commit(
      buildTree(FULL, count, width / height, () => ({
        kind: "leaf",
        id: nextId.current++,
        src: pool.current.pop()!,
      })),
    );
  };

  const onTileEnd = async (id: number) => {
    // An "add" takes two new files.
    if (pool.current.length < 2) {
      await refill(MAX_TILES);
    }
    const tree = treeRef.current;
    const path = tree && pathTo(tree, id);
    // The tile is gone if the wall was shuffled while fetching.
    if (!tree || !path) {
      return;
    }

    const prev = tilesRef.current;
    const rect = prev.find((tile) => tile.id === id)!.rect;
    const width = globalThis.innerWidth;
    const height = globalThis.innerHeight;
    for (const change of planChanges(prev.length, targetCount(width, height))) {
      let used = 0;
      const fresh = (): Leaf => ({
        kind: "leaf",
        id: nextId.current++,
        src: pool.current[pool.current.length - 1 - used++],
      });
      const next = applyChange(
        tree,
        path,
        change,
        rect,
        prev.length,
        width / height,
        fresh,
      );
      if (!next) {
        continue;
      }
      const nextTiles = collectTiles(next, FULL);
      if (change !== "swap" && !fits(nextTiles, prev, width, height)) {
        continue;
      }
      // Only now consume the files the change actually used.
      pool.current.length -= used;
      commit(next, nextTiles);
      return;
    }
  };

  useEffect(() => {
    // Rects are percentages, so a resize just stretches the wall; the tile
    // count drifts back towards the new target as tiles end.
    shuffle();
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
            className="absolute transition-[left,top,width,height] duration-700 ease-in-out"
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
                  onDone={() => onTileEnd(tile.id)}
                />
              )
              : (
                <video
                  className="h-full w-full object-cover"
                  src={`${publicPath}${tile.src}`}
                  autoPlay
                  muted
                  playsInline
                  onEnded={() => onTileEnd(tile.id)}
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
        onClick={shuffle}
        className="fixed left-4 bottom-4 rounded-full bg-[#FF6A3D] p-2 text-white shadow-sm cursor-pointer focus:outline-none opacity-40 hover:opacity-100"
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
