-- Thêm cột sale_until (timestamptz) cho bảng products.
-- sale_price đã tồn tại từ trước; nếu chưa có thì câu lệnh dưới cũng tạo luôn (IF NOT EXISTS).
-- Chạy trong Supabase SQL Editor.

alter table public.products
  add column if not exists sale_price numeric null,
  add column if not exists sale_until timestamptz null;

-- (Tuỳ chọn) index hỗ trợ filter sản phẩm đang sale.
create index if not exists products_sale_until_idx
  on public.products (sale_until)
  where sale_price is not null;

comment on column public.products.sale_price is 'Giá khuyến mãi (VND). Null = không sale.';
comment on column public.products.sale_until is 'Thời điểm hết hạn sale (UTC). Null = sale không có hạn.';
