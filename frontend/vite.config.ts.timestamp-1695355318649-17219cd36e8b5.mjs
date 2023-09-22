// vite.config.ts
import { defineConfig } from "file:///mnt/37F6E05C50F6ED97/Backy/projects/chatapp/frontend/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///mnt/37F6E05C50F6ED97/Backy/projects/chatapp/frontend/node_modules/vite-plugin-pwa/dist/index.mjs";
import tsconfigPaths from "file:///mnt/37F6E05C50F6ED97/Backy/projects/chatapp/frontend/node_modules/vite-tsconfig-paths/dist/index.mjs";
import react from "file:///mnt/37F6E05C50F6ED97/Backy/projects/chatapp/frontend/node_modules/@vitejs/plugin-react-swc/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "masked-icon.svg",
        "fonts/Montserrat-Arabic-Regular.ttf"
      ],
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,ttf}"]
      },
      devOptions: { enabled: true },
      manifest: {
        name: "Biogram chat-app",
        short_name: "Biogram",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        description: "Chat app built with react",
        theme_color: "#ffffff",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  server: { proxy: { "/api": "http://localhost:5000" } }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50LzM3RjZFMDVDNTBGNkVEOTcvQmFja3kvcHJvamVjdHMvY2hhdGFwcC9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL21udC8zN0Y2RTA1QzUwRjZFRDk3L0JhY2t5L3Byb2plY3RzL2NoYXRhcHAvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL21udC8zN0Y2RTA1QzUwRjZFRDk3L0JhY2t5L3Byb2plY3RzL2NoYXRhcHAvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocyc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djJztcbi8vXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgdHNjb25maWdQYXRocygpLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgaW5jbHVkZUFzc2V0czogW1xuICAgICAgICAnZmF2aWNvbi5pY28nLFxuICAgICAgICAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnLFxuICAgICAgICAnbWFza2VkLWljb24uc3ZnJyxcbiAgICAgICAgJ2ZvbnRzL01vbnRzZXJyYXQtQXJhYmljLVJlZ3VsYXIudHRmJyxcbiAgICAgIF0sXG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHR0Zn0nXSxcbiAgICAgIH0sXG4gICAgICBkZXZPcHRpb25zOiB7IGVuYWJsZWQ6IHRydWUgfSxcbiAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgIG5hbWU6ICdCaW9ncmFtIGNoYXQtYXBwJyxcbiAgICAgICAgc2hvcnRfbmFtZTogJ0Jpb2dyYW0nLFxuICAgICAgICBzdGFydF91cmw6ICcuJyxcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI2ZmZmZmZicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hhdCBhcHAgYnVpbHQgd2l0aCByZWFjdCcsXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnI2ZmZmZmZicsXG4gICAgICAgIGljb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAncHdhLTE5MngxOTIucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ3B3YS01MTJ4NTEyLnBuZycsXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdwd2EtNTEyeDUxMi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIHNlcnZlcjogeyBwcm94eTogeyAnL2FwaSc6ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnIH0gfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpVixTQUFTLG9CQUFvQjtBQUM5VyxTQUFTLGVBQWU7QUFDeEIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLFFBQVE7QUFBQSxNQUNOLGVBQWU7QUFBQSxRQUNiO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsY0FBYztBQUFBLE1BQ2QsU0FBUztBQUFBLFFBQ1AsY0FBYyxDQUFDLG9DQUFvQztBQUFBLE1BQ3JEO0FBQUEsTUFDQSxZQUFZLEVBQUUsU0FBUyxLQUFLO0FBQUEsTUFDNUIsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osV0FBVztBQUFBLFFBQ1gsU0FBUztBQUFBLFFBQ1Qsa0JBQWtCO0FBQUEsUUFDbEIsYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2IsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLHdCQUF3QixFQUFFO0FBQ3ZELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
