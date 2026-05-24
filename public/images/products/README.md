# Thư mục ảnh sản phẩm

Bỏ ảnh sản phẩm vào đây để script `scripts/sync_images_to_supabase.js` tự upload lên bucket `Image` của Supabase và cập nhật cột `image_url` trong bảng `products`.

## Quy ước đặt tên

Tên file (không tính phần mở rộng) phải **trùng với cột `slug`** trong bảng `products`.

Ví dụ:
- Sản phẩm có `slug = "tao-my-do"` → đặt file `tao-my-do.jpg`
- Sản phẩm có `slug = "nuoc-ep-cam"` → đặt file `nuoc-ep-cam.png`

Định dạng hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`.

## Cách upload lên Supabase

Từ thư mục gốc của repo:

```bash
# Cần có file .env.local trong /frontend với:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   SUPABASE_SERVICE_ROLE_KEY=...  (bắt buộc để bypass RLS khi update DB)

node scripts/sync_images_to_supabase.js
```

Script sẽ:
1. Đọc tất cả ảnh trong thư mục này
2. Upload lên bucket `Image` ở path `products/<filename>`
3. Tìm sản phẩm có `slug` trùng tên file và cập nhật `image_url` thành public URL trên Supabase

## Trước khi chạy lần đầu

Vào Supabase Dashboard → Storage → tạo bucket tên `Image`, bật **Public** để ảnh truy cập được từ ngoài.
