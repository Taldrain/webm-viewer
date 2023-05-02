import { Head } from "$fresh/runtime.ts";

import IslandViewer from "../islands/viewer.tsx";
import { PUBLIC_PATH } from "../utils/uri.ts";

export default function Viewer() {
  return (
    <>
      <Head>
        <title>Webm Viewer</title>
      </Head>
      <div class="bg-black">
        <IslandViewer publicPath={PUBLIC_PATH} />
      </div>
    </>
  );
}
