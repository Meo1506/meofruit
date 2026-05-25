import AdminLayout from "@/components/AdminLayout";

// Segment layout: chỉ mount AdminLayout 1 lần cho toàn bộ /admin/*.
// Navigation giữa các tab con (/admin, /admin/don-hang, /admin/san-pham, ...)
// KHÔNG còn trigger remount → auth check không chạy lại mỗi lần click.
export default function AdminSegmentLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
