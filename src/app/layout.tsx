import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { VisibilityProvider } from "@/context/VisibilityContext";
import { AppNav } from "@/components/AppNav";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const viewport: Viewport = {
  themeColor: "#f5f5f4", // matches stone-50 background
};

export const metadata: Metadata = {
  title: "A Safe Space",
  description: "A private journal and track record.",
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
      <body suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} font-sans antialiased text-stone-800 bg-stone-50 dark:text-stone-200 dark:bg-stone-950 min-h-screen selection:bg-earth-soft selection:text-earth-dark lg:pl-20 pb-safe`}>
        <StoreProvider>
          <ProfileProvider>
            <VisibilityProvider>
              <AppNav />
              <IOSInstallPrompt />
              {children}
            </VisibilityProvider>
          </ProfileProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
