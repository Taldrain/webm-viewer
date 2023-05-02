import { load } from "https://deno.land/std@0.183.0/dotenv/mod.ts";

const env = await load();
export const PUBLIC_PATH = env.PUBLIC_PATH;
