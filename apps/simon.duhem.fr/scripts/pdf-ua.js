/**
 * Makes a PDF printed by Chromium conform to PDF/UA-1 (ISO 14289-1), the accessibility standard that veraPDF checks.
 * Chromium tags the PDF (headings, paragraphs, lists, links) but misses four requirements, added here:
 * - each link annotation gets an alternate description (`/Contents`): the link's text, from `links`;
 * - each list item's content goes in a list body (`LBody`): a list item may only hold a label and a body;
 * - the structure types that PDF 1.7 doesn't define, such as `Strong`, are mapped to a standard one (`/RoleMap`);
 * - an XMP metadata stream gives the title, the language and the PDF/UA identification.
 */
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFRef } from 'pdf-lib';

// The structure types of PDF 1.7 (ISO 32000-1, 14.8.4)
const standardTypes = new Set(
  'Document Part Art Sect Div BlockQuote Caption TOC TOCI Index NonStruct Private H H1 H2 H3 H4 H5 H6 P L LI Lbl LBody Table TR TH TD THead TBody TFoot Span Quote Note Reference BibEntry Code Link Annot Ruby RB RT RP Warichu WT WP Figure Formula Form'.split(
    ' ',
  ),
);

// A structure element's kids: `/K` holds one or an array
const kidsOf = element => {
  const kids = element.get(PDFName.of('K'));
  return kids instanceof PDFArray ? kids.asArray() : kids ? [kids] : [];
};

const escapeXml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/**
 * @param {Uint8Array} pdf The PDF printed by Chromium, tagged
 * @param {Map<string, string>} links Each link's text, by its URL, as in the PDF: absolute
 * @returns {Promise<Uint8Array>} The PDF/UA-1 file
 */
export default async function pdfUa(pdf, links) {
  // Chromium's producer and dates stay: the document information isn't updated
  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  const { context, catalog } = doc;
  const structTreeRoot = catalog.lookup(PDFName.of('StructTreeRoot'), PDFDict);

  // Links: their text as their alternate description
  for (const page of doc.getPages()) {
    for (const annotation of page.node.lookupMaybe(PDFName.of('Annots'), PDFArray)?.asArray() ?? []) {
      const dict = context.lookup(annotation, PDFDict);
      const uri = dict.lookupMaybe(PDFName.of('A'), PDFDict)?.lookup(PDFName.of('URI'))?.decodeText();
      const text = links.get(uri);
      if (!text) throw new Error(`No text for the link to ${uri}`);
      dict.set(PDFName.of('Contents'), PDFHexString.fromText(text));
    }
  }

  // The structure tree: list items' content in a list body, the non-standard types collected
  const nonStandardTypes = new Set();
  // Marked content attached to a list item, which would move to its body: its parent in the parent tree changes
  const movedParents = new Map();
  const walk = ref => {
    const element = context.lookup(ref);
    if (!(element instanceof PDFDict)) return;
    const type = element.lookupMaybe(PDFName.of('S'), PDFName)?.decodeText();
    if (type && !standardTypes.has(type)) nonStandardTypes.add(type);
    const kids = kidsOf(element);
    kids.forEach(walk);
    if (type !== 'LI' || !kids.length) return;
    const body = context.obj({ Type: 'StructElem', S: 'LBody', P: ref, K: kids });
    const page = element.get(PDFName.of('Pg'));
    if (page) body.set(PDFName.of('Pg'), page);
    const bodyRef = context.register(body);
    for (const kid of kids) {
      if (kid instanceof PDFRef && context.lookup(kid) instanceof PDFDict && context.lookup(kid, PDFDict).has(PDFName.of('S'))) {
        context.lookup(kid, PDFDict).set(PDFName.of('P'), bodyRef);
      } else {
        movedParents.set(ref.toString(), bodyRef);
      }
    }
    element.set(PDFName.of('K'), bodyRef);
  };
  kidsOf(structTreeRoot).forEach(walk);
  if (movedParents.size) {
    const nums = structTreeRoot.lookup(PDFName.of('ParentTree'), PDFDict).lookup(PDFName.of('Nums'), PDFArray);
    const swap = value => movedParents.get(value.toString()) ?? value;
    for (let index = 1; index < nums.size(); index += 2) {
      const value = nums.get(index);
      const array = value instanceof PDFArray ? value : value instanceof PDFRef ? context.lookup(value) : undefined;
      if (array instanceof PDFArray) array.asArray().forEach((item, position) => array.set(position, swap(item)));
      else nums.set(index, swap(value));
    }
  }

  // Non-standard types, such as Chromium's Strong and Em: inline text, a span
  if (nonStandardTypes.size) {
    const roleMap = structTreeRoot.lookupMaybe(PDFName.of('RoleMap'), PDFDict) ?? context.obj({});
    for (const type of nonStandardTypes) roleMap.set(PDFName.of(type), PDFName.of('Span'));
    structTreeRoot.set(PDFName.of('RoleMap'), roleMap);
  }

  // XMP metadata: the title and language already in the document, and the PDF/UA-1 identification
  const title = escapeXml(doc.getTitle() ?? '');
  const lang = catalog.lookup(PDFName.of('Lang'))?.decodeText() ?? 'x-default';
  const xmp = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${title}</rdf:li></rdf:Alt></dc:title>
      <dc:language><rdf:Bag><rdf:li>${escapeXml(lang)}</rdf:li></rdf:Bag></dc:language>
      <pdfuaid:part>1</pdfuaid:part>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  const metadata = context.stream(new TextEncoder().encode(xmp), { Type: 'Metadata', Subtype: 'XML' });
  catalog.set(PDFName.of('Metadata'), context.register(metadata));

  return doc.save();
}
