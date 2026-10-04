import { defineConfig } from 'astro/config';

// Set SITE_URL (e.g. in the Netlify UI) to the production origin so that
// canonical and hreflang links are emitted as absolute URLs.
const site = process.env.SITE_URL || process.env.URL || undefined;

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  devToolbar: { enabled: false },
});
