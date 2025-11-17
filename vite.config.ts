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
      
      // --- THIS IS THE KEY CHANGE ---
      // We are switching to a custom service worker to handle push notifications
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts', // We will create this file next
      // ---------------------------------

      // Your existing manifest is perfect
      manifest: {
        name: 'AfuChat',
        short_name: 'AfuChat',
        description: 'Fast, text-only messaging platform',
        theme_color: '#1B9AAA',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/logo.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
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
      // The 'workbox' config is no longer needed here,
      // as we will define caching rules in our custom 'src/sw.ts' file.
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
}));
