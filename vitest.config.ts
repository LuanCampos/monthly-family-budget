/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Cache directory (Vitest 4+ uses Vite's cacheDir)
  cacheDir: 'node_modules/.vitest',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    
    // Performance optimizations - vmThreads is faster for jsdom
    // Vitest 4+: poolOptions are now top-level under test
    pool: 'vmThreads',
    minWorkers: 4,
    maxWorkers: 8,
    
    fileParallelism: true,
    
    // Reduced timeouts
    testTimeout: 5000,
    hookTimeout: 5000,
    
    // Disable watch mode
    watch: false,
    
    // Faster reporter
    reporter: 'dot',
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'src/components/ui/**', // shadcn/ui components
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', '@testing-library/react'],
  },
  // Faster builds
  esbuild: {
    target: 'esnext',
  },
});
