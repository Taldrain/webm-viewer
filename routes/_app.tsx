import { PageProps } from "$fresh/server.ts";

import { PUBLIC_PATH } from "~/utils/env.ts";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>webm-viewer</title>
        <link rel="stylesheet" href={`${PUBLIC_PATH}/styles.css`} />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
