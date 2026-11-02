import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * The site's stylesheet and scripts, each URL with a version made from its content (`/ds/styles.css?v=1a2b3c4d`):
 * a browser that cached the previous file loads the new one as soon as it changes, never a new page with an old
 * stylesheet. The files are the ones eleventy.config.js copies to these URLs.
 */
const sources = {
  '/ds/styles.css': 'node_modules/@dume/ds/dist/styles.css',
  '/js/ia-postrophe.js': 'node_modules/ia-postrophe/dist/ia-postrophe.js',
  '/js/heading-anchors.js': 'node_modules/@zachleat/heading-anchors/heading-anchors.js',
  '/js/lcs-cnvs.js': 'public/js/lcs-cnvs.js',
};

const version = file =>
  createHash('sha256')
    .update(readFileSync(new URL(`../${file}`, import.meta.url)))
    .digest('hex')
    .slice(0, 8);

export default Object.fromEntries(Object.entries(sources).map(([url, file]) => [url, `${url}?v=${version(file)}`]));
