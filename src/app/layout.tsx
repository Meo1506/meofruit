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
  return {
    title: `${settings.webName} — Trái cây tươi cắt sẵn`,
    description: `Chuyên cung cấp trái cây tươi cắt sẵn, đóng hộp tiện lợi. ${settings.shipping.policy}.`,
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
