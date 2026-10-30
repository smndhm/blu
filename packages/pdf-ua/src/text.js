/**
 * The text of a page's strings, from its fonts' ToUnicode maps: Chromium embeds each font as a subset, its codes being
 * glyph numbers, and maps them back to Unicode.
 */
import { decodePDFRawStream, PDFDict, PDFName, PDFRawStream } from 'pdf-lib';

const hexText = hex => String.fromCharCode(...(hex.match(/.{4}/g) ?? []).map(unit => Number.parseInt(unit, 16)));

/** A ToUnicode CMap: its codes' length in bytes, and the text of each code */
export function parseToUnicode(cmap) {
  const map = new Map();
  const codeLength = /begincodespacerange\s*<([0-9a-f]+)>/i.exec(cmap)?.[1].length / 2 || 1;
  for (const [, block] of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const [, code, text] of block.matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]*)>/gi)) map.set(Number.parseInt(code, 16), hexText(text));
  }
  for (const [, block] of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const [, low, high, target] of block.matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]+)>\s*(<[0-9a-f]*>|\[[^\]]*\])/gi)) {
      const first = Number.parseInt(low, 16);
      const last = Number.parseInt(high, 16);
      if (target.startsWith('[')) {
        const texts = [...target.matchAll(/<([0-9a-f]*)>/gi)].map(([, hex]) => hexText(hex));
        texts.forEach((text, offset) => map.set(first + offset, text));
      } else {
        // The last UTF-16 unit counts up through the range
        const base = hexText(target.slice(1, -1));
        for (let code = first; code <= last; code++) {
          map.set(code, base.slice(0, -1) + String.fromCharCode(base.charCodeAt(base.length - 1) + code - first));
        }
      }
    }
  }
  return { codeLength, map };
}

/**
 * A page's decoder: the text of a string shown in one of its fonts, by the font's resource name
 * @returns {(font: string, bytes: Uint8Array) => string}
 */
export function pageDecoder(page) {
  const fonts = page.node.Resources()?.lookupMaybe(PDFName.of('Font'), PDFDict);
  const cache = new Map();
  const cmapOf = name => {
    if (cache.has(name)) return cache.get(name);
    const font = name && fonts?.lookupMaybe(PDFName.of(name), PDFDict);
    const stream = font?.lookupMaybe(PDFName.of('ToUnicode'), PDFRawStream);
    const type0 = font?.get(PDFName.of('Subtype'))?.toString() === '/Type0';
    const cmap = stream ? parseToUnicode(new TextDecoder('latin1').decode(decodePDFRawStream(stream).decode())) : undefined;
    // Without a map: one byte per character, read as Latin-1
    const decoder = cmap ?? { codeLength: type0 ? 2 : 1, map: new Map() };
    cache.set(name, decoder);
    return decoder;
  };
  return (name, bytes) => {
    const { codeLength, map } = cmapOf(name);
    let text = '';
    for (let index = 0; index + codeLength <= bytes.length; index += codeLength) {
      let code = 0;
      for (let offset = 0; offset < codeLength; offset++) code = code * 256 + bytes[index + offset];
      text += map.get(code) ?? (codeLength === 1 ? String.fromCharCode(code) : '');
    }
    return text;
  };
}
