export interface Product {
  id?: string;
  name: string;
  url?: string;
  slug?: string;
  price: number;
  sale_price?: number | null;
  price_formatted: string;
  image_url: string;
  category: string;
  description?: string;
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
    owner: "PHẠM NGUYỄN HỮU NAM",
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
    youtube: ""
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
