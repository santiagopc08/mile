import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mahjong',
    short_name: 'Mahjong',
    description: 'A beautiful Mahjong memory game',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f5f4', // stone-100
    theme_color: '#d6c6b3', // earth-base
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  };
}
