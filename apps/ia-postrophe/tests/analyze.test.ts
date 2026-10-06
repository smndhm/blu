import { analyzeText, formatSummary } from '../src/analyze';
import { config } from '../src/config';
import { describe, it, expect } from 'vitest';

describe('analyzeText', () => {
  it('should return no parts for an empty text', () => {
    const analysis = analyzeText('', config);
    expect(analysis.parts).toEqual([]);
    expect(analysis.iaTotal).toBe(0);
    expect(analysis.humanTotal).toBe(0);
  });

  it('should return the text untouched when there is nothing to highlight', () => {
    const analysis = analyzeText('Bonjour le monde', config);
    expect(analysis.parts).toEqual([{ text: 'Bonjour le monde' }]);
  });

  it('should split the text around AI and human characters', () => {
    const analysis = analyzeText("C’est c'est", config);
    expect(analysis.parts).toEqual([{ text: 'C' }, { text: '’', group: 'ia' }, { text: 'est c' }, { text: "'", group: 'human' }, { text: 'est' }]);
  });

  it('should detect every AI character', () => {
    for (const char of config.IAcharacters.characters) {
      const analysis = analyzeText(`a${char}b`, config);
      expect(analysis.parts[1]).toEqual({ text: char, group: 'ia' });
      expect(analysis.iaCounts.get(char)).toBe(1);
    }
  });

  it('should match "..." as a single human character', () => {
    const analysis = analyzeText('vraiment... vraiment…', config);
    expect(analysis.humanCounts).toEqual(new Map([['...', 1]]));
    expect(analysis.iaCounts).toEqual(new Map([['…', 1]]));
  });

  it('should count characters per group', () => {
    const analysis = analyzeText('« Bonjour » — "ok" ’’', config);
    expect(analysis.iaCounts).toEqual(
      new Map([
        ['«', 1],
        ['»', 1],
        ['—', 1],
        ['’', 2],
      ]),
    );
    expect(analysis.humanCounts).toEqual(new Map([['"', 2]]));
    expect(analysis.iaTotal).toBe(5);
    expect(analysis.humanTotal).toBe(2);
  });

  it('should keep line breaks', () => {
    const analysis = analyzeText('ligne 1\nligne 2', config);
    expect(analysis.parts.map(part => part.text).join('')).toBe('ligne 1\nligne 2');
  });
});

describe('formatSummary', () => {
  it('should say when no AI character is found', () => {
    expect(formatSummary(analyzeText('Bonjour', config))).toBe('Aucun caractère typographique IA trouvé.');
  });

  it('should list human characters when no AI character is found', () => {
    expect(formatSummary(analyzeText("c'est", config))).toBe("Aucun caractère typographique IA trouvé. Caractères saisis au clavier : ' × 1.");
  });

  it('should use singular for a single AI character', () => {
    expect(formatSummary(analyzeText('c’est', config))).toBe('1 caractère typographique IA trouvé : ’ × 1.');
  });

  it('should use plural and list human characters', () => {
    expect(formatSummary(analyzeText('c’est — "ok"', config))).toBe('2 caractères typographiques IA trouvés : ’ × 1, — × 1. Caractères saisis au clavier : " × 2.');
  });
});
