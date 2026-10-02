import { crc32, deflateRawSync } from "node:zlib";

// Writes small PDF and Word files from plain text, for tests of text
// extraction. Nothing here uses a library: a PDF is written out by hand as
// text with a table of byte positions at the end, and a Word file (.docx) is
// a zip folder of XML files, zipped by a small zip writer below.
//
// The output is the same bytes every time for the same text, so the files
// kept in tests/fixtures/ can be checked against a fresh build.

// The files kept in tests/fixtures/, by name: the contract as a PDF and as a
// Word file, and a PDF and a Word file with no text in them, the way a
// scanned document arrives.
export function buildUploadFiles(contractText: string): Record<string, Uint8Array> {
  return {
    "adhesion-contract.pdf": buildPdf(layOutPages(contractText)),
    "adhesion-contract.docx": buildDocx(contractText),
    "scanned-page.pdf": buildPdf([{ scan: true }, { scan: true }]),
    "empty.docx": buildDocx(""),
  };
}

// ---------------------------------------------------------------------------
// PDF

// A US Letter page, in PDF points (1/72 inch).
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 36;
const FONT_SIZE = 10;
const LINE_HEIGHT = 12;
// Courier is a fixed-width font: every character is 0.6 of the font size
// wide, so a line of 90 characters fits the 540-point text width exactly.
const CHARACTERS_PER_LINE = 90;
const LINES_PER_PAGE = Math.floor((PAGE_HEIGHT - 2 * MARGIN) / LINE_HEIGHT);

// The PDF's built-in fonts read text in the Windows-1252 character set. These
// are the characters outside plain ASCII that the test documents use.
const WINDOWS_1252: Record<string, number> = {
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
};

// One page of a PDF: either lines of text, or a filled grey box standing in
// for a scanned image with no text in it.
export type PdfPage = { lines: string[] } | { scan: true };

// Lays out text the way a word processor would print it: each line of the
// text starts a new printed line, long lines wrap at a space, and a blank
// line stays blank. Then it is cut into pages.
export function layOutPages(text: string): PdfPage[] {
  const printed: string[] = [];
  for (const line of text.split("\n")) {
    printed.push(...wrap(line, CHARACTERS_PER_LINE));
  }
  const pages: PdfPage[] = [];
  for (let at = 0; at < printed.length; at += LINES_PER_PAGE) {
    pages.push({ lines: printed.slice(at, at + LINES_PER_PAGE) });
  }
  return pages;
}

function wrap(line: string, width: number): string[] {
  if (line.length <= width) return [line];
  const out: string[] = [];
  let rest = line;
  while (rest.length > width) {
    let cut = rest.lastIndexOf(" ", width);
    if (cut <= 0) cut = width;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^ /, "");
  }
  out.push(rest);
  return out;
}

// Builds a PDF file with one page per entry.
export function buildPdf(pages: PdfPage[]): Uint8Array {
  // Objects 1 to 3 are fixed. Each page then takes two: the page itself and
  // the drawing instructions on it.
  const pageIds = pages.map((_, index) => 4 + index * 2);
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
  ];
  for (const [index, page] of pages.entries()) {
    const stream = drawPage(page);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 3 0 R >> >> /Contents ${pageIds[index] + 1} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  }

  // Every string here holds one byte per character, so its length is its
  // size in bytes and the positions in the table at the end are exact.
  let file = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
  const offsets: number[] = [];
  for (const [index, body] of objects.entries()) {
    offsets.push(file.length);
    file += `${index + 1} 0 obj\n${body}\nendobj\n`;
  }
  const tableAt = file.length;
  file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) file += `${String(offset).padStart(10, "0")} 00000 n \n`;
  file += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${tableAt}\n%%EOF\n`;
  return Uint8Array.from(file, (char) => char.charCodeAt(0));
}

function drawPage(page: PdfPage): string {
  if ("scan" in page) {
    return `0.6 g ${MARGIN} ${MARGIN} ${PAGE_WIDTH - 2 * MARGIN} ${PAGE_HEIGHT - 2 * MARGIN} re f`;
  }
  const top = PAGE_HEIGHT - MARGIN - FONT_SIZE;
  const lines = page.lines.map((line) => (line === "" ? "T*" : `(${pdfString(line)}) Tj T*`));
  return [`BT /F1 ${FONT_SIZE} Tf ${LINE_HEIGHT} TL ${MARGIN} ${top} Td`, ...lines, "ET"].join("\n");
}

// Text inside a PDF string: brackets and backslashes are escaped, and each
// character becomes its single Windows-1252 byte.
function pdfString(line: string): string {
  let out = "";
  for (const char of line) {
    if (char === "(" || char === ")" || char === "\\") out += `\\${char}`;
    else if (char in WINDOWS_1252) out += String.fromCharCode(WINDOWS_1252[char]);
    else if (char >= " " && char <= "~") out += char;
    else throw new Error(`The PDF writer cannot print U+${char.codePointAt(0)!.toString(16)}.`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Word (.docx)

// Builds a Word file. A blank line in the text starts a new paragraph; a
// single line break inside a paragraph stays a line break.
export function buildDocx(text: string): Uint8Array {
  const paragraphs = text
    .split(/\n\n+/)
    .filter((paragraph) => paragraph !== "")
    .map((paragraph) => {
      const runs = paragraph
        .split("\n")
        .map((line) => `<w:t xml:space="preserve">${xmlText(line)}</w:t>`)
        .join("<w:br/>");
      return `<w:p><w:r>${runs}</w:r></w:p>`;
    });

  return buildZip([
    {
      name: "[Content_Types].xml",
      text:
        XML_HEADER +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        "</Types>",
    },
    {
      name: "_rels/.rels",
      text:
        XML_HEADER +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        "</Relationships>",
    },
    {
      name: "word/document.xml",
      text:
        XML_HEADER +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        `<w:body>${paragraphs.join("")}</w:body></w:document>`,
    },
  ]);
}

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function xmlText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// A zip file: each file's header and squeezed contents, then a directory
// listing every file, then a closing record that points to the directory.
function buildZip(files: { name: string; text: string }[]): Uint8Array {
  const parts: Buffer[] = [];
  const directory: Buffer[] = [];
  let offset = 0;
  // Every file is dated 1 January 1980, the earliest date a zip can hold, so
  // the bytes do not change from one build to the next.
  const time = 0;
  const date = (1 << 5) | 1;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const data = Buffer.from(file.text, "utf8");
    const squeezed = deflateRawSync(data);
    const checksum = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed to read it
    local.writeUInt16LE(0x0800, 6); // file names are UTF-8
    local.writeUInt16LE(8, 8); // squeezed with deflate
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(squeezed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, name, squeezed);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4); // version that made it
    entry.writeUInt16LE(20, 6); // version needed to read it
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt16LE(time, 12);
    entry.writeUInt16LE(date, 14);
    entry.writeUInt32LE(checksum, 16);
    entry.writeUInt32LE(squeezed.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE(offset, 42);
    directory.push(entry, name);

    offset += local.length + name.length + squeezed.length;
  }

  const directorySize = directory.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directorySize, 12);
  end.writeUInt32LE(offset, 16);

  return new Uint8Array(Buffer.concat([...parts, ...directory, end]));
}
