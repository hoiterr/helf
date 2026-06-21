import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Library build: compiles the design system to dist/ (ES module + a single
// style.css). React is externalized so consumers (and Claude Design) provide it.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'HelfUI',
      formats: ['es'],
      fileName: (format) => `helf-ui.${format}.js`,
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
  },
});
