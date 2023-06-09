// DO NOT EDIT. This file is generated by fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import config from "./deno.json" assert { type: "json" };
import * as $0 from "./routes/[webm].tsx";
import * as $1 from "./routes/id.tsx";
import * as $2 from "./routes/random.tsx";
import * as $3 from "./routes/viewer.tsx";
import * as $$0 from "./islands/viewer.tsx";

const manifest = {
  routes: {
    "./routes/[webm].tsx": $0,
    "./routes/id.tsx": $1,
    "./routes/random.tsx": $2,
    "./routes/viewer.tsx": $3,
  },
  islands: {
    "./islands/viewer.tsx": $$0,
  },
  baseUrl: import.meta.url,
  config,
};

export default manifest;
