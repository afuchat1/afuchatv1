import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      
      injectManifest: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2,json}']
      },

      manifest: {
        name: 'AfuChat',
        short_name: 'AfuChat',
        description: 'Fast, offline-first messaging platform',
        theme_color: '#00C2CB',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['social', 'communication'],
        prefer_related_applications: false,
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'New Post',
            short_name: 'Post',
            description: 'Create a new post',
            url: '/?action=new-post',
            icons: [{ src: '/logo.jpg', sizes: '192x192' }]
          },
          {
            name: 'Chats',
            short_name: 'Chats',
            description: 'Open your chats',
            url: '/chats',
            icons: [{ src: '/logo.jpg', sizes: '192x192' }]
          },
          {
            name: 'Notifications',
            short_name: 'Notifications',
            description: 'View notifications',
            url: '/notifications',
            icons: [{ src: '/logo.jpg', sizes: '192x192' }]
          }
        ]
      },
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
}));
