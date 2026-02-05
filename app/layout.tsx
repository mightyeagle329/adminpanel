import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Multi-Source News Admin Panel",
  description: "Admin panel for managing multi-source news tracking and generating AI prediction questions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SolanaWalletProvider>
          <AuthSessionProvider>
            <ToastProvider>
              <div className="flex h-screen overflow-hidden bg-gray-950">
                {/* Sidebar - fixed width on desktop, hidden on mobile */}
                <aside className="hidden lg:block w-56 flex-shrink-0 border-r border-gray-800">
                  <Sidebar />
                </aside>

                {/* Main content area - scrollable */}
                <main className="flex-1 overflow-y-auto bg-gray-950">
                  {children}
                </main>
              </div>
            </ToastProvider>
          </AuthSessionProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
