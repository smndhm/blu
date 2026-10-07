import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import Image from '@11ty/eleventy-img';

export default {
  /**
   * Social sharing image URL: the `ogImage` front matter (relative to the page),
   * else the first local image of an article, resized to 1200px wide at most.
   */
  ogImageUrl: async data => {
    if (data.ogImage) return data.page.url + data.ogImage;
    if (data.layout !== 'layouts/post.njk') return;

    const content = await readFile(data.page.inputPath, 'utf8');
    const [, src] = content.match(/!\[[^\]]*\]\(\.\/([^)\s]+)\)/) ?? [];
    if (!src) return;

    const images = await Image(join(dirname(data.page.inputPath), src), {
      widths: [1200],
      formats: ['auto'],
      outputDir: join(data.eleventy.directories.output, data.page.url),
      urlPath: data.page.url,
    });
    return Object.values(images)[0][0].url;
  },
};
