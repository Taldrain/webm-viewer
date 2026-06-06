import { define } from "~/utils/define.ts";

import { getRandomWebm, loadWebm } from "~/utils/webm.ts";

export const handler = define.handlers({
  async GET() {
    const webm = getRandomWebm();
    const data = await loadWebm(webm);
    return new Response(data, {
      headers: {
        "Content-Type": "video/webm",
      },
    });
  },
});
