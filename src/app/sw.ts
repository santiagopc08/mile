import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[];
  }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Background Push Notification handling
const swSelf = self as any;

swSelf.addEventListener("push", (event: any) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || "Nuestro Espacio";
    const options = {
      body: data.message || data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: data.url || "/notifications"
      }
    };
    event.waitUntil(swSelf.registration.showNotification(title, options));
  } catch (err) {
    console.error("Error processing push event:", err);
  }
});

swSelf.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    swSelf.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients: any[]) => {
      // Focus existing window matching URL if available
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (swSelf.clients.openWindow) {
        return swSelf.clients.openWindow(targetUrl);
      }
    })
  );
});

