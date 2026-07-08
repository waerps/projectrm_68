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

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwind()],
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