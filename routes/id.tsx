import { define } from "~/utils/define.ts";

import { getRandomWebm } from "~/utils/webm.ts";

export const handler = define.handlers({
  GET() {
    const webm = getRandomWebm();
    return new Response(webm);
  },
});
