import { describe, expect, it } from 'vitest';
import { analyze, operators, wrap } from '../src/content.js';
import { parseToUnicode } from '../src/text.js';

const encode = text => new TextEncoder().encode(text);
const decode = bytes => new TextDecoder().decode(bytes);
// Each byte as its character, as a font without a ToUnicode map
const latin1 = (font, bytes) => String.fromCharCode(...bytes);

describe('operators', () => {
  it('reads operands: strings with escapes, hex strings, names, numbers, a dictionary', () => {
    const [bdc, tj, tjArray] = operators(encode('/P <</MCID 3>> BDC (a\\(b\\)\\101) Tj [<0041> -20 (c)] TJ'));
    expect(bdc).toMatchObject({ op: 'BDC', operands: [{ name: 'P' }, { name: 'MCID' }, { number: 3 }] });
    expect(decode(tj.operands[0].string)).toBe('a(b)A');
    expect(tjArray.operands.map(operand => (operand.string ? [...operand.string] : operand.number))).toEqual([[0, 0x41], -20, [0x63]]);
  });

  it('gives each operator its range, operands included', () => {
    const bytes = encode('q 0 0 10 10 re f Q');
    expect(operators(bytes).map(({ start, end }) => decode(bytes.subarray(start, end)))).toEqual(['q', '0 0 10 10 re', 'f', 'Q']);
  });

  it('skips an inline image', () => {
    expect(operators(encode('BI /W 1 /H 1 ID \u0000) EI Q')).map(({ op }) => op)).toEqual(['BI', 'Q']);
  });
});

describe('analyze', () => {
  it('finds a background painted outside tagged content, and the text of each MCID', () => {
    const bytes = encode('0 0 100 100 re f /P <</MCID 0>> BDC BT /F1 12 Tf (Hello) Tj ET EMC');
    const { units, textByMcid } = analyze(bytes, latin1);
    expect(units).toEqual([{ start: 0, end: 16, text: false, after: 0 }]);
    expect(textByMcid.get(0)).toBe('Hello');
  });

  it('knows the MCIDs around a text run, and keeps clipping paths out', () => {
    const bytes = encode('/Lbl <</MCID 0>> BDC 0 0 1 1 re W n EMC BT (x) Tj 1 0 Td (y) Tj ET /P <</MCID 1>> BDC BT (z) Tj ET EMC');
    const [unit, ...others] = analyze(bytes, latin1).units;
    expect(others).toEqual([]);
    expect(unit).toMatchObject({ text: true, before: 0, after: 1 });
    expect(decode(bytes.subarray(unit.start, unit.end))).toBe('(x) Tj 1 0 Td (y) Tj');
  });

  it('takes a marked content sequence that does not tag as a whole, such as an emoji with its actual text', () => {
    const bytes = encode('BT /Span <</ActualText <FEFF2705>>> BDC (e) Tj EMC ET');
    const [unit] = analyze(bytes, latin1).units;
    expect(unit.text).toBe(true);
    expect(decode(bytes.subarray(unit.start, unit.end))).toBe('/Span <</ActualText <FEFF2705>>> BDC (e) Tj EMC');
  });

  it('leaves artifacts and tagged content alone', () => {
    expect(analyze(encode('/Artifact BMC 0 0 1 1 re f EMC /P <</MCID 0>> BDC /X1 Do EMC'), latin1).units).toEqual([]);
  });
});

describe('wrap', () => {
  it('puts marked content around each unit', () => {
    const bytes = encode('0 0 1 1 re f /X1 Do');
    const wrapped = wrap(bytes, [
      { start: 13, end: 19, open: '/Artifact BMC' },
      { start: 0, end: 12, open: '/Span <</MCID 2>> BDC' },
    ]);
    expect(decode(wrapped)).toBe('/Span <</MCID 2>> BDC\n0 0 1 1 re f\nEMC /Artifact BMC\n/X1 Do\nEMC');
  });
});

describe('parseToUnicode', () => {
  it('reads single codes and ranges, two bytes per code', () => {
    const { codeLength, map } = parseToUnicode(`1 begincodespacerange <0000> <FFFF> endcodespacerange
2 beginbfchar <0003> <0020> <0004> <D83DDE2C> endbfchar
2 beginbfrange <0024> <0026> <0041> <0030> <0031> [<00E9> <00E8>] endbfrange`);
    expect(codeLength).toBe(2);
    expect([3, 4, 0x24, 0x26, 0x30, 0x31].map(code => map.get(code))).toEqual([' ', '😬', 'A', 'C', 'é', 'è']);
  });
});
