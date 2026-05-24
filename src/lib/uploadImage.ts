import { supabase, isSupabaseConfigured } from "./supabase";
import { slugify } from "./slugify";

export interface UploadResult {
  ok: boolean;
  url: string;        // public URL hoặc data URL (demo mode)
  isDemo: boolean;    // true nếu chưa kết nối Supabase
  message?: string;
}

const BUCKET = "Image";
const FOLDER = "products";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF hoặc AVIF.";
  }
  if (file.size > MAX_BYTES) {
    return `Ảnh không được lớn hơn ${MAX_BYTES / 1024 / 1024}MB.`;
  }
  return null;
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/**
 * Upload ảnh sản phẩm lên bucket `Image` của Supabase Storage.
 * - Tên file = `<slug>.<ext>` để khớp với convention của script sync.
 * - Demo mode (chưa cấu hình Supabase): trả về data URL để preview/lưu state tạm.
 */
export async function uploadProductImage(
  file: File,
  slugHint?: string
): Promise<UploadResult> {
  const err = validateImageFile(file);
  if (err) return { ok: false, url: "", isDemo: !isSupabaseConfigured(), message: err };

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const base = slugify(slugHint || file.name.replace(/\.[^.]+$/, "")) || `image-${Date.now()}`;
  const filename = `${base}.${ext}`;

  if (!isSupabaseConfigured()) {
    try {
      const dataUrl = await fileToDataURL(file);
      return {
        ok: true,
        url: dataUrl,
        isDemo: true,
        message: "Demo mode — ảnh chưa upload lên Supabase. Kết nối Supabase + tạo bucket 'Image' để lưu thật.",
      };
    } catch (e: any) {
      return { ok: false, url: "", isDemo: true, message: e.message || "Đọc file thất bại" };
    }
  }

  const path = `${FOLDER}/${filename}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (upErr) {
    return { ok: false, url: "", isDemo: false, message: upErr.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, isDemo: false };
}
