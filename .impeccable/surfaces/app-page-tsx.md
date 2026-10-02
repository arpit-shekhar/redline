---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/try/page.tsx"]
---

# Landing page

Mode: Persuade. Route `/`. The one action, "Try it on a document", leads to `/try`.

Audience: the freelancer or small business owner in PRODUCT.md, holding a document they are about to accept and probably cannot change. Job: decide whether Redline is worth pasting that document into.

Proof: a sample freelance agreement written for this page and labelled as a sample, read on screen into ranked flags. Every demo flag's sentence appears word for word in the sample text, and a test enforces it.

Constraints: no verdict on whether to sign, no legal advice, no scans or photos, only the four document types. No prices, customers, quotes or accuracy figures. Must not look like a legal-tech sales page, an AI startup page, or cute.

Memorable moment: tabs sticking onto the sample's sentences in rank order, and a tap on any tab lighting the exact sentence it came from.

Unresolved: `/try` gives a summary only until ticket 02 ships flags.

## Direction contract

THESIS: Redline marks a document the way a contract arrives marked for signing: a coloured tab stuck on the exact sentence that matters. It refuses the category's headline-beside-screenshot page with feature cards.

OWN-WORLD: One white laser-printed sheet on a cool grey desk. See-through adhesive tabs in tab red and tab yellow stick out past the sheet's right edge. A tab's film tints the sentence it marks. The contract text is set in a Georgia-metric serif, because that is how emailed agreements print. Tab labels, headings and controls are set in a condensed grotesk in caps. Ballpoint blue is reserved for the reader's own pen: focus rings and links. No cards, gradients or icons standing in for tabs.

STORY: The visitor sees their situation, a document already marked up. They believe it because each tab opens to a quoted sentence they can check in the sample. Then they press the red tab to try their own.

FIRST VIEWPORT: The sheet fills about two thirds of the width at the left. At its top is a letterhead with the wordmark and the try link. Below that is the headline, about 56px over two lines, one line of explanation, and the action, set as a large red tab. Then comes the labelled sample agreement at reading size. Its first tabs stick out into the grey margin, and the first flag's note is already open beside them.

FORM: Sign Here Tabs, first on my ordered list of seven, picked by the user over the rolled direction (seed key dbe1071b). Signature interaction: on load, tabs stick on one by one in rank order with an exponential ease-out from the sheet edge. Hovering, focusing or tapping a tab tints its sentence and opens its note. Motion grammar: that single entrance plus tab state changes, and nothing else moves.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
