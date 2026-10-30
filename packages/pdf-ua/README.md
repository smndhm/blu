# @dume/pdf-ua

Completes the PDFs printed by Chromium (Playwright's `page.pdf({ tagged: true })`, Marp) to conform to PDF/UA-1 (ISO 14289-1), the PDF accessibility standard, as checked by [veraPDF](https://verapdf.org/). Private: the CV (`apps/simon.duhem.fr/scripts/cv-pdf.js`) and the slides (`apps/slides`) use it.

Chromium tags the PDF (headings, paragraphs, lists, links, images and their alternative text, language) but misses some requirements, which this adds without changing how the PDF looks:

- the painting Chromium leaves untagged: a text run between two tagged contents of a same element, such as an emoji's text in a list item, joins that element; anything else, such as a slide's background, its number or an emoji's image, is marked as an artifact;
- each list item's content in a list body (`LBody`), next to its label (`Lbl`);
- the structure types that PDF 1.7 doesn't define, such as `Strong`, mapped to `Span`;
- each link's alternate description: its text, or its image's alternative text, read from the PDF's tags;
- an XMP metadata stream: the title, the language and the PDF/UA identification.

## Usage

```sh
pdf-ua file.pdf other.pdf # in place
```

```js
import pdfUa from '@dume/pdf-ua';

const pdf = await pdfUa(await page.pdf({ tagged: true }));
```

## Files

- `src/index.js`: the completion, on the structure tree and each page.
- `src/content.js`: a content stream's operators, the painting that no marked content tags, and the marked content around it.
- `src/text.js`: the text of a string, from its font's ToUnicode map.
- `src/cli.js`: the `pdf-ua` command.

## Check

```sh
pnpm --filter @dume/pdf-ua test
docker run --rm -v "$PWD:/data" verapdf/cli:v1.30.3 --flavour ua1 --format text --verbose --loglevel 0 /data/file.pdf
```
