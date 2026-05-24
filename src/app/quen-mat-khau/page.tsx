"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Demo mode — chưa kết nối Supabase nên không thể gửi email.");
      }

      const redirectTo = `${window.location.origin}/dat-lai-mat-khau`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (err) throw err;

      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Không gửi được email khôi phục. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-20 px-4">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Đã gửi email!</h2>
          <p className="text-gray-500 mb-8 font-medium leading-relaxed">
            Chúng tôi đã gửi link đặt lại mật khẩu đến <strong className="text-gray-900">{email}</strong>.
            Vui lòng kiểm tra hộp thư (cả Spam) và click vào link để tiếp tục.
          </p>
          <Link
            href="/dang-nhap"
            className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all uppercase tracking-widest text-xs"
          >
            <ArrowLeft size={16} className="mr-2" />
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-20 px-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Quên Mật Khẩu</h1>
            <p className="text-gray-500 text-sm font-medium">Nhập email để nhận link đặt lại mật khẩu.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700">
              <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Email đăng ký</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-lg shadow-green-100 uppercase tracking-widest text-sm transition-all flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Gửi link đặt lại"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/dang-nhap" className="text-sm text-gray-500 font-medium hover:text-gray-900 inline-flex items-center">
              <ArrowLeft size={14} className="mr-1" /> Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
