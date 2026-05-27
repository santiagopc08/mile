import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { VisibilityProvider } from "@/context/VisibilityContext";
import { AppNav } from "@/components/AppNav";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const viewport: Viewport = {
  themeColor: "#f5f5f4", // matches stone-50 background
};

export const metadata: Metadata = {
  title: "Nuestro Espacio Seguro",
  description: "Un diario y registro privado para nosotros.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nuestro Espacio Seguro",
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
      <body suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased text-stone-800 bg-stone-50 dark:text-stone-200 dark:bg-stone-950 min-h-screen selection:bg-earth-soft selection:text-earth-dark lg:pl-20 pb-safe`}>
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
