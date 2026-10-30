# Slides

Project for storing and building slides using [Marp](https://marp.app/).

## VS Code

Install [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode).  
To enable preview in VS Code, begin your markdown file with:

```markdown
---
marp: true
---
```

## Example

`example.md` shows the Marp syntax. It is kept outside `src/` so it is not built nor published with the slides.

## PDF

Marp prints each presentation as PDF with Chromium. `@dume/pdf-ua` (`packages/pdf-ua`) then completes it to conform to PDF/UA-1, the PDF accessibility standard: `pnpm build:pdf` does both, and so does the deployment. The Accessibility workflow checks the PDFs with veraPDF on every PR.

An image's alternative text is in the PDF: write one for each meaningful image, such as a link's icon (`[![w:24 Site de Lit](./assets/pictos/link.svg)](https://lit.dev/)`), which also gives the link's description.
