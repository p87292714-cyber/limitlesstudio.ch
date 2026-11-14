import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';

// Sustituye __SITE_URL__ en index.html por VITE_SITE_URL (dominio definitivo, sin barra final).
// Sin dominio configurado, las URLs quedan relativas y se avisa en la compilación.
function siteUrl(env) {
  const url = (env.VITE_SITE_URL || '').trim().replace(/\/$/, '');
  return {
    name: 'limitless-site-url',
    transformIndexHtml(html) {
      if (!url) {
        return html
          .replace(/<link rel="canonical"[^>]*>\s*/g, '')
          .replace(/<meta property="og:url"[^>]*>\s*/g, '')
          .replaceAll('__SITE_URL__', '');
      }
      return html.replaceAll('__SITE_URL__', url);
    },
    buildStart() {
      if (!url) this.warn('VITE_SITE_URL no está definido: canonical y og:url se omiten y og:image queda relativa.');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '');
  return { plugins: [siteUrl(env)] };
});
