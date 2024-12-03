import { Handlers } from "$fresh/server.ts";

import { getRandomWebm, loadWebm } from "~/utils/webm.ts";

export const handler: Handlers = {
  async GET() {
    const webm = getRandomWebm();
    const data = await loadWebm(webm);
    return new Response(data, {
      headers: {
        "Content-Type": "video/webm",
      },
    });
  },
};
