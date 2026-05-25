"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, User, Phone, MapPin, AtSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Username: chỉ cho phép chữ thường, số, dấu gạch dưới
    if (name === "username") {
      setFormData({ ...formData, username: value.toLowerCase().replace(/[^a-z0-9_]/g, "") });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (formData.username.length < 3) {
      setError("Tên đăng nhập phải có ít nhất 3 ký tự.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Kiểm tra username đã tồn tại chưa
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", formData.username)
        .maybeSingle();

      if (existing) {
        setError("Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.");
        return;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
            phone: formData.phone,
            address: formData.address,
          }
        }
      });

      if (signUpError) throw signUpError;

      // Trigger handle_new_user() (nếu có) chỉ copy field nó biết từ raw_user_meta_data.
      // Upsert thêm ở đây để chắc chắn phone/address luôn được ghi vào bảng profiles.
      if (signUpData.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: signUpData.user.id,
          full_name: formData.fullName,
          username: formData.username,
          phone: formData.phone,
          address: formData.address,
        });
        if (profileError) console.error("Profile upsert failed:", profileError);
      }

      // Đăng ký thành công → vào tài khoản luôn (không cần xác nhận email)
      router.push("/tai-khoan");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đăng ký thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-32 pb-20 px-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-10 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">Tạo Tài Khoản</h1>
            <p className="text-gray-500 text-sm font-medium">Tham gia cộng đồng trái cây sạch ngay hôm nay!</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 animate-in fade-in duration-200 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Họ tên + Tên đăng nhập */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    name="username"
                    required
                    minLength={3}
                    maxLength={30}
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="vd: nguyen_a"
                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Chữ thường, số, dấu gạch dưới</p>
              </div>
            </div>

            {/* SĐT + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0912 345 678"
                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@gmail.com"
                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Địa chỉ giao hàng */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Địa chỉ giao hàng</label>
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                  className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold transition-all"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-14 pr-14 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold transition-all"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-lg shadow-green-100 uppercase tracking-widest text-sm transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Đăng Ký Tài Khoản"}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Đã có tài khoản?{" "}
              <Link href="/dang-nhap" className="text-green-600 font-black hover:underline uppercase tracking-tight">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
