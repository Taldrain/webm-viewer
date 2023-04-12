import { Handlers } from "$fresh/server.ts";

import { loadWebm } from "../utils/webm.ts";

export const handler: Handlers = {
  async GET(_, ctx) {
    const re = /^\w+\.(gif|webm|mp4)$/;
    if (re.test(ctx.params.webm) === false) {
      return new Response("", { status: 404 });
    }
    const data = await loadWebm(ctx.params.webm);
    return new Response(data, {
      headers: {
        "Content-Type": "video/webm",
      },
    });
  },
};
