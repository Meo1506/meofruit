// Chuẩn hoá chuỗi tiếng Việt thành slug URL-safe.
// "Táo Mỹ Đỏ Loại 1" -> "tao-my-do-loai-1"
export function slugify(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // strip combining diacritics
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
