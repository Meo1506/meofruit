"use client";
import { Loader2, Mail, Phone, MessageSquare, Check, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  user_id: string | null;
  created_at: string;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
};

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchMessages(); }, []);

  async function fetchMessages() {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        setMessages([]);
        return;
      }
      const { data, error: err } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setMessages((data || []) as ContactMessage[]);
    } catch (e: any) {
      setError(e?.message || "Không tải được tin nhắn.");
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    if (!isSupabaseConfigured()) return;
    await supabase.from("contact_messages").update({ status: "read" }).eq("id", id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "read" } : m));
  }

  async function deleteMessage(id: string) {
    if (!confirm("Xóa tin nhắn này?")) return;
    if (!isSupabaseConfigured()) {
      setMessages(prev => prev.filter(m => m.id !== id));
      return;
    }
    await supabase.from("contact_messages").delete().eq("id", id);
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  const newCount = messages.filter(m => m.status === "new").length;

  return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Tin nhắn liên hệ</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
              {newCount > 0 ? `${newCount} tin nhắn mới` : "Không có tin nhắn mới"}
            </p>
          </div>
          <button onClick={fetchMessages} className="p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all" title="Tải lại">
            <RefreshCw size={18} />
          </button>
        </div>

        {!isSupabaseConfigured() && (
          <div className="flex items-start p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-700">
            <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-bold leading-relaxed">Demo mode — chưa kết nối Supabase. Tin nhắn từ /lien-he sẽ hiện ở đây khi DB sẵn sàng.</p>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center text-gray-400">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p className="text-sm font-bold uppercase tracking-widest">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-700 font-bold text-sm">{error}</div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <Mail size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(m => (
              <div
                key={m.id}
                className={`p-6 rounded-3xl border transition-all ${m.status === "new" ? "bg-green-50/50 border-green-200" : "bg-white border-gray-100"}`}
              >
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-black text-gray-900">{m.name}</h3>
                      {m.status === "new" && (
                        <span className="px-2 py-0.5 bg-green-600 text-white rounded-full text-[9px] font-black uppercase tracking-wider">Mới</span>
                      )}
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[9px] font-black uppercase tracking-wider">{m.subject}</span>
                    </div>
                    <a href={`tel:${m.phone}`} className="text-xs text-gray-500 font-bold inline-flex items-center hover:text-green-600">
                      <Phone size={12} className="mr-1" /> {m.phone}
                    </a>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap flex-shrink-0">{formatDate(m.created_at)}</span>
                </div>
                <div className="flex items-start text-sm text-gray-700 mb-4">
                  <MessageSquare size={14} className="mr-2 mt-1 text-gray-400 flex-shrink-0" />
                  <p className="whitespace-pre-wrap">{m.message}</p>
                </div>
                <div className="flex justify-end space-x-2">
                  {m.status === "new" && (
                    <button onClick={() => markRead(m.id)} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 uppercase tracking-widest">
                      <Check size={12} className="mr-1.5" /> Đánh dấu đọc
                    </button>
                  )}
                  <button onClick={() => deleteMessage(m.id)} className="inline-flex items-center px-4 py-2 bg-white border border-red-200 text-red-600 font-bold text-xs rounded-xl hover:bg-red-50 uppercase tracking-widest">
                    <Trash2 size={12} className="mr-1.5" /> Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
