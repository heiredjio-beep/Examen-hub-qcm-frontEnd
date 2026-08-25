import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Port fige par le contrat d'interface : le backend n'autorise que
    // http://localhost:5173 en CORS. strictPort evite que Vite bascule
    // silencieusement sur 5174 et que toutes les requetes soient rejetees.
    port: 5173,
    strictPort: true,
  },
});
