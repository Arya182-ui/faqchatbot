import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/faqchatbot/', // ✅ Ensures correct relative paths for assets
  plugins: [react()],
});
