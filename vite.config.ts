import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      '@tanstack/react-query',
      'wagmi',
      'wagmi/chains',
      'wagmi/connectors',
      'viem',
      'viem/chains',
      'connectkit',
      'framer-motion',
      'lucide-react',
      'sonner',
      'clsx',
      'tailwind-merge',
      'vite-plugin-node-polyfills/shims/buffer',
      'vite-plugin-node-polyfills/shims/global',
      'vite-plugin-node-polyfills/shims/process',
    ],
  },
  build: {
    rollupOptions: {
      // Third-party packages ship `/*#__PURE__*/` comments in positions Rollup cannot read.
      // They are harmless and not ours to fix, so only those are filtered out.
      onwarn(warning, warn) {
        if (warning.code === 'INVALID_ANNOTATION' && warning.id?.includes('node_modules')) return
        warn(warning)
      },
    },
    // The single large chunk is the starter's wallet stack (wagmi, ConnectKit, WalletConnect), which
    // `main.tsx` mounts for every page. Splitting it by hand creates circular chunks, so the limit
    // is raised just above its size instead. The donor app's own code is a small part of it.
    chunkSizeWarningLimit: 1500,
  },
  server: {
    allowedHosts: true,
    cors: true,
  },
})
