import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import routePreload from './vite-route-preload.js'

export default defineConfig({
  plugins: [react(), tailwind(), routePreload()],
  build: {
    // เดิมมี manualChunks แยก recharts เป็นก้อน 'charts' แต่ทำให้ React ถูกดึงไปอยู่ในก้อนนั้นด้วย
    // ทุกหน้าจึงต้องโหลดไลบรารีกราฟ (~117 KB) — ลบออกแล้ว recharts จะโหลดเฉพาะหน้าที่มีกราฟ
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


