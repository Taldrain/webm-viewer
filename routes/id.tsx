import { Handlers } from "$fresh/server.ts";

import { getRandomWebm } from "../utils/webm.ts";

export const handler: Handlers = {
  GET() {
    const webm = getRandomWebm();
    return new Response(webm);
  },
};
