import { WEBM_PATH } from "~/utils/env.ts";

const webms = Array.from(
  Deno.readDirSync(WEBM_PATH),
  (i: Deno.DirEntry) => i.name,
);

export function getRandomizeWebms(): string[] {
  const array = [...webms];

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

export function getRandomWebm(): string {
  return webms[Math.floor(Math.random() * webms.length)];
}

export function loadWebm(webm: string) {
  return Deno.readFile(`${WEBM_PATH}/${webm}`);
}
