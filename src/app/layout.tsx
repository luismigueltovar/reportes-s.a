import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reportes S.A Admin Panel",
  description: "Sistema Logístico y de Despacho",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full overflow-hidden flex`}>
        <Toaster position="top-right" />
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto bg-gray-50 text-slate-800">
          <div className="p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
