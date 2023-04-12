import { Head } from "$fresh/runtime.ts";

import IslandViewer from "../islands/viewer.tsx";

export default function Viewer() {
  return (
    <>
      <Head>
        <title>Webm Viewer</title>
      </Head>
      <div class="bg-black">
        <IslandViewer />
      </div>
    </>
  );
}
