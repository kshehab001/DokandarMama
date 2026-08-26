import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Sensible standalone defaults: PORT/BASE_PATH used to be required env vars
// (a Replit-specific wiring assumption). Any independent host â€” Docker,
// Render, Railway, a VPS â€” can now just run `vite build`/`vite preview`
// without setting anything, while CI/deploy scripts can still override them.
const port = Number(process.env.PORT ?? 5173);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

const basePath = process.env.BASE_PATH ?? '/';

// Replit-only editor integrations (error overlay, cartographer, dev banner).
// These only load when actually running inside a Replit workspace, so a
// standalone/independent deployment never pulls in or depends on them.
const onReplit = process.env.REPL_ID !== undefined;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    ...(onReplit
      ? [
          await import('@replit/vite-plugin-runtime-error-modal').then((m) =>
            m.default(),
          ),
          ...(process.env.NODE_ENV !== 'production'
            ? [
                await import('@replit/vite-plugin-cartographer').then((m) =>
                  m.cartographer({
                    root: path.resolve(import.meta.dirname, '..'),
                  }),
                ),
                await import('@replit/vite-plugin-dev-banner').then((m) =>
                  m.devBanner(),
                ),
              ]
            : []),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',

    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

