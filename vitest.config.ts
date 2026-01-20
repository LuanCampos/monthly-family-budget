/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    
    // Performance optimizations - vmThreads is faster for jsdom
    pool: 'vmThreads',
    poolOptions: {
      vmThreads: {
        minThreads: 4,
        maxThreads: 8,
        memoryLimit: '512MB',
      },
    },
    
    fileParallelism: true,
    
    // Reduced timeouts
    testTimeout: 5000,
    hookTimeout: 5000,
    
    // Cache transforms
    cache: {
      dir: 'node_modules/.vitest',
    },
    
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
