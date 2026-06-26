import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import fs from "fs"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Custom micro-plugin to move index.html to Django templates after build finishes
    {
      name: 'move-html-to-templates',
      closeBundle() {
        const sourcePath = path.resolve(__dirname, '../nas_backend/static/index.html');
        const destDir = path.resolve(__dirname, '../nas_backend/templates');
        const destPath = path.resolve(destDir, 'index.html');

        // Check if the HTML file was generated
        if (fs.existsSync(sourcePath)) {
          // Ensure templates directory exists
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          // Move the file
          fs.renameSync(sourcePath, destPath);
          console.log(`\n✓ Successfully moved index.html to: ${destPath}\n`);
        }
      }
    }
  ],
  // base: '/static/',
  build: {
    // Compile all JS, CSS, and images straight into Django's static root
    outDir: path.resolve(__dirname, '../nas_backend/static'),
    emptyOutDir: true, // Delete old assets before building new ones
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
