import { readdir, readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import matter from 'gray-matter';

const slidesDir = new URL('../../slides/src/', import.meta.url);

/**
 * Talks listed on the site, read from the Marp presentations front matter.
 * Only presentations with an `event` field are listed.
 * Marp builds `<name>.html` and `<name>.pdf` into `/slides/`.
 */
export default async function () {
  const files = (await readdir(slidesDir)).filter(file => file.endsWith('.md'));

  const talks = await Promise.all(
    files.map(async file => {
      const { data } = matter(await readFile(new URL(file, slidesDir), 'utf8'));
      const slug = basename(file, '.md');
      return {
        slug,
        title: data.title,
        description: data.description,
        author: data.author,
        event: data.event,
        eventUrl: data.eventUrl,
        date: data.date ? new Date(data.date) : undefined,
        url: `/slides/${slug}.html`,
        pdf: `/slides/${slug}.pdf`,
      };
    }),
  );

  return talks.filter(talk => talk.event).sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
}
