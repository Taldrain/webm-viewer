import { page } from "fresh";
import { define } from "~/utils/define.ts";
import { PUBLIC_PATH } from "~/utils/env.ts";

import IslandViewer from "~/islands/viewer.tsx";

import { getRandomizeWebms } from "~/utils/webm.ts";

const webms: string[] = getRandomizeWebms();

function nextWebm(): string {
  if (webms.length === 0) {
    webms.push(...getRandomizeWebms());
  }
  return webms.pop()!;
}

export const handler = define.handlers({
  GET() {
    return page({ src: nextWebm() });
  },

  POST() {
    return new Response(JSON.stringify({ src: nextWebm() }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
});

export default define.page<typeof handler>(({ data }) => {
  const { src } = data;

  return (
    <div class="bg-black">
      <IslandViewer publicPath={PUBLIC_PATH} initWebm={src} />
    </div>
  );
});
