"use client";
import { useState } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, ArrowRight, AtSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // email hoặc username
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let loginEmail = identifier.trim();

      // Nếu không chứa @ thì coi là username → tra email từ profiles
      if (!loginEmail.includes("@")) {
        const { data: profile, error: lookupError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", loginEmail.toLowerCase())
          .maybeSingle();

        if (lookupError || !profile?.email) {
          throw new Error("Tên đăng nhập không tồn tại.");
        }
        loginEmail = profile.email;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError) throw signInError;

      router.push("/tai-khoan");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-20 px-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Đăng Nhập</h1>
            <p className="text-gray-500 text-sm font-medium">Chào mừng bạn quay trở lại với shop!</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                Email hoặc Tên đăng nhập
              </label>
              <div className="relative">
                <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="example@gmail.com hoặc ten_dang_nhap"
                  className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Mật khẩu</label>
                <Link href="/quen-mat-khau" className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-lg shadow-green-100 uppercase tracking-widest text-sm transition-all flex items-center justify-center group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  Đăng Nhập
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Chưa có tài khoản?{" "}
              <Link href="/dang-ky" className="text-green-600 font-black hover:underline uppercase tracking-tight">Đăng ký ngay</Link>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-wider">
            Cam kết bảo mật thông tin khách hàng 100%
          </p>
        </div>
      </div>
    </div>
  );
}
