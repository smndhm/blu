export interface Colors {
  text: string;
  textMuted: string;
  background: string;
  backgroundSurface: string;
  border: string;
  borderControl: string;
  primary: string;
  textOnPrimary: string;
}

export declare const colors: { light: Colors; dark: Colors };
export declare const fonts: { family: string; familyHeading: string; familyMonospace: string };
export declare const sizes: { radius: string };
export declare const outlines: { focus: string; offsetFocus: string };
/** The tokens as CSS custom properties on `selector` (`:root` by default, `:host` for a shadow root), the dark colors under `prefers-color-scheme: dark` */
export declare function cssVariables(selector?: string): string;
