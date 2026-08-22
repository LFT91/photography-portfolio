export type PhotoDragPayload = {
  photoId: string;
  fromCollectionId: string | null;
};

export const PHOTO_DRAG_TYPE = "application/x-fatni-photo";

export function setPhotoDrag(
  dataTransfer: DataTransfer,
  payload: PhotoDragPayload,
) {
  dataTransfer.setData(PHOTO_DRAG_TYPE, JSON.stringify(payload));
  dataTransfer.effectAllowed = "copyMove";
}

export function readPhotoDrag(
  dataTransfer: DataTransfer,
): PhotoDragPayload | null {
  const raw = dataTransfer.getData(PHOTO_DRAG_TYPE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PhotoDragPayload;
  } catch {
    return null;
  }
}

export function collectionOptionLabel(site: "fatni" | "ayoub", title: string) {
  return `${site === "fatni" ? "Fatni" : "Ayoub"} / ${title}`;
}
