/**
 * FORMA STUDIO DESTINATION — MUST BE SET BEFORE DEPLOYMENT.
 *
 * This is the only place the Forma Studio website URL is defined. It is used
 * by the Chapter 5 call to action and by the footer credit.
 *
 * While it is null, both render exactly as designed but without navigation
 * (no href). Replace null with the real URL, e.g. 'https://…', and do not
 * put an invented address here.
 */
export const FORMA_STUDIO_URL: string | null = null;

if (!FORMA_STUDIO_URL) {
  console.warn(
    '\n[NOVA] FORMA_STUDIO_URL is not set (src/config/site.ts). ' +
      'The Chapter 5 CTA and the footer credit do not link anywhere yet. ' +
      'Supply the real URL before deployment.\n',
  );
}

/** Shared by CSS (in the stylesheets) and by <picture> sources. */
export const DESKTOP_QUERY = '(min-width: 900px) and (orientation: landscape)';
