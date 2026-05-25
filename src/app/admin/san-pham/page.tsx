"use client";
import Link from "next/link";
import { Plus, Search, Edit2, Trash2, Loader2, X, Save, Image as ImageIcon, MinusCircle, Check, Upload, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Product } from "@/types";
import { supabase, isSupabaseConfigured, getErrorMessage, autoSeedIfEmpty } from "@/lib/supabase";
import { uploadProductImage, validateImageFile } from "@/lib/uploadImage";
import { slugify } from "@/lib/slugify";
import productsData from "@/data/products.json";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // State for inline category adding
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [isSyncing, setIsSyncing] = useState(false);

  // States for bulk editing
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkSalePrice, setBulkSalePrice] = useState("");
  const [bulkSaleUntil, setBulkSaleUntil] = useState("");
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const handleBulkSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkPrice.trim()) return;
    setIsBulkSaving(true);
    try {
      const price = parseInt(bulkPrice);
      const salePrice = bulkSalePrice.trim() ? parseInt(bulkSalePrice) : null;

      if (salePrice !== null && (isNaN(salePrice) || salePrice <= 0 || salePrice >= price)) {
        alert("Giá khuyến mãi phải lớn hơn 0 và nhỏ hơn giá gốc. Để trống nếu không khuyến mãi.");
        setIsBulkSaving(false);
        return;
      }

      const saleUntilIso = salePrice !== null && bulkSaleUntil.trim()
        ? new Date(bulkSaleUntil).toISOString()
        : null;

      const updateData: any = {
        price,
        sale_price: salePrice,
        sale_until: saleUntilIso,
        price_formatted: price.toLocaleString('vi-VN') + "₫"
      };

      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('products')
          .update(updateData)
          .in('id', selectedIds);
        if (error) throw error;
        alert(`Đã cập nhật giá cho ${selectedIds.length} sản phẩm thành công!`);
        fetchProducts();
      } else {
        setProducts(products.map(p => selectedIds.includes(p.id!) ? { ...p, ...updateData } : p));
        alert(`Đã cập nhật giá cho ${selectedIds.length} sản phẩm (Chế độ Demo)`);
      }
      setSelectedIds([]);
      setIsBulkPriceModalOpen(false);
      setBulkPrice("");
      setBulkSalePrice("");
      setBulkSaleUntil("");
    } catch (err: any) {
      alert("Lỗi khi cập nhật giá hàng loạt: " + (err?.message || err));
    } finally {
      setIsBulkSaving(false);
    }
  };

  async function handleSeedFromJson() {
    if (!isSupabaseConfigured()) { alert("Chưa kết nối Supabase."); return; }
    if (!confirm(`Đồng bộ ${productsData.length} sản phẩm từ file lên Supabase?\n(Sẽ cập nhật nếu slug đã tồn tại, không xóa sản phẩm cũ.)`)) return;
    setIsSyncing(true);
    try {
      // Bỏ id (để DB tự sinh UUID); upsert theo slug
      const rows = productsData.map((p) => ({
        slug: p.slug,
        name: p.name,
        price: p.price,
        price_formatted: p.price_formatted,
        image_url: p.image_url,
        category: p.category,
        description: p.description ?? null,
        stock_kg: (p as { stock_kg?: number }).stock_kg ?? (p.is_in_stock !== false ? 10 : 0),
        product_type: p.product_type ?? "standard",
        fruits: (p as { fruits?: string[] }).fruits ?? [],
      }));
      const { error } = await supabase.from("products").upsert(rows, { onConflict: "slug" });
      if (error) {
        console.error("Seed error full:", error);
        throw error;
      }
      alert(`Đã đồng bộ ${rows.length} sản phẩm thành công!`);
      fetchProducts();
    } catch (err: unknown) {
      console.error("Seed failed:", err);
      alert("Lỗi: " + getErrorMessage(err));
    } finally {
      setIsSyncing(false);
    }
  }

  // State cho upload ảnh
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State cho price preview (live tính % giảm)
  const [priceInput, setPriceInput] = useState<string>("");
  const [salePriceInput, setSalePriceInput] = useState<string>("");
  const [saleUntilInput, setSaleUntilInput] = useState<string>("");

  // Reset state file + price mỗi khi đóng/mở modal
  useEffect(() => {
    if (!isModalOpen) {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      setSelectedFile(null);
      setLocalPreviewUrl(null);
      setUploadError(null);
      setPriceInput("");
      setSalePriceInput("");
      setSaleUntilInput("");
    } else {
      // Seed từ editing product
      setPriceInput(editingProduct?.price?.toString() || "");
      setSalePriceInput(editingProduct?.sale_price?.toString() || "");
      // Convert ISO → local datetime-local format (yyyy-MM-ddTHH:mm)
      if (editingProduct?.sale_until) {
        const d = new Date(editingProduct.sale_until);
        if (!isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, "0");
          setSaleUntilInput(
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
          );
        } else {
          setSaleUntilInput("");
        }
      } else {
        setSaleUntilInput("");
      }
    }
  }, [isModalOpen, editingProduct]);

  // Cleanup object URL khi unmount
  useEffect(() => {
    return () => { if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl); };
  }, [localPreviewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { setUploadError(err); return; }
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
    setUploadError(null);
  };

  const clearSelectedFile = () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setSelectedFile(null);
    setLocalPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    async function init() {
      if (isSupabaseConfigured()) {
        await autoSeedIfEmpty();
      }
      fetchProducts();
      fetchCategories();
    }
    init();

    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel("realtime-admin-products")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => {
            fetchProducts();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "categories" },
          () => {
            fetchCategories();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProducts(data || []);
      } else {
        setProducts(productsData.map((p, i) => ({ ...p, id: p.id || i.toString() })) as Product[]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        if (error) throw error;
        setCategories(data || []);
      } else {
        setCategories([
          { id: '1', name: 'Trái cây' },
          { id: '2', name: 'Nước ép' }
        ]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  const handleAddCategoryInline = async () => {
    if (!newCatName.trim()) return;
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('categories').insert([{ name: newCatName, show_on_storefront: true }]);
        if (error) throw error;
        await fetchCategories();
      } else {
        setCategories(prev => [...prev, { id: Math.random().toString(), name: newCatName }]);
      }
      setNewCatName("");
      setIsAddingCat(false);
    } catch (err) {
      alert("Lỗi khi thêm danh mục");
    }
  };

  const handleDeleteCategoryInline = async (id: string, name: string) => {
    if (!confirm(`Xóa danh mục "${name}"?`)) return;
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        await fetchCategories();
      } else {
        setCategories(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      alert("Lỗi khi xóa danh mục");
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const slug = slugify(name) || `product-${Date.now()}`;

      // Upload ảnh nếu user có chọn file mới
      let finalImageUrl = (formData.get("image_url") as string) || editingProduct?.image_url || "";
      if (selectedFile) {
        const res = await uploadProductImage(selectedFile, slug);
        if (!res.ok) {
          setUploadError(res.message || "Upload thất bại");
          setIsSaving(false);
          return;
        }
        finalImageUrl = res.url;
        if (res.isDemo) {
          // Cảnh báo nhưng vẫn tiếp tục lưu (state local)
          console.warn(res.message);
        }
      }

      const price = parseInt(formData.get("price") as string);
      const salePriceRaw = formData.get("sale_price") as string;
      const salePrice = salePriceRaw ? parseInt(salePriceRaw) : null;

      // Validate sale_price phải > 0 và < price
      if (salePrice !== null && (isNaN(salePrice) || salePrice <= 0 || salePrice >= price)) {
        alert("Giá khuyến mãi phải lớn hơn 0 và nhỏ hơn giá gốc. Để trống nếu không khuyến mãi.");
        setIsSaving(false);
        return;
      }

      const saleUntilRaw = (formData.get("sale_until") as string) || "";
      const saleUntilIso = salePrice !== null && saleUntilRaw.trim()
        ? new Date(saleUntilRaw).toISOString()
        : null;

      const productData = {
        name,
        price,
        sale_price: salePrice,
        sale_until: saleUntilIso,
        price_formatted: price.toLocaleString('vi-VN') + "₫",
        category: formData.get("category") as string,
        image_url: finalImageUrl,
        description: formData.get("description") as string,
        stock_kg: Math.max(0, parseFloat(formData.get("stock_kg") as string) || 0),
        slug,
      };

      if (isSupabaseConfigured()) {
        if (editingProduct?.id && editingProduct.id.length > 5) {
          const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('products').insert([productData]);
          if (error) throw error;
        }
        fetchProducts();
      } else {
        if (editingProduct) {
          setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
        } else {
          setProducts([{ ...productData, id: Math.random().toString() }, ...products]);
        }
        alert(selectedFile
          ? "Đã lưu (Demo mode — ảnh chỉ giữ trong phiên này; nối Supabase + tạo bucket 'Image' để lưu thật)"
          : "Đã lưu thành công (Chế độ Demo)");
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      alert("Lỗi khi lưu sản phẩm: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  async function deleteProduct(id: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm này?`)) return;
    try {
      if (isSupabaseConfigured() && id.length > 5) {
        await supabase.from('products').delete().eq('id', id);
        fetchProducts();
      } else {
        setProducts(products.filter(p => p.id !== id));
        alert("Đã xóa thành công (Chế độ Demo)");
      }
    } catch (error) {
      alert("Xóa sản phẩm thất bại");
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Quản lý sản phẩm</h2>
              <div className="flex items-center mt-1">
                <span className={`w-2 h-2 rounded-full mr-2 ${isSupabaseConfigured() ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    {isSupabaseConfigured() ? 'Chế độ: Supabase' : 'Chế độ: Local Demo'}
                </p>
              </div>
           </div>
           <div className="flex items-center gap-3">
             <button
               onClick={handleSeedFromJson}
               disabled={isSyncing}
               className="flex items-center px-5 py-3 bg-gray-800 text-white font-bold rounded-2xl hover:bg-gray-900 transition-all active:scale-95 disabled:opacity-60 text-sm"
             >
               {isSyncing ? <Loader2 size={18} className="mr-2 animate-spin" /> : <span className="mr-2 text-base">🔄</span>}
               Đồng bộ từ file
             </button>
             <button
               onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
               className="flex items-center px-6 py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-lg transition-all active:scale-95"
             >
               <Plus size={20} className="mr-2" /> Thêm sản phẩm mới
             </button>
           </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-top-4 duration-200 shadow-sm">
             <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-ping"></span>
                <span className="text-sm font-bold text-green-800">Đang chọn {selectedIds.length} sản phẩm</span>
             </div>
             <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsBulkPriceModalOpen(true)}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-green-200 active:scale-95 transition-all"
                >
                  Sửa giá hàng loạt
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-all"
                >
                  Bỏ chọn
                </button>
             </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-medium"
              />
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="font-medium">Đang chuẩn bị...</p>
             </div>
           ) : (
             <div className="overflow-x-auto text-sm">
                <table className="w-full text-left">
                   <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                         <th className="w-10 px-6 py-4">
                            <input 
                              type="checkbox" 
                              checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(filteredProducts.map(p => p.id!));
                                } else {
                                  setSelectedIds([]);
                                }
                              }}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                            />
                         </th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Sản phẩm</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Danh mục</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Trạng thái</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Giá bán</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredProducts.length === 0 && !loading && (
                        <tr>
                          <td colSpan={6} className="text-center py-20 text-gray-400">
                            <p className="text-sm font-bold mb-2">Chưa có sản phẩm nào</p>
                            <p className="text-xs">Nhấn <span className="font-black text-gray-600">🔄 Đồng bộ từ file</span> để import sản phẩm mẫu, hoặc thêm thủ công.</p>
                          </td>
                        </tr>
                      )}
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                           <td className="px-6 py-4 w-10">
                              <input 
                                type="checkbox" 
                                checked={selectedIds.includes(product.id!)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds(prev => [...prev, product.id!]);
                                  } else {
                                    setSelectedIds(prev => prev.filter(id => id !== product.id));
                                  }
                                }}
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                              />
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                 <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                                    <img src={product.image_url || "/images/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
                                 </div>
                                 <span className="font-bold text-gray-900 line-clamp-1">{product.name}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                 {product.category || "Chưa loại"}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                              {product.is_in_stock === false ? (
                                <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-md text-[9px] font-bold uppercase">Hết hàng</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[9px] font-bold uppercase">Còn hàng</span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-right">
                              {product.sale_price && product.sale_price > 0 && product.sale_price < product.price ? (
                                <div className="flex flex-col items-end">
                                  <span className="font-black text-red-600">{product.sale_price.toLocaleString("vi-VN")}₫</span>
                                  <span className="text-[10px] text-gray-400 line-through">{product.price.toLocaleString("vi-VN")}₫</span>
                                </div>
                              ) : (
                                <span className="font-bold text-gray-900">{product.price.toLocaleString("vi-VN")}₫</span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                                 <button onClick={() => product.id && deleteProduct(product.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setIsAddingCat(false); }}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <button onClick={() => { setIsModalOpen(false); setIsAddingCat(false); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form id="product-form" onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Tên sản phẩm</label>
                  <input name="name" required defaultValue={editingProduct?.name} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold" />
                </div>
                
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                      Giá gốc <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        name="price"
                        type="number"
                        min="0"
                        required
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">VNĐ</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                      Giá khuyến mãi <span className="text-gray-300 normal-case">(để trống nếu không sale)</span>
                    </label>
                    <div className="relative">
                      <input
                        name="sale_price"
                        type="number"
                        min="0"
                        value={salePriceInput}
                        onChange={(e) => setSalePriceInput(e.target.value)}
                        placeholder="—"
                        className="w-full px-4 py-3 pr-12 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 font-bold"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">VNĐ</span>
                    </div>
                  </div>

                  {/* Sale until datetime — chỉ hiện khi đang có sale_price */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                      Giảm đến ngày/giờ <span className="text-gray-300 normal-case">(để trống = sale không có hạn)</span>
                    </label>
                    <input
                      name="sale_until"
                      type="datetime-local"
                      value={saleUntilInput}
                      onChange={(e) => setSaleUntilInput(e.target.value)}
                      disabled={!salePriceInput.trim()}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {saleUntilInput && salePriceInput.trim() && (() => {
                      const until = new Date(saleUntilInput);
                      if (isNaN(until.getTime())) return null;
                      if (until.getTime() <= Date.now()) {
                        return (
                          <p className="mt-2 text-[11px] font-bold text-orange-700">
                            ⚠ Thời điểm này đã ở quá khứ — sale sẽ không hiển thị cho khách.
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Live preview discount % */}
                  {(() => {
                    const p = parseInt(priceInput);
                    const sp = parseInt(salePriceInput);
                    if (isNaN(p) || isNaN(sp)) return null;
                    if (sp <= 0 || sp >= p) {
                      return (
                        <div className="sm:col-span-2 flex items-center px-4 py-2 bg-orange-50 border border-orange-100 rounded-xl">
                          <p className="text-[11px] font-bold text-orange-700">
                            ⚠ Giá khuyến mãi phải lớn hơn 0 và nhỏ hơn giá gốc.
                          </p>
                        </div>
                      );
                    }
                    const pct = Math.round((1 - sp / p) * 100);
                    return (
                      <div className="sm:col-span-2 flex items-center justify-between px-4 py-2 bg-red-50 border border-red-100 rounded-xl">
                        <span className="text-[11px] font-bold text-red-700">
                          🏷 Đang giảm <span className="font-black">{pct}%</span>
                        </span>
                        <span className="text-[11px] font-bold text-gray-600">
                          Khách trả: <span className="font-black text-red-600">{sp.toLocaleString("vi-VN")}₫</span>
                          <span className="ml-2 line-through text-gray-400">{p.toLocaleString("vi-VN")}₫</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Danh mục</label>
                    <button type="button" onClick={() => setIsAddingCat(!isAddingCat)} className="text-green-600 hover:text-green-700">
                      {isAddingCat ? <X size={14} /> : <Plus size={14} strokeWidth={3} />}
                    </button>
                  </div>
                  {isAddingCat ? (
                    <div className="flex items-center space-x-1">
                      <input autoFocus value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Tên mới..." className="flex-1 px-3 py-3 bg-green-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-green-500" />
                      <button type="button" onClick={handleAddCategoryInline} className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700"><Check size={14} strokeWidth={3}/></button>
                    </div>
                  ) : (
                    <div className="relative group/cat">
                      <select name="category" defaultValue={editingProduct?.category || "Trái cây"} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold appearance-none cursor-pointer">
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                         <button type="button" onClick={() => {
                            const sel = (document.getElementsByName('category')[0] as HTMLSelectElement).value;
                            const cat = categories.find(c => c.name === sel);
                            if (cat) handleDeleteCategoryInline(cat.id, cat.name);
                         }} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><MinusCircle size={16} /></button>
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                         <Plus size={12} className="rotate-45" />
                      </div>
                    </div>
                  )}
                </div>


                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Số kg còn lại trong kho
                  </label>
                  <input
                    type="number"
                    name="stock_kg"
                    min="0"
                    step="0.5"
                    defaultValue={editingProduct?.stock_kg ?? (editingProduct?.is_in_stock === false ? 0 : 10)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold text-sm"
                  />
                  <p className="text-[10px] text-gray-400 font-medium mt-1.5">
                    Đặt 0 = hết hàng (sản phẩm liên quan sẽ tự tối màu). DB tự derive `is_in_stock = stock_kg &gt; 0`.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Mô tả sản phẩm</label>
                  <textarea name="description" rows={3} defaultValue={editingProduct?.description} placeholder="Nhập mô tả chi tiết..." className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold resize-none text-sm"></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ảnh sản phẩm</label>

                  {/* Preview + thao tác */}
                  <div className="flex items-start space-x-4">
                    <div className="w-28 h-28 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {localPreviewUrl ? (
                        <img src={localPreviewUrl} alt="preview" className="w-full h-full object-cover" />
                      ) : editingProduct?.image_url ? (
                        <img src={editingProduct.image_url} alt="current" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={32} className="text-gray-300" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="product-image-file"
                      />
                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor="product-image-file"
                          className="flex items-center px-4 py-2.5 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer hover:bg-black transition-all"
                        >
                          <Upload size={14} className="mr-2" />
                          {selectedFile ? "Đổi ảnh khác" : "Tải ảnh lên"}
                        </label>
                        {selectedFile && (
                          <button
                            type="button"
                            onClick={clearSelectedFile}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Bỏ ảnh đã chọn"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      {selectedFile && (
                        <p className="text-[10px] text-gray-500 font-bold truncate">
                          📎 {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                        Tên file sẽ tự đổi theo slug. Ảnh upload sẽ lên bucket <code className="bg-gray-100 px-1 rounded">Image/products/</code>.
                      </p>
                    </div>
                  </div>

                  {uploadError && (
                    <div className="mt-3 flex items-start p-3 bg-red-50 border border-red-100 rounded-xl text-red-600">
                      <AlertTriangle size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-bold">{uploadError}</p>
                    </div>
                  )}

                  {!isSupabaseConfigured() && (
                    <div className="mt-3 flex items-start p-3 bg-orange-50 border border-orange-100 rounded-xl text-orange-700">
                      <AlertTriangle size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] font-bold leading-relaxed">
                        Demo mode: chưa kết nối Supabase. Ảnh upload chỉ preview tạm trong phiên này. Sau khi nối Supabase + tạo bucket <code className="bg-orange-100 px-1 rounded">Image</code>, upload sẽ tự đẩy lên storage.
                      </p>
                    </div>
                  )}

                  {/* Fallback: dán URL nếu không muốn upload */}
                  <details className="mt-3 group/url">
                    <summary className="text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-600 list-none flex items-center">
                      <Plus size={12} className="mr-1 group-open/url:rotate-45 transition-transform" />
                      Hoặc dán URL ảnh có sẵn
                    </summary>
                    <input
                      name="image_url"
                      defaultValue={editingProduct?.image_url}
                      placeholder="https://... hoặc /images/products/ten-file.jpg"
                      className="mt-2 w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-medium text-sm"
                    />
                  </details>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex-shrink-0 flex space-x-3">
              <button type="button" onClick={() => { setIsModalOpen(false); setIsAddingCat(false); }} disabled={isSaving} className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs disabled:opacity-50">Hủy</button>
              <button type="submit" form="product-form" disabled={isSaving} className="flex-[2] py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all uppercase tracking-widest text-xs flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                {isSaving ? (
                  <><Loader2 size={18} className="mr-2 animate-spin" /> Đang lưu...</>
                ) : (
                  <><Save size={18} className="mr-2" /> Lưu sản phẩm</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkPriceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBulkPriceModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-900 uppercase tracking-tight">Sửa giá hàng loạt</h3>
              <button onClick={() => setIsBulkPriceModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBulkSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Giá gốc mới (VNĐ) <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  min="0"
                  required
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="Ví dụ: 30000"
                  className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Giá khuyến mãi mới (VNĐ) <span className="text-gray-300 normal-case">(để trống nếu không sale)</span></label>
                <input 
                  type="number"
                  min="0"
                  value={bulkSalePrice}
                  onChange={(e) => setBulkSalePrice(e.target.value)}
                  placeholder="Ví dụ: 25000"
                  className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Giảm đến ngày/giờ <span className="text-gray-300 normal-case">(để trống = không hạn)</span></label>
                <input
                  type="datetime-local"
                  value={bulkSaleUntil}
                  onChange={(e) => setBulkSaleUntil(e.target.value)}
                  disabled={!bulkSalePrice.trim()}
                  className="w-full px-5 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={isBulkSaving}
                className="w-full py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all uppercase tracking-widest text-xs flex items-center justify-center disabled:opacity-75"
              >
                {isBulkSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : "Xác nhận cập nhật"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
