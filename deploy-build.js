#!/usr/bin/env node

// Simplified build script for deployment to avoid timeouts
import { build } from 'vite';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting optimized production build...');

try {
  // Build frontend with memory optimizations
  console.log('Building frontend...');
  await build({
    root: resolve(__dirname, 'client'),
    build: {
      outDir: resolve(__dirname, 'dist/public'),
      emptyOutDir: true,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            query: ['@tanstack/react-query'],
            icons: ['lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  // Build backend
  console.log('Building backend...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify', {
    stdio: 'inherit',
    cwd: __dirname
  });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}