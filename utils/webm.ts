import { load } from "https://deno.land/std@0.183.0/dotenv/mod.ts";

const env = await load();
const WEBM_DIR_PATH = env.WEBM_PATH;
const webms = Array.from(
  Deno.readDirSync(WEBM_DIR_PATH),
  (i: Deno.DirEntry) => i.name,
);

export function getRandomWebm(): string {
  return webms[Math.floor(Math.random() * webms.length)];
}

export function loadWebm(webm: string) {
  return Deno.readFile(`${WEBM_DIR_PATH}/${webm}`);
}
