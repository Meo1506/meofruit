-- Banner trang chủ tự quản lý.
-- Chạy trong Supabase SQL Editor (idempotent).

-- 1) Bảng home_banners ------------------------------------------------------
create table if not exists public.home_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  is_visible boolean not null default true,
  -- Mảng section [{ type: 'text'|'image', content: string, order: number }]
  sections jsonb not null default '[]'::jsonb,
  -- Window hiển thị (đã được FE compute từ schedule mode).
  -- start_at null = hiển thị ngay; end_at null = không có hạn.
  start_at timestamptz null,
  end_at   timestamptz null,
  -- Lưu lại N giờ người dùng chọn để admin sửa lại sau cho tiện.
  duration_hours int null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger auto updated_at
create or replace function public.home_banners_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_home_banners_updated_at on public.home_banners;
create trigger trg_home_banners_updated_at
before update on public.home_banners
for each row execute function public.home_banners_set_updated_at();

-- Index hỗ trợ query banner đang live
create index if not exists home_banners_live_idx
  on public.home_banners (is_visible, start_at, end_at);

comment on column public.home_banners.sections is
  'jsonb array: [{ type: "text"|"image", content: string, order: number }]';
comment on column public.home_banners.start_at is
  'Thời điểm bắt đầu hiển thị (UTC). Null = hiển thị ngay.';
comment on column public.home_banners.end_at is
  'Thời điểm kết thúc hiển thị (UTC). Null = không có hạn.';
comment on column public.home_banners.duration_hours is
  'Số giờ chọn ở admin (chỉ để hiển thị lại UI, không dùng để tính). Null nếu chọn mode "đến ngày cụ thể".';

-- 2) RLS --------------------------------------------------------------------
alter table public.home_banners enable row level security;

-- Public READ: ai cũng đọc được (FE sẽ tự filter theo is_visible + time window).
drop policy if exists "home_banners_public_read" on public.home_banners;
create policy "home_banners_public_read"
  on public.home_banners
  for select
  using (true);

-- Admin WRITE: chỉ profile.is_admin=true hoặc role='admin' được insert/update/delete.
drop policy if exists "home_banners_admin_write_insert" on public.home_banners;
create policy "home_banners_admin_write_insert"
  on public.home_banners
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.role = 'admin')
    )
  );

drop policy if exists "home_banners_admin_write_update" on public.home_banners;
create policy "home_banners_admin_write_update"
  on public.home_banners
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.role = 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.role = 'admin')
    )
  );

drop policy if exists "home_banners_admin_write_delete" on public.home_banners;
create policy "home_banners_admin_write_delete"
  on public.home_banners
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.role = 'admin')
    )
  );

-- 3) Storage bucket cho ảnh banner -----------------------------------------
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do update set public = true;

drop policy if exists "banners_public_read" on storage.objects;
create policy "banners_public_read"
  on storage.objects
  for select
  using (bucket_id = 'banners');

drop policy if exists "banners_admin_insert" on storage.objects;
create policy "banners_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'banners'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.role = 'admin')
    )
  );

drop policy if exists "banners_admin_update" on storage.objects;
create policy "banners_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'banners'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.role = 'admin')
    )
  );

drop policy if exists "banners_admin_delete" on storage.objects;
create policy "banners_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'banners'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.role = 'admin')
    )
  );

-- 4) Realtime ---------------------------------------------------------------
alter publication supabase_realtime add table public.home_banners;
