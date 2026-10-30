/**
 * Makes a PDF printed by Chromium conform to PDF/UA-1 (ISO 14289-1), the accessibility standard that veraPDF checks.
 * Chromium tags the PDF (headings, paragraphs, lists, links, images and their alternative text), but misses some
 * requirements, added here:
 * - the painting it leaves untagged: a text run between two tagged contents of a same element, such as an emoji's text,
 *   joins that element; anything else, such as a background or a slide's number, is marked as an artifact;
 * - each list item's content goes in a list body (`LBody`), next to its label (`Lbl`);
 * - the structure types that PDF 1.7 doesn't define, such as `Strong`, are mapped to a standard one (`/RoleMap`);
 * - each link annotation gets an alternate description (`/Contents`): the link's text, read from its tagged content;
 * - an XMP metadata stream gives the title, the language and the PDF/UA identification.
 */
import { decodePDFRawStream, PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNull, PDFNumber, PDFRawStream, PDFRef } from 'pdf-lib';
import { analyze, wrap } from './content.js';
import { pageDecoder } from './text.js';

// The structure types of PDF 1.7 (ISO 32000-1, 14.8.4)
const standardTypes = new Set(
  'Document Part Art Sect Div BlockQuote Caption TOC TOCI Index NonStruct Private H H1 H2 H3 H4 H5 H6 P L LI Lbl LBody Table TR TH TD THead TBody TFoot Span Quote Note Reference BibEntry Code Link Annot Ruby RB RT RP Warichu WT WP Figure Formula Form'.split(
    ' ',
  ),
);

/** A structure element's kids: `/K` holds one or an array */
const kidsOf = element => {
  const kids = element.get(PDFName.of('K'));
  return kids instanceof PDFArray ? kids.asArray() : kids ? [kids] : [];
};

const typeOf = element => element.lookupMaybe(PDFName.of('S'), PDFName)?.decodeText();
const escapeXml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Each page's array in the parent tree, which gives the structure element of each of its MCIDs */
const parentArrays = (doc, structTreeRoot) => {
  const nums = structTreeRoot.lookup(PDFName.of('ParentTree'), PDFDict).lookup(PDFName.of('Nums'), PDFArray);
  const byKey = new Map();
  for (let index = 0; index < nums.size(); index += 2) byKey.set(nums.lookup(index, PDFNumber).asNumber(), nums.lookup(index + 1));
  return doc.getPages().map(page => {
    const key = page.node.get(PDFName.of('StructParents'));
    const array = key && byKey.get(key.asNumber());
    return array instanceof PDFArray ? array : undefined;
  });
};

/** The untagged painting of each page: a text run inside an element joins it, anything else becomes an artifact */
const tagContent = (doc, parents) => {
  const { context } = doc;
  const textByMcid = new Map();
  doc.getPages().forEach((page, pageIndex) => {
    const contents = page.node.get(PDFName.of('Contents'));
    const refs = contents instanceof PDFArray ? contents.asArray() : contents ? [contents] : [];
    const streams = refs.map(ref => context.lookup(ref, PDFRawStream));
    const bytes = Buffer.concat(streams.flatMap(stream => [decodePDFRawStream(stream).decode(), Buffer.from('\n')]));
    const analysis = analyze(bytes, pageDecoder(page));
    for (const [mcid, text] of analysis.textByMcid) textByMcid.set(`${page.ref}:${mcid}`, text);
    if (!analysis.units.length) return;

    const array = parents[pageIndex];
    const elementOf = mcid => (mcid === undefined ? undefined : array?.get(mcid));
    let nextMcid = array?.size() ?? 0;
    for (const unit of analysis.units) {
      const before = elementOf(unit.before);
      const after = elementOf(unit.after);
      const parent = before && after && context.lookup(before, PDFDict).get(PDFName.of('P'));
      if (!unit.text || !parent || parent.toString() !== context.lookup(after, PDFDict).get(PDFName.of('P'))?.toString()) {
        unit.open = '/Artifact BMC';
        continue;
      }
      // The text joins its element, as a span right before the content that follows it
      const mcid = nextMcid++;
      unit.open = `/Span <</MCID ${mcid}>> BDC`;
      const span = context.register(context.obj({ Type: 'StructElem', S: 'Span', P: parent, Pg: page.ref, K: mcid }));
      const parentDict = context.lookup(parent, PDFDict);
      const kids = kidsOf(parentDict);
      const position = kids.findIndex(kid => kid.toString() === after.toString());
      kids.splice(position === -1 ? kids.length : position, 0, span);
      parentDict.set(PDFName.of('K'), context.obj(kids));
      while (array.size() < mcid) array.push(PDFNull);
      array.push(span);
    }
    const stream = context.flateStream(wrap(bytes, analysis.units));
    if (refs.length === 1) context.assign(refs[0], stream);
    else page.node.set(PDFName.of('Contents'), context.register(stream));
  });
  return textByMcid;
};

