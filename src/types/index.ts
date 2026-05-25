export interface Product {
  id?: string;
  name: string;
  url?: string;
  slug?: string;
  price: number;
  sale_price?: number | null;
  /** ISO 8601 timestamptz; null/undefined nghĩa là sale không có hạn (vẫn active nếu sale_price hợp lệ). */
  sale_until?: string | null;
  price_formatted: string;
  image_url: string;
  category: string;
  description?: string;
  /** Số kg còn lại trong kho. Source of truth cho stock. Admin chỉ chỉnh field này. */
  stock_kg?: number;
  /** Computed read-only (DB GENERATED column = stock_kg > 0). KHÔNG set khi INSERT/UPDATE. */
  is_in_stock?: boolean;
  product_type?: 'standard' | 'custom_mix';
  fruits?: string[];
}

export interface SiteSettings {
  webName: string;
  ownerName: string;
  bankAccount: {
    number: string;
    owner: string;
    bank: string;
  };
  contact: {
    phone: string;
    zalo: string;
    email: string;
    address: string;
  };
  social: {
    facebook: string;
    instagram: string;
    youtube: string;
    /** Số điện thoại Zalo (digits only). FE sẽ build link https://zalo.me/<phone>. */
    zalo: string;
  };
  shipping: {
    policy: string;
  };
  heroImages?: string[];
  showCategoriesSection?: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  webName: "Meo Fruit",
  ownerName: "Nam Nguyễn",
  bankAccount: {
    number: "9916297232",
    owner: "PHẠM NGUYỄN HUY NAM",
    bank: "Techcombank"
  },
  contact: {
    phone: "0916297232",
    zalo: "0916297232",
    email: "phamnguyenhuynam2006@gmail.com",
    address: "Quốc lộ 1A, Linh Xuân, Thủ Đức (Gần ĐH Kinh Tế - Luật)"
  },
  social: {
    facebook: "https://www.facebook.com/share/1cZCV3TkVJ/?mibextid=wwXIfr",
    instagram: "",
    youtube: "",
    zalo: ""
  },
  shipping: {
    policy: "Free ship bán kính 3km"
  },
  heroImages: [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000&auto=format&fit=crop"
  ],
  showCategoriesSection: true
};

/** @deprecated Dùng useSiteSettings() (client) hoặc getSiteSettings() (server) thay vì import trực tiếp. */
export const SITE_CONFIG = DEFAULT_SITE_SETTINGS;

// ---- Home banner ---------------------------------------------------------

export type BannerSectionType = "text" | "image";

export interface BannerSection {
  /** ID cục bộ — dùng cho dnd-kit và React key. Lưu kèm trong jsonb để giữ ổn định. */
  id: string;
  type: BannerSectionType;
  /** Với type 'text' = plain text/markdown. Với type 'image' = public URL ảnh. */
  content: string;
  order: number;
}

export interface HomeBanner {
  id: string;
  title: string;
  is_visible: boolean;
  sections: BannerSection[];
  /** ISO 8601. Null = hiển thị ngay. */
  start_at: string | null;
  /** ISO 8601. Null = không có hạn. */
  end_at: string | null;
  /** Số giờ admin đã chọn (để hiển thị lại form). Null nếu mode = 'until_datetime'. */
  duration_hours: number | null;
  created_at?: string;
  updated_at?: string;
}
