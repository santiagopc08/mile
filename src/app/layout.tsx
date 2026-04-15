import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { NavBar } from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  themeColor: "#f5f5f4", // matches stone-50 background
};

export const metadata: Metadata = {
  title: "A Safe Space",
  description: "A private journal and track record.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "A Safe Space",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased text-stone-800 bg-stone-50 dark:text-stone-200 dark:bg-stone-950 min-h-screen selection:bg-earth-soft selection:text-earth-dark`}>
        <StoreProvider>
          <ProfileProvider>
            <NavBar />
            {children}
          </ProfileProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
