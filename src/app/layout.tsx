import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Anta, Quantico } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { VisibilityProvider } from "@/context/VisibilityContext";
import { AppNav } from "@/components/AppNav";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { ToastProvider } from "@/components/ui/Toast";
import { ConnectionWatcher } from "@/components/ConnectionWatcher";
import { SpeedInsights } from "@vercel/speed-insights/next"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

const anta = Anta({
  subsets: ["latin"],
  variable: "--font-anta",
  weight: ["400"],
});

const quantico = Quantico({
  subsets: ["latin"],
  variable: "--font-quantico",
  weight: ["400", "700"],
});

export const viewport: Viewport = {
  themeColor: "#0a070c", // coincide con la superficie neón real de la app
  width: "device-width",
  initialScale: 1,
  // Accesibilidad: bloquear el zoom impide ampliar texto a quien lo necesita.
  // Un máximo de 5x sigue evitando el zoom accidental al tocar inputs en iOS
  // siempre que la tipografía de los campos sea >= 16px.
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Nuestro Espacio Seguro",
  description: "Un diario y registro privado para nosotros.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "proyecto MS",
  },
  icons: {
    icon: "/icon-192x192.png",
    shortcut: "/icon-192x192.png",
    apple: "/icon-192x192.png",
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
      <body suppressHydrationWarning className={`${spaceGrotesk.variable} ${anta.variable} ${quantico.variable} font-sans antialiased text-[#fbdae0] bg-[#1f0e13] min-h-screen lg:pl-20 pb-app-nav`}>
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <ProfileProvider>
          <StoreProvider>
            <VisibilityProvider>
              <ToastProvider>
                <AppNav />
                <IOSInstallPrompt />
                <ConnectionWatcher />
                {children}
              </ToastProvider>
            </VisibilityProvider>
          </StoreProvider>
        </ProfileProvider>
      </body>
    </html>
  );
}
