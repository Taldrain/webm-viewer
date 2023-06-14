import { useEffect, useState } from "preact/hooks";
import Player from "../components/Player.tsx";

export default function ViewerIsland({ publicPath }: { publicPath: string }) {
  const [src, setSrc] = useState("");

  const getRandomId = async () => {
    const response = await fetch(`${publicPath}/id`);
    return response.text();
  };

  const loadRandomWebm = async () => {
    setSrc(await getRandomId());
  };

  useEffect(() => {
    loadRandomWebm();
  }, []);

  return (
    <>
      <div class="flex items-center justify-center h-screen select-none">
        <Player src={src} onEnded={loadRandomWebm} publicPath={publicPath} />
      </div>
      <button
        type="button"
        onClick={loadRandomWebm}
        class="absolute left-4 bottom-4 rounded-full bg-gray-600 p-2 text-white shadow-sm focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </>
  );
}
