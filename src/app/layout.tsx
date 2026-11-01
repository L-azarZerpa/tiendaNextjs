import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import RecaptchaProvider from "@/components/RecaptchaProvider"; // <--- Importado como Client Component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tienda de Licores",
  description: "E-commerce de bebidas alcohólicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen flex flex-col`}>
        <RecaptchaProvider>
          {/* El Header aparecerá automáticamente en todas las vistas */}
          <Header />

          <main className="flex-1">
            {children}
          </main>
        </RecaptchaProvider>
      </body>
    </html>
  );
}