import type { Config } from './config';

export type Part = {
  text: string;
  group?: 'ia' | 'human';
};

export type Analysis = {
  parts: Part[];
  iaCounts: Map<string, number>;
  humanCounts: Map<string, number>;
  iaTotal: number;
  humanTotal: number;
};

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sum = (counts: Map<string, number>) => [...counts.values()].reduce((total, count) => total + count, 0);

export const analyzeText = (text: string, { IAcharacters, humanCharacters }: Config): Analysis => {
  const allChars = [...IAcharacters.characters, ...humanCharacters.characters];
  const regex = new RegExp('(' + allChars.map(escapeRegExp).join('|') + ')', 'g');

  const iaCounts = new Map<string, number>();
  const humanCounts = new Map<string, number>();
  const parts: Part[] = [];
  let lastIndex = 0;

  for (const { 0: match, index } of text.matchAll(regex)) {
    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index) });
    }
    const group = IAcharacters.characters.includes(match) ? 'ia' : 'human';
    const counts = group === 'ia' ? iaCounts : humanCounts;
    counts.set(match, (counts.get(match) ?? 0) + 1);
    parts.push({ text: match, group });
    lastIndex = index + match.length;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }

  return { parts, iaCounts, humanCounts, iaTotal: sum(iaCounts), humanTotal: sum(humanCounts) };
};

const formatCounts = (counts: Map<string, number>) => [...counts.entries()].map(([char, count]) => `${char} × ${count}`).join(', ');

export const formatSummary = ({ iaCounts, humanCounts, iaTotal, humanTotal }: Analysis): string => {
  const human = humanTotal > 0 ? ` Caractères saisis au clavier : ${formatCounts(humanCounts)}.` : '';
  if (iaTotal === 0) {
    return `Aucun caractère typographique IA trouvé.${human}`;
  }
  const s = iaTotal > 1 ? 's' : '';
  return `${iaTotal} caractère${s} typographique${s} IA trouvé${s} : ${formatCounts(iaCounts)}.${human}`;
};
