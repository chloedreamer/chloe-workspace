import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chloe Workspace",
  description: "Personal workspace for managing tasks, notes, and schedule",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex font-[family-name:var(--font-inter)]">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="px-8 py-4 border-b border-rose-border bg-white/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-end">
            <GlobalSearch />
          </div>
          <div className="p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
