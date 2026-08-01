import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 3000 lo ocupa el dev server de Next.js de mile. Mantener puertos
    // separados permite correr ambos proyectos a la vez.
    port: 5173,
    strictPort: true,
    open: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  test: {
    // Acotado a este paquete: el repo raíz (mile) tiene su propia suite y sin
    // esto vitest la arrastraría al correr desde un cwd superior.
    root: __dirname,
    include: ['tests/**/*.test.{js,jsx}'],
  },
});
