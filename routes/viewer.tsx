import IslandViewer from "~/islands/viewer.tsx";
import { PUBLIC_PATH } from "~/utils/env.ts";

export default function Viewer() {
  return (
    <div className="bg-black">
      <IslandViewer publicPath={PUBLIC_PATH} />
    </div>
  );
}
