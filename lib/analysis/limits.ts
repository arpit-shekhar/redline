// The longest document Redline will analyse, in characters of text. The whole
// text goes to the model in one request, and a much longer one risks running
// past the time limit in model.ts. About 100,000 characters is roughly 40
// pages of a typical contract.
//
// This is the only place the limit is set. The /try page checks it before
// sending anything, for pasted and uploaded text alike, and the server checks
// it again before Analyse runs.
export const MAX_DOCUMENT_CHARACTERS = 100_000;

export function isTooLong(text: string): boolean {
  return text.length > MAX_DOCUMENT_CHARACTERS;
}

const count = (n: number) => n.toLocaleString("en-US");

// What the reader is told when a document is over the limit.
export function tooLongMessage(text: string): string {
  return (
    `This document is too long for Redline. It has ${count(text.length)} characters, ` +
    `and Redline reads up to ${count(MAX_DOCUMENT_CHARACTERS)}. Nothing was checked.`
  );
}

// The longest question Redline will take, in characters. A question is a
// sentence or two. This stops a whole document being pasted in as a question,
// which would get round the document limit above.
export const MAX_QUESTION_CHARACTERS = 500;
