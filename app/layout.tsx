import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });
const ibmPlexCondensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-ibm-plex-condensed",
});

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
      <body className={`${inter.className} ${ibmPlexCondensed.variable}`}>
        <SolanaWalletProvider>
          <AuthSessionProvider>
            <ToastProvider>
              <div className="app-shell">
                <div className="app-shell-inner">
                  {/* Sidebar - fixed size like design mock (width 215, height 691) */}
                  <aside className="w-[215px] flex-shrink-0 flex items-start justify-center">
                    <div className="app-sidebar-surface w-[215px] mt-3 mb-3 fixed left-3 h-[calc(100vh-1.5rem)]">
                      <Sidebar />
                    </div>
                  </aside>

                  {/* Main content area - fills viewport; individual pages manage inner scrolling */}
                  <main className="flex-1 flex flex-col px-6 py-6 overflow-hidden">
                    {children}
                  </main>
                </div>
              </div>
            </ToastProvider>
          </AuthSessionProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