/**
 * @param {Uint8Array} pdf The PDF printed by Chromium, tagged
 * @returns {Promise<Uint8Array>} The PDF/UA-1 file
 */
export default async function pdfUa(pdf) {
  // The producer and dates stay: the document information isn't updated
  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  const { context, catalog } = doc;
  const structTreeRoot = catalog.lookup(PDFName.of('StructTreeRoot'), PDFDict);
  const textByMcid = tagContent(doc, parentArrays(doc, structTreeRoot));

  // The structure tree: list items' content in a list body, the non-standard types collected, links described
  const nonStandardTypes = new Set();
  const walk = (ref, page) => {
    const element = context.lookup(ref);
    if (!(element instanceof PDFDict) || !element.has(PDFName.of('S'))) return '';
    const type = typeOf(element);
    if (type && !standardTypes.has(type)) nonStandardTypes.add(type);
    const elementPage = element.get(PDFName.of('Pg')) ?? page;
    const kids = kidsOf(element);
    // The element's text: its marked content's, its kids' (an MCID, a marked content reference or an element)
    const text = kids
      .map(kid => {
        if (kid instanceof PDFNumber) return textByMcid.get(`${elementPage}:${kid.asNumber()}`) ?? '';
        const dict = context.lookup(kid);
        if (dict instanceof PDFDict && dict.get(PDFName.of('Type'))?.toString() === '/MCR') {
          return textByMcid.get(`${dict.get(PDFName.of('Pg')) ?? elementPage}:${dict.lookup(PDFName.of('MCID'), PDFNumber).asNumber()}`) ?? '';
        }
        return walk(kid, elementPage);
      })
      .join('');
    // An image's alternative text replaces its content, such as a link's icon
    const alternative = element.lookup(PDFName.of('Alt')) ?? element.lookup(PDFName.of('ActualText'));
    const ownText = alternative?.decodeText?.() ?? text;

    if (type === 'Link') {
      const description = ownText.replaceAll(/\s+/g, ' ').trim();
      for (const kid of kids) {
        const objr = context.lookup(kid);
        if (!(objr instanceof PDFDict) || objr.get(PDFName.of('Type'))?.toString() !== '/OBJR') continue;
        const annotation = objr.lookup(PDFName.of('Obj'), PDFDict);
        const uri = annotation.lookupMaybe(PDFName.of('A'), PDFDict)?.lookup(PDFName.of('URI'))?.decodeText();
        annotation.set(PDFName.of('Contents'), PDFHexString.fromText(description || uri || ''));
      }
    }

    if (type === 'LI') {
      // The labels stay, the rest goes in a body
      const content = kids.filter(kid => !(kid instanceof PDFRef && context.lookup(kid) instanceof PDFDict && typeOf(context.lookup(kid)) === 'Lbl'));
      if (content.length && !(content.length === 1 && typeOf(context.lookup(content[0])) === 'LBody')) {
        if (content.some(kid => !(kid instanceof PDFRef) || !(context.lookup(kid) instanceof PDFDict) || !context.lookup(kid).has(PDFName.of('S')))) {
          throw new Error('A list item holds marked content directly: not supported');
        }
        const body = context.register(context.obj({ Type: 'StructElem', S: 'LBody', P: ref, K: content }));
        for (const kid of content) context.lookup(kid, PDFDict).set(PDFName.of('P'), body);
        // The body takes the place of the first kid it holds
        element.set(PDFName.of('K'), context.obj(kids.flatMap(kid => (kid === content[0] ? [body] : content.includes(kid) ? [] : [kid]))));
      }
    }
    return ownText;
  };
  for (const kid of kidsOf(structTreeRoot)) walk(kid);

  // Non-standard types, such as Chromium's Strong and Em: inline text, a span
  if (nonStandardTypes.size) {
    const roleMap = structTreeRoot.lookupMaybe(PDFName.of('RoleMap'), PDFDict) ?? context.obj({});
    for (const type of nonStandardTypes) roleMap.set(PDFName.of(type), PDFName.of('Span'));
    structTreeRoot.set(PDFName.of('RoleMap'), roleMap);
  }

  // XMP metadata: the title and language already in the document, and the PDF/UA-1 identification
  const title = escapeXml(doc.getTitle() ?? '');
  const lang = escapeXml(catalog.lookup(PDFName.of('Lang'))?.decodeText() ?? 'x-default');
  const xmp = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>
      <dc:language><rdf:Bag><rdf:li>${lang}</rdf:li></rdf:Bag></dc:language>
      <pdfuaid:part>1</pdfuaid:part>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  const metadata = context.stream(new TextEncoder().encode(xmp), { Type: 'Metadata', Subtype: 'XML' });
  catalog.set(PDFName.of('Metadata'), context.register(metadata));

  return doc.save();
}
