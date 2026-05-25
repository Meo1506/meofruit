import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import FloatingCart from "@/components/FloatingCart";
import FloatingSocialIcons from "@/components/FloatingSocialIcons";
import Providers from "./providers";
import { getSiteSettings } from "@/lib/site-settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = `Chuyên cung cấp trái cây tươi cắt sẵn, đóng hộp tiện lợi. ${settings.shipping.policy}.`;
  const heroImage = "/og-image.jpg";
  // Ưu tiên: custom domain (env tự set) → Vercel prod URL stable → Vercel deployment URL → localhost.
  // VERCEL_PROJECT_PRODUCTION_URL ổn định qua các deploy; VERCEL_URL thay đổi mỗi deployment.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return {
    // webName đã có tagline rồi (vd. "Meo Fruzi – Trái cây tươi mê ly"), không cần
    // append thêm để tránh title bị lặp.
    metadataBase: new URL(siteUrl),
    title: settings.webName,
    description,
    openGraph: {
      title: settings.webName,
      description,
      url: "/",
      siteName: settings.webName,
      locale: "vi_VN",
      type: "website",
      images: heroImage ? [{ url: heroImage, width: 1200, height: 630, alt: settings.webName }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.webName,
      description,
      images: heroImage ? [heroImage] : [],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="vi" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col`}
      >
        <Providers settings={settings}>
          <Navbar />
          <CartSidebar />
          <FloatingCart />
          <FloatingSocialIcons />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
