import { HttpError } from "fresh";
import { define } from "~/utils/define.ts";

import { getExtension, isValidWebm } from "~/utils/path.ts";
import { loadWebm } from "~/utils/webm.ts";

function getContentType(extension: string) {
  if (extension === "webm") {
    return "video/webm";
  }

  if (extension === "mp4") {
    return "video/mp4";
  }

  return "image/gif";
}

export const handler = define.handlers({
  async GET(ctx) {
    if (!isValidWebm(ctx.params.webm)) {
      throw new HttpError(404);
    }
    const extension = getExtension(ctx.params.webm);
    const data = await loadWebm(ctx.params.webm);
    return new Response(data, {
      headers: {
        "Content-Type": getContentType(extension),
      },
    });
  },
});
