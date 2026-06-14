import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'proyecto MS',
    short_name: 'proyecto MS',
    description: 'Nuestro espacio seguro',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f5f4', // stone-100
    theme_color: '#d6c6b3', // earth-base
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
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
