import { page } from "fresh";
import { define } from "~/utils/define.ts";
import { PUBLIC_PATH } from "~/utils/env.ts";

import IslandWall from "~/islands/wall.tsx";

import { getRandomizeWebms } from "~/utils/webm.ts";

const webms: string[] = getRandomizeWebms();

function nextWebms(count: number): string[] {
  const out: string[] = [];
  while (out.length < count) {
    if (webms.length === 0) {
      webms.push(...getRandomizeWebms());
    }
    out.push(webms.pop()!);
  }
  return out;
}

export const handler = define.handlers({
  GET() {
    return page({ srcs: nextWebms(30) });
  },

  async POST(ctx) {
    const { count } = await ctx.req.json().catch(() => ({ count: 1 }));
    const srcs = nextWebms(Math.min(Math.max(Number(count) || 1, 1), 60));
    return new Response(JSON.stringify({ srcs }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});

export default define.page<typeof handler>(({ data }) => {
  const { srcs } = data;

  return (
    <div class="bg-black">
      <IslandWall publicPath={PUBLIC_PATH} initWebms={srcs} />
    </div>
  );
});
