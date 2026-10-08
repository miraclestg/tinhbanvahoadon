import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  base: './',
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pets.png'],
      manifest: {
        name: 'Tình Bạn Và Hóa Đơn',
        short_name: 'Friends & Bills',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f5f6f8',
        theme_color: '#1fa88e',
        icons: [
          { src: 'pets.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'] },
    }),
  ],
});
