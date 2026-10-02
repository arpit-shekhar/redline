// pdfjs-dist's entry point for bundlers starts the library's worker and then
// exports the library unchanged, but it ships without type information. These
// are the library's own types.
declare module "pdfjs-dist/webpack.mjs" {
  export * from "pdfjs-dist";
}
