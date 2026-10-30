export type CharacterGroup = {
  color: string;
  characters: string[];
};

export type Config = {
  IAcharacters: CharacterGroup;
  humanCharacters: CharacterGroup;
};

export const config: Config = {
  IAcharacters: {
    color: 'yellow',
    characters: ['’', '‘', '—', '«', '»', '“', '”', '…'],
  },
  humanCharacters: {
    color: 'limegreen',
    characters: ["'", '"', '...'],
  },
};
