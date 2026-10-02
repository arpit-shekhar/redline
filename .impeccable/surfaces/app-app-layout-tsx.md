---
version: 1
slug: "app-app-layout-tsx"
primary_target: "app/(app)/layout.tsx"
related_targets: []
---

# App shell

Mode: Operate. Behind sign-in. Brief only: no screen is built yet.

Holds: paste or upload a document; the result (summary, ranked flags, clean result); the question box; the reader's red lines and leverage; the library.

Task: read one document before signing it, check each flag against its source sentence, copy a counter-offer, ask the document a question. Usually one document per visit, often on a phone, often against a deadline.

World, carried from the landing page: the document is always the page, a white sheet. Flags are red (must-change) and yellow (worth-raising) tabs on its right edge in rank order. A tab's film tints its source sentence. The margin to the right of the sheet is the working column: the selected flag's note (text claim plainly, outcome claim marked uncertain, counter-offer with copy), then the question box. A narrow spine on the left holds navigation: new document, library, red lines. Ballpoint blue marks only the reader's own actions.

States:
- Empty: a blank sheet that is the paste area and file drop. The scan and too-long refusals are printed on the sheet in plain words.
- Reading: the sheet shows the text, and no tabs appear until the analysis has been checked.
- Clean: one grey tab reading "Nothing flagged", with the eight clause types listed as checked and not found.
- Withheld: one line saying how many flags were dropped because their sentence could not be found.
- Failed: a plain notice with a retry, and no partial tabs.

Library: a list of sheets, each showing its red and yellow tab counts on its edge and the date it was read.

Red lines: the eight defaults as an index of tabs that can be switched off or recoloured, plus the reader's own lines and the leverage question.

Phone: the sheet is full width, the tabs shrink to rank-numbered stubs on its edge, and the working column follows below the selected sentence. No modals.

Unresolved: the sign-in screen (ticket 09); the upload formats (ticket 04).
