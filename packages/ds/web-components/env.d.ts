// A stylesheet imported as its text, by Vite+ (`?inline`)
declare module '*.css?inline' {
  const css: string;
  export default css;
}
