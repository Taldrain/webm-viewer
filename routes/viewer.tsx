import { Handlers, PageProps } from "$fresh/server.ts";
import { PUBLIC_PATH } from "~/utils/env.ts";

import IslandViewer from "~/islands/viewer.tsx";

import { getRandomizeWebms } from "~/utils/webm.ts";

const webms: string[] = getRandomizeWebms();

export const handler: Handlers = {
  GET(_req, ctx) {
    const webm = webms.pop();
    return ctx.render({ src: webm });
  },

  POST() {
    const webm = webms.pop();
    if (webms.length === 0) {
      webms.push(...getRandomizeWebms());
    }

    return new Response(JSON.stringify({ src: webm }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

export default function Viewer({ data }: PageProps<{ src: string }>) {
  const { src } = data;

  return (
    <div className="bg-black">
      <IslandViewer publicPath={PUBLIC_PATH} initWebm={src} />
    </div>
  );
}
