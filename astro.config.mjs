// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import vercel from '@astrojs/vercel';
import { VitePWA } from 'vite-plugin-pwa';

// https://astro.build/config
export default defineConfig({
	vite: {
    plugins: [tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto'
      })
    ],
  },
  output: 'server',
  adapter: vercel(),
});
