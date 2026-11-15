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

// Bis Impressum und Datenschutz online sind, soll Google die Seite nicht indexieren.
// Zum Livegang in Vercel VITE_ALLOW_INDEXING=true setzen und neu deployen.
function indexing(env) {
  const allow = (env.VITE_ALLOW_INDEXING || '').trim().toLowerCase() === 'true';
  return {
    name: 'limitless-indexing',
    transformIndexHtml(html) {
      if (allow) return html;
      return html.replace('<head>', '<head>\n  <meta name="robots" content="noindex, nofollow" />');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '');
  return { plugins: [siteUrl(env), indexing(env)] };
});
