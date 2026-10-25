import { type PageProps } from "fresh";
import { PUBLIC_PATH } from "~/utils/env.ts";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>webm-viewer</title>
        <link
          rel="icon"
          type="image/svg+xml"
          href={`${PUBLIC_PATH}favicon.svg`}
        />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
