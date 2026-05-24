"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// Khi user click link trong email Supabase, họ landing tại trang này với hash token.
// Supabase JS SDK sẽ tự detect và fire event PASSWORD_RECOVERY → user được tạm authed.
// Sau đó page cho phép set password mới qua supabase.auth.updateUser().

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setTokenError("Demo mode — chưa kết nối Supabase.");
      return;
    }
    // Lắng nghe event recovery để confirm token hợp lệ
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // Check ngay session hiện tại (trường hợp đã được restore từ hash)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        // Sau 2s nếu vẫn chưa có session thì coi như token hỏng
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s2 } }) => {
            if (!s2 && !ready) {
              setTokenError("Link đã hết hạn hoặc không hợp lệ. Hãy yêu cầu gửi lại email khôi phục.");
            }
          });
        }, 2000);
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Mật khẩu phải ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => router.push("/dang-nhap"), 2500);
    } catch (e: any) {
      setError(e?.message || "Không đổi được mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-20 px-4">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Link không hợp lệ</h2>
          <p className="text-gray-500 mb-8 font-medium">{tokenError}</p>
          <Link href="/quen-mat-khau" className="inline-block px-8 py-4 bg-green-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs">
            Gửi lại email
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-20 px-4">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Đã đổi mật khẩu!</h2>
          <p className="text-gray-500 mb-8 font-medium">Đang chuyển sang trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-20 px-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Đặt Lại Mật Khẩu</h1>
            <p className="text-gray-500 text-sm font-medium">
              {ready ? "Nhập mật khẩu mới cho tài khoản của bạn." : "Đang xác thực link..."}
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700">
              <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          {!ready ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-300" size={40} /></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-14 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-lg shadow-green-100 uppercase tracking-widest text-sm transition-all flex items-center justify-center disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Lưu mật khẩu mới"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
