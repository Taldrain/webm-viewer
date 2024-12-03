import { WEBM_PATH } from "~/utils/env.ts";

const webms = Array.from(
  Deno.readDirSync(WEBM_PATH),
  (i: Deno.DirEntry) => i.name,
);

export function getRandomWebm(): string {
  return webms[Math.floor(Math.random() * webms.length)];
}

export function loadWebm(webm: string) {
  return Deno.readFile(`${WEBM_PATH}/${webm}`);
}
