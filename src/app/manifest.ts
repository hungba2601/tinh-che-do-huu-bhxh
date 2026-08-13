import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tính Chế Độ Hưu Theo Luật BHXH',
    short_name: 'Tính Lương Hưu',
    description: 'Ứng dụng tính chế độ hưu trí theo luật BHXH Việt Nam',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1a73e8',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
