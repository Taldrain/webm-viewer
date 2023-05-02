import { isGif } from "../utils/path.ts";

interface PlayerProps {
  src: string;
  publicPath: string;
  onEnded: () => void;
}

export default function Player({ src, onEnded, publicPath }: PlayerProps) {
  const getFullUri = (uri: string) => {
    return `${publicPath}${uri}`;
  };

  if (isGif(src)) {
    return <img class="max-h-screen" src={getFullUri(src)} />;
  }

  return (
    <video
      controls
      src={getFullUri(src)}
      autoPlay
      onEnded={onEnded}
      class="max-h-screen"
    >
    </video>
  );
}
