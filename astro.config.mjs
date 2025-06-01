// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import vercel from '@astrojs/vercel';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'server',
  adapter: vercel(),
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Finance Bros',
        short_name: 'Finance Bros',
        description: 'Finance Bros App',
        theme_color: '#ff00ff',
        background_color: '#ff22ff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024,

        // Fallback → "/" only for non‐login routes
        navigateFallback: '/',
        // Exclude /login/sign-in and /login/sign-up from the fallback allowlist
        navigateFallbackAllowlist: [
          // “Any path that does NOT start with /login/sign-in or /login/sign-up” 
          // will use navigateFallback: '/'. 
          // But /login/sign-in and /login/sign-up themselves will NOT match this, 
          // so they won't be force-redirected to '/' when offline.
          /^(?!\/login\/sign-(?:in|up)).*$/
        ],

        runtimeCaching: [
          {
            // API calls → network-first
            urlPattern: /^.*\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
            },
          },
          {
            // HTML navigations → network-first (but if offline and not cached, 
            // non-login pages will fall back to '/' because of navigateFallback)
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
            },
          },
          {
            // JS/CSS/Fonts → stale-while-revalidate
            urlPattern: /\.(?:js|css|woff2?)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
          {
            // Images → cache-first
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
            },
          },
          {
            // Everything else → network-first
            urlPattern: /.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fallback-cache',
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
});
