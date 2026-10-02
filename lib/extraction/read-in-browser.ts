import { extractText, type Extraction } from "./extract.ts";

// Reads a file the reader chose or dropped, here in the browser. The file is
// never sent anywhere: only the text that comes back from this is.
//
// The PDF library is loaded the first time a file is read, not with the page,
// because it is large and most readers paste. It is loaded through the entry
// point pdfjs-dist provides for bundlers, which starts the library's worker
// (a background script that does the reading off the page's main thread).
export async function readFileInBrowser(file: File): Promise<Extraction> {
  const pdf = await import("pdfjs-dist/webpack.mjs");
  return extractText(file, pdf);
}
