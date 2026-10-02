import mammoth from "mammoth";
import type { getDocument, TextItem } from "pdfjs-dist/types/src/display/api";

// Text extraction (spec, "Seams", seam 2): a file in, its text out.
//
// The text has to be a faithful copy of the file, because every flag's source
// sentence is checked against it word for word (ADR 0001). So this code only
// joins the pieces a file stores its text in back into lines and paragraphs.
// It never fixes spelling or punctuation. The text itself is the position
// information: a source sentence is found again as a start and end offset
// into it (SourceLocation in lib/analysis/types.ts).
//
// This file runs in the browser, and in Node for tests. The PDF library is
// passed in because each place loads a different build of it: the browser
// one is set up in read-in-browser.ts.

// A file with fewer letters, digits and punctuation marks than this per page,
// on average, has no usable text. It is most likely a scan: pictures of
// pages, which Redline does not read. A Word file counts as one page.
export const MIN_TEXT_PER_PAGE = 100;

export type FileKind = "pdf" | "word";

export type Extraction =
  | { status: "read"; kind: FileKind; text: string }
  // The file has no usable text, so it is treated as a scan.
  | { status: "scan" }
  // Not a PDF or a Word (.docx) file.
  | { status: "not-supported" }
  // A PDF or Word file that could not be opened: damaged, or locked with a
  // password.
  | { status: "unreadable" };

export type PdfLibrary = { getDocument: typeof getDocument };

// The parts of a browser File this needs. Node tests build one from bytes.
export type FileInput = {
  name: string;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
};

const WORD_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function kindOf(file: { name: string; type: string }): FileKind | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type === WORD_TYPE || name.endsWith(".docx")) return "word";
  return null;
}

export async function extractText(file: FileInput, pdf: PdfLibrary): Promise<Extraction> {
  const kind = kindOf(file);
  if (!kind) return { status: "not-supported" };

  let read: { text: string; pages: number };
  try {
    const bytes = await file.arrayBuffer();
    read = kind === "pdf" ? await pdfText(bytes, pdf) : await wordText(bytes);
  } catch {
    return { status: "unreadable" };
  }

  const text = read.text.trim();
  if (!hasUsableText(text, read.pages)) return { status: "scan" };
  return { status: "read", kind, text };
}

export function hasUsableText(text: string, pages: number): boolean {
  const marks = text.replace(/\s/g, "").length;
  return marks > 0 && marks / Math.max(pages, 1) >= MIN_TEXT_PER_PAGE;
}

// ---------------------------------------------------------------------------
// PDF

// A PDF stores text as separate pieces placed on the page. Pieces that sit on
// the same line are joined as they are. A new line starts where the PDF
// library marks the end of a line, or where the next piece sits lower on the
// page. A gap well over one line high starts a new paragraph, marked by a
// blank line, and so does each new page.
export async function pdfText(
  bytes: ArrayBuffer,
  pdf: PdfLibrary,
): Promise<{ text: string; pages: number }> {
  // The library takes ownership of the bytes it is given, so it gets a copy.
  const task = pdf.getDocument({ data: new Uint8Array(bytes.slice(0)), verbosity: 0 });
  const document = await task.promise;
  try {
    const pages: string[] = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      pages.push(joinPieces(content.items.filter(isTextItem)));
      page.cleanup();
    }
    return { text: pages.filter((page) => page !== "").join("\n\n"), pages: document.numPages };
  } finally {
    await task.destroy();
  }
}

function isTextItem(item: object): item is TextItem {
  return "str" in item;
}

// How far below the last line, in multiples of the text height, the next
// line has to start to count as a new paragraph.
const PARAGRAPH_GAP = 1.6;

function joinPieces(items: TextItem[]): string {
  let text = "";
  // Where the line being written sits on the page (its baseline), and the
  // baseline of the line before it.
  let lineY: number | null = null;
  let atLineStart = true;

  for (const item of items) {
    const y = item.transform[5];
    const height = item.height || Math.abs(item.transform[3]) || 1;

    if (item.str !== "") {
      if (lineY !== null && !atLineStart && Math.abs(y - lineY) > height / 2) {
        text += "\n";
        atLineStart = true;
      }
      if (atLineStart && lineY !== null && text !== "" && lineY - y > PARAGRAPH_GAP * height) {
        text += "\n";
      }
      text += item.str;
      lineY = y;
      atLineStart = false;
    }
    if (item.hasEOL && !atLineStart) {
      text += "\n";
      atLineStart = true;
    }
  }
  return text.trim();
}

// ---------------------------------------------------------------------------
// Word

// Mammoth reads the Word file. Its own plain-text output drops line breaks
// inside a paragraph, which joins the words on either side into one
// ("other" and "representative" become "otherrepresentative"). So this walks
// the document mammoth read and writes the text out itself, the way mammoth
// does, except that a line break stays a line break.
//
// Mammoth hands over the document it read only on the way to making HTML.
// The text is taken at that point and the HTML step is given an empty
// document, since the HTML is not used.
export async function wordText(bytes: ArrayBuffer): Promise<{ text: string; pages: number }> {
  let text = "";
  await mammoth.convertToHtml(
    // Mammoth's browser build reads `arrayBuffer` and its Node build reads
    // `buffer`. Both accept the same bytes.
    { arrayBuffer: bytes, buffer: new Uint8Array(bytes) as unknown as Buffer },
    {
      transformDocument: (document: WordElement) => {
        text = wordElementText(document);
        return { ...document, children: [] };
      },
    },
  );
  return { text, pages: 1 };
}

// One part of a Word document as mammoth reads it: a paragraph, a run of
// text, a table and so on, each holding its parts in `children`.
type WordElement = {
  type: string;
  value?: string;
  children?: WordElement[];
};

function wordElementText(element: WordElement): string {
  switch (element.type) {
    case "text":
      return element.value ?? "";
    case "tab":
      return "\t";
    case "break":
      return "\n";
    default: {
      const inner = (element.children ?? []).map(wordElementText).join("");
      return element.type === "paragraph" ? `${inner}\n\n` : inner;
    }
  }
}
