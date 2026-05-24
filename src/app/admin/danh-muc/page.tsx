"use client";
import AdminLayout from "@/components/AdminLayout";
import { Plus, Trash2, Loader2, Save, X, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const demoData = [
      { id: '1', name: 'Trái cây', show_on_storefront: true },
      { id: '2', name: 'Nước ép', show_on_storefront: false }
    ];

    try {
      setLoading(true);
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) throw error;
        setCategories(data || demoData);
      } else {
        setCategories(demoData);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(demoData);
    } finally {
      setLoading(false);
    }
  }

  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('categories')
          .update({ show_on_storefront: !currentStatus })
          .eq('id', id);
        if (error) throw error;
        fetchCategories();
      } else {
        setCategories(categories.map(c => c.id === id ? { ...c, show_on_storefront: !currentStatus } : c));
      }
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái hiển thị");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    
    setIsSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('categories')
          .insert([{ name: newCatName, show_on_storefront: true }]);
        if (error) throw error;
        fetchCategories();
      } else {
        setCategories(prev => [...prev, { id: Math.random().toString(), name: newCatName, show_on_storefront: true }]);
      }
      setNewCatName("");
      setIsModalOpen(false);
    } catch (err) {
      alert("Lỗi khi thêm danh mục");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Xóa danh mục "${name}"?`)) return;
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        fetchCategories();
      } else {
        setCategories(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      alert("Xóa thất bại");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Quản lý danh mục</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Cấu hình nhãn lọc ngoài trang chủ</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-6 py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-lg transition-all"
          >
            <Plus size={20} className="mr-2" /> Thêm mới
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-medium">
              <Loader2 size={30} className="animate-spin mb-4" />
              <p>Đang tải...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 text-sm">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <span className="font-black text-gray-900 uppercase tracking-wider">{cat.name}</span>
                    {cat.show_on_storefront ? (
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-black uppercase">Đang hiển thị</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-[9px] font-black uppercase">Đang ẩn</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => toggleVisibility(cat.id, cat.show_on_storefront)}
                      className={`p-2 rounded-xl transition-all ${cat.show_on_storefront ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={cat.show_on_storefront ? "Bấm để ẩn khỏi trang chủ" : "Bấm để hiện lên trang chủ"}
                    >
                      {cat.show_on_storefront ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button 
                      onClick={() => deleteCategory(cat.id, cat.name)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-900 uppercase tracking-tight">Thêm danh mục</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Tên danh mục mới</label>
                <input 
                  autoFocus
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ví dụ: Quà tặng"
                  className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold"
                />
              </div>
              <button 
                type="submit"
                disabled={isSaving}
                className="w-full py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all uppercase tracking-widest text-xs flex items-center justify-center"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : "Xác nhận thêm"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
