import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwind()],
  build: {
    rollupOptions: { output: { manualChunks(id) {
      if (id.includes('/node_modules/recharts/') || id.includes('/node_modules/recharts-scale/') || id.includes('/node_modules/d3-') || id.includes('/node_modules/victory-vendor/')) return 'charts';
    } } },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    proxy: {
      "/api/chat": {
        target: "http://localhost:5678",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/chat/,
            "/webhook/chat-webhook-sornserm-003/chat"
          ),
      },
    },
  },
})

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
// import flowbiteReact from "flowbite-react/plugin/vite";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss(), flowbiteReact()],

// })

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwind from '@tailwindcss/vite'

// export default defineConfig({
//   plugins: [react(), tailwind()],
// })

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwind from '@tailwindcss/vite'

// export default defineConfig({
//   plugins: [react(), tailwind()],
//   server: {
//     proxy: {
//       "/api/chat": {
//         target: "http://localhost:5678",
//         changeOrigin: true,
//         rewrite: (path) =>
//           path.replace(
//             /^\/api\/chat/,
//             "/webhook/chat-webhook-sornserm-003/chat"
//           ),
//       },
//     },
//   },
// })


