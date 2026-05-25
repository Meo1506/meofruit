"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import HomeBanner from "@/components/HomeBanner";
import { supabase, isSupabaseConfigured, getErrorMessage } from "@/lib/supabase";
import { uploadBannerImage, validateImageFile } from "@/lib/uploadImage";
import {
  computeScheduleWindow,
  isoToLocalInput,
  localInputToIso,
  isBannerLive,
  type ScheduleMode,
} from "@/lib/banner";
import type { HomeBanner as HomeBannerT, BannerSection } from "@/types";
import {
  Plus,
  Save,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Type as TypeIcon,
  Upload,
  X,
  Clock,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ScheduleKind = "hours" | "days" | "until_datetime";

interface EditorState {
  id: string | null;
  title: string;
  is_visible: boolean;
  sections: BannerSection[];
  scheduleKind: ScheduleKind;
  hoursInput: string;
  daysInput: string;
  untilInput: string;
}

const EMPTY_EDITOR: EditorState = {
  id: null,
  title: "",
  is_visible: true,
  sections: [],
  scheduleKind: "hours",
  hoursInput: "24",
  daysInput: "7",
  untilInput: "",
};

function makeSectionId(): string {
  return "sec_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function AdminBannerPage() {
  const [banners, setBanners] = useState<HomeBannerT[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileBatchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setBanners([]);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from("home_banners")
        .select("*")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        alert("Lỗi tải danh sách banner: " + error.message);
      } else {
        setBanners((data || []) as HomeBannerT[]);
      }
      setLoading(false);
    }
    load();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("realtime-admin-banners")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "home_banners" },
          () => load()
        )
        .subscribe();
      return () => {
        cancelled = true;
        supabase.removeChannel(channel);
      };
    }
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditor({ ...EMPTY_EDITOR, sections: [] });
    setIsPreviewing(false);
  }

  function openEdit(b: HomeBannerT) {
    let scheduleKind: ScheduleKind = "until_datetime";
    let hoursInput = "24";
    let daysInput = "7";
    let untilInput = "";

    if (b.duration_hours != null && b.duration_hours > 0) {
      if (b.duration_hours % 24 === 0) {
        scheduleKind = "days";
        daysInput = String(b.duration_hours / 24);
      } else {
        scheduleKind = "hours";
        hoursInput = String(b.duration_hours);
      }
    } else {
      scheduleKind = "until_datetime";
      untilInput = isoToLocalInput(b.end_at);
    }

    setEditor({
      id: b.id,
      title: b.title || "",
      is_visible: b.is_visible,
      sections: (b.sections || []).slice().sort((a, b) => a.order - b.order),
      scheduleKind,
      hoursInput,
      daysInput,
      untilInput,
    });
    setIsPreviewing(false);
  }

  function closeEditor() {
    setEditor(null);
    setIsPreviewing(false);
  }

  function addTextSection() {
    if (!editor) return;
    const next: BannerSection = {
      id: makeSectionId(),
      type: "text",
      content: "",
      order: editor.sections.length,
    };
    setEditor({ ...editor, sections: [...editor.sections, next] });
  }

  function addImageSection(url: string) {
    setEditor((prev) => {
      if (!prev) return prev;
      const next: BannerSection = {
        id: makeSectionId(),
        type: "image",
        content: url,
        order: prev.sections.length,
      };
      return { ...prev, sections: [...prev.sections, next] };
    });
  }

  function updateSection(idx: number, patch: Partial<BannerSection>) {
    if (!editor) return;
    const sections = editor.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    setEditor({ ...editor, sections });
  }

  function removeSection(idx: number) {
    if (!editor) return;
    const sections = editor.sections
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, order: i }));
    setEditor({ ...editor, sections });
  }

  async function handleUploadFiles(files: FileList | null) {
    if (!editor || !files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const err = validateImageFile(f);
        if (err) {
          alert(`Bỏ qua "${f.name}": ${err}`);
          continue;
        }
        const slugHint = (editor.title || "banner") + "-" + Date.now() + "-" + i;
        const res = await uploadBannerImage(f, slugHint);
        if (!res.ok) {
          alert(`Upload "${f.name}" thất bại: ${res.message}`);
          continue;
        }
        addImageSection(res.url);
      }
    } finally {
      setIsUploading(false);
      if (fileBatchRef.current) fileBatchRef.current.value = "";
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(e: DragEndEvent) {
    if (!editor) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = editor.sections.findIndex((s) => s.id === active.id);
    const newIdx = editor.sections.findIndex((s) => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(editor.sections, oldIdx, newIdx).map((s, i) => ({
      ...s,
      order: i,
    }));
    setEditor({ ...editor, sections: reordered });
  }

  async function handleSave() {
    if (!editor) return;
    if (!editor.title.trim()) {
      alert("Cần nhập tiêu đề banner.");
      return;
    }

    let mode: ScheduleMode;
    if (editor.scheduleKind === "hours") {
      const h = parseInt(editor.hoursInput, 10);
      if (!Number.isFinite(h) || h <= 0) {
        alert("Nhập số giờ > 0.");
        return;
      }
      mode = { kind: "hours", hours: h };
    } else if (editor.scheduleKind === "days") {
      const d = parseInt(editor.daysInput, 10);
      if (!Number.isFinite(d) || d <= 0) {
        alert("Nhập số ngày > 0.");
        return;
      }
      mode = { kind: "days", days: d };
    } else {
      const iso = localInputToIso(editor.untilInput);
      if (!iso) {
        alert("Chọn thời điểm kết thúc hợp lệ.");
        return;
      }
      mode = { kind: "until_datetime", endAt: iso };
    }
    const win = computeScheduleWindow(mode);
    const sections = editor.sections.map((s, i) => ({ ...s, order: i }));

    if (!isSupabaseConfigured()) {
      alert("Chưa kết nối Supabase — không thể lưu (Demo mode).");
      return;
    }

    setIsSaving(true);
    try {
      if (editor.is_visible) {
        const ids = banners.filter((b) => b.is_visible && b.id !== editor.id).map((b) => b.id);
        if (ids.length > 0) {
          const { error: offErr } = await supabase
            .from("home_banners")
            .update({ is_visible: false })
            .in("id", ids);
          if (offErr) throw offErr;
        }
      }

      const payload = {
        title: editor.title.trim(),
        is_visible: editor.is_visible,
        sections,
        start_at: win.start_at,
        end_at: win.end_at,
        duration_hours: win.duration_hours,
      };

      if (editor.id) {
        const { error } = await supabase
          .from("home_banners")
          .update(payload)
          .eq("id", editor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("home_banners").insert(payload);
        if (error) throw error;
      }

      alert("Đã lưu banner thành công!");
      closeEditor();
    } catch (err: unknown) {
      alert("Lưu thất bại: " + getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleVisible(b: HomeBannerT) {
    if (!isSupabaseConfigured()) return;
    const turningOn = !b.is_visible;
    try {
      if (turningOn) {
        const ids = banners.filter((x) => x.is_visible && x.id !== b.id).map((x) => x.id);
        if (ids.length > 0) {
          await supabase.from("home_banners").update({ is_visible: false }).in("id", ids);
        }
      }
      const { error } = await supabase
        .from("home_banners")
        .update({ is_visible: turningOn })
        .eq("id", b.id);
      if (error) throw error;
    } catch (err: unknown) {
      alert("Lỗi đổi trạng thái: " + getErrorMessage(err));
    }
  }

  async function handleDelete(b: HomeBannerT) {
    if (!confirm(`Xoá banner "${b.title}"?`)) return;
    try {
      const { error } = await supabase.from("home_banners").delete().eq("id", b.id);
      if (error) throw error;
    } catch (err: unknown) {
      alert("Xoá thất bại: " + getErrorMessage(err));
    }
  }

  const previewBanner: HomeBannerT | null = useMemo(() => {
    if (!editor) return null;
    return {
      id: "preview",
      title: editor.title,
      is_visible: true,
      sections: editor.sections.map((s, i) => ({ ...s, order: i })),
      start_at: null,
      end_at: null,
      duration_hours: null,
    };
  }, [editor]);

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              Banner trang chủ
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1">
              Quản lý banner hiển thị trên đầu trang chủ. Mỗi lúc chỉ 1 banner active.
            </p>
          </div>
          {!editor && (
            <button
              onClick={openCreate}
              className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs"
            >
              <Plus size={18} className="mr-2" />
              Tạo banner mới
            </button>
          )}
        </div>

        {!editor && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400 font-bold flex items-center justify-center">
                <Loader2 size={20} className="mr-2 animate-spin" />
                Đang tải...
              </div>
            ) : banners.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-bold italic">
                Chưa có banner nào. Bấm &quot;Tạo banner mới&quot; để bắt đầu.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="px-6 py-4 text-left">Tiêu đề</th>
                    <th className="px-6 py-4 text-left">Sections</th>
                    <th className="px-6 py-4 text-left">Hiển thị đến</th>
                    <th className="px-6 py-4 text-left">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {banners.map((b) => {
                    const live = isBannerLive(b);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-bold text-sm text-gray-900">
                          {b.title || <span className="text-gray-300 italic">(không tiêu đề)</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-bold">
                          {(b.sections || []).length} section
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-bold">
                          {b.end_at
                            ? new Date(b.end_at).toLocaleString("vi-VN")
                            : "Không có hạn"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              live
                                ? "bg-green-100 text-green-700"
                                : b.is_visible
                                ? "bg-orange-100 text-orange-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {live ? "Đang live" : b.is_visible ? "Hết hạn" : "Ẩn"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleToggleVisible(b)}
                              title={b.is_visible ? "Ẩn" : "Hiện"}
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                            >
                              {b.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button
                              onClick={() => openEdit(b)}
                              title="Sửa"
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(b)}
                              title="Xoá"
                              className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {editor && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                {editor.id ? "Sửa banner" : "Banner mới"}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPreviewing((v) => !v)}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black rounded-xl uppercase tracking-widest text-xs"
                >
                  <Eye size={14} className="mr-2" />
                  {isPreviewing ? "Ẩn preview" : "Xem trước"}
                </button>
                <button
                  onClick={closeEditor}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-xl uppercase tracking-widest text-xs"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center px-6 py-2 bg-gray-900 hover:bg-black text-white font-black rounded-xl uppercase tracking-widest text-xs disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={14} className="mr-2" />
                  )}
                  Lưu
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Tiêu đề banner
                </label>
                <input
                  type="text"
                  value={editor.title}
                  onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                  placeholder="VD: Khuyến mãi 30/4 - Giảm 20%"
                  className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-bold text-sm text-gray-900">Hiển thị banner</p>
                  <p className="text-xs text-gray-400 font-bold">
                    Bật để banner xuất hiện trên trang chủ trong khoảng thời gian đã chọn.
                    Bật banner này sẽ tự tắt các banner khác.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditor({ ...editor, is_visible: !editor.is_visible })}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-all ${
                    editor.is_visible ? "bg-green-600 justify-end" : "bg-gray-300 justify-start"
                  }`}
                >
                  <span className="w-6 h-6 bg-white rounded-full shadow-md" />
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center">
                <Clock size={16} className="mr-2 text-green-600" />
                Lịch hiển thị
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label
                  className={`flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition ${
                    editor.scheduleKind === "hours"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="schedule"
                    className="sr-only"
                    checked={editor.scheduleKind === "hours"}
                    onChange={() => setEditor({ ...editor, scheduleKind: "hours" })}
                  />
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900">
                    Trong N giờ
                  </span>
                  <span className="text-[11px] text-gray-500 font-bold mt-1">
                    Tính từ thời điểm bấm Lưu
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={editor.hoursInput}
                    onChange={(e) => setEditor({ ...editor, hoursInput: e.target.value })}
                    disabled={editor.scheduleKind !== "hours"}
                    className="mt-3 px-3 py-2 bg-white border border-gray-200 rounded-lg font-bold text-sm disabled:opacity-50"
                  />
                </label>

                <label
                  className={`flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition ${
                    editor.scheduleKind === "days"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="schedule"
                    className="sr-only"
                    checked={editor.scheduleKind === "days"}
                    onChange={() => setEditor({ ...editor, scheduleKind: "days" })}
                  />
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900">
                    Trong N ngày
                  </span>
                  <span className="text-[11px] text-gray-500 font-bold mt-1">
                    Tính từ thời điểm bấm Lưu
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={editor.daysInput}
                    onChange={(e) => setEditor({ ...editor, daysInput: e.target.value })}
                    disabled={editor.scheduleKind !== "days"}
                    className="mt-3 px-3 py-2 bg-white border border-gray-200 rounded-lg font-bold text-sm disabled:opacity-50"
                  />
                </label>

                <label
                  className={`flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition ${
                    editor.scheduleKind === "until_datetime"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="schedule"
                    className="sr-only"
                    checked={editor.scheduleKind === "until_datetime"}
                    onChange={() => setEditor({ ...editor, scheduleKind: "until_datetime" })}
                  />
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center">
                    <Calendar size={12} className="mr-1" />
                    Đến ngày-giờ
                  </span>
                  <span className="text-[11px] text-gray-500 font-bold mt-1">
                    Hiển thị ngay → đến mốc cụ thể
                  </span>
                  <input
                    type="datetime-local"
                    value={editor.untilInput}
                    onChange={(e) => setEditor({ ...editor, untilInput: e.target.value })}
                    disabled={editor.scheduleKind !== "until_datetime"}
                    className="mt-3 px-3 py-2 bg-white border border-gray-200 rounded-lg font-bold text-sm disabled:opacity-50"
                  />
                </label>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                  Sections ({editor.sections.length})
                </h4>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <button
                    onClick={addTextSection}
                    className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black rounded-xl uppercase tracking-widest text-[11px]"
                  >
                    <TypeIcon size={12} className="mr-2" />
                    Thêm text
                  </button>
                  <button
                    onClick={() => fileBatchRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl uppercase tracking-widest text-[11px] disabled:opacity-60"
                  >
                    {isUploading ? (
                      <Loader2 size={12} className="mr-2 animate-spin" />
                    ) : (
                      <Upload size={12} className="mr-2" />
                    )}
                    Upload ảnh
                  </button>
                  <input
                    ref={fileBatchRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUploadFiles(e.target.files)}
                  />
                </div>
              </div>

              {editor.sections.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm font-bold italic border-2 border-dashed border-gray-200 rounded-2xl">
                  Chưa có section. Thêm text hoặc upload ảnh để bắt đầu.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={editor.sections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {editor.sections.map((s, i) => (
                        <SortableSectionRow
                          key={s.id}
                          section={s}
                          index={i}
                          onChange={(patch) => updateSection(i, patch)}
                          onRemove={() => removeSection(i)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {isPreviewing && previewBanner && (
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                    Xem trước
                  </h4>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    (Bỏ qua lịch hiển thị)
                  </span>
                </div>
                <div className="p-4 bg-gray-50">
                  <HomeBanner banner={previewBanner} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function SortableSectionRow({
  section,
  index,
  onChange,
  onRemove,
}: {
  section: BannerSection;
  index: number;
  onChange: (patch: Partial<BannerSection>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="mt-2 p-2 text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing"
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center">
            {section.type === "text" ? (
              <>
                <TypeIcon size={10} className="mr-1" />
                Text #{index + 1}
              </>
            ) : (
              <>
                <ImageIcon size={10} className="mr-1" />
                Ảnh #{index + 1}
              </>
            )}
          </span>
          <button
            onClick={onRemove}
            type="button"
            className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
            aria-label="Xoá section"
          >
            <X size={14} />
          </button>
        </div>

        {section.type === "text" ? (
          <textarea
            value={section.content}
            onChange={(e) => onChange({ content: e.target.value })}
            rows={3}
            placeholder="Nội dung text (hỗ trợ xuống dòng)..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 font-medium text-sm"
          />
        ) : (
          <div className="flex items-start gap-3">
            <img
              src={section.content}
              alt={`Section ${index + 1}`}
              className="w-32 h-20 object-cover rounded-xl flex-shrink-0 bg-white border border-gray-200"
            />
            <input
              type="text"
              value={section.content}
              onChange={(e) => onChange({ content: e.target.value })}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 font-mono text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}
