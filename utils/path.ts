const re = /^\w+\.(gif|webm|mp4)$/;

export function isValidWebm(path: string) {
  return re.test(path);
}

export function getExtension(path: string) {
  const match = path.match(re);
  if (match === null) {
    return "";
  }

  return match[1];
}

export function isGif(path: string) {
  const extension = getExtension(path);
  return extension === "gif";
}
