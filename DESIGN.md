---
name: Redline
description: A printed sheet on a desk, marked with sign-here tabs on the exact sentences that matter.
colors:
  desk: "#d3d7dc"
  sheet: "#fbfcfc"
  ink: "#1b1b1a"
  ink-soft: "#50545a"
  rule: "#d3d6da"
  sheet-edge: "#b4bac2"
  tab-red: "rgb(205 8 0 / 0.85)"
  tab-red-ink: "#fff7f4"
  tab-yellow: "rgb(243 184 0 / 0.85)"
  tab-yellow-ink: "#1b1b1a"
  film-red: "rgb(205 8 0 / 0.1)"
  film-red-strong: "rgb(205 8 0 / 0.2)"
  film-yellow: "rgb(244 194 27 / 0.3)"
  film-yellow-strong: "rgb(244 194 27 / 0.58)"
  pen: "#1f3a93"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.8vw, 3.5rem)"
    fontWeight: 750
    lineHeight: 0.95
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 72"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.3rem + 1.6vw, 2.75rem)"
    fontWeight: 750
    lineHeight: 1
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 72"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 750
    lineHeight: 1.33
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 72"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body-small:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  document:
    fontFamily: "Gelasio, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
  document-quote:
    fontFamily: "Gelasio, Georgia, serif"
    fontSize: "clamp(1.35rem, 1.1rem + 1vw, 1.9rem)"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 72"
  label-small:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 750
    lineHeight: 1.33
    letterSpacing: "0.04em"
    fontVariation: "'wdth' 72"
rounded:
  none: "0px"
  film: "2px"
  control: "4px"
spacing:
  desk-mobile: "12px"
  desk-tablet: "24px"
  desk-wide: "32px"
  sheet-left-mobile: "20px"
  sheet-left-tablet: "48px"
  sheet-left-wide: "64px"
  sheet-right-mobile: "56px"
  sheet-right-tablet: "80px"
  sheet-right-wide: "96px"
  between-sheets-mobile: "32px"
  between-sheets-tablet: "48px"
  between-sheets-wide: "64px"
  margin-column: "368px"
  page-max: "1344px"
components:
  tab-forward-large:
    backgroundColor: "{colors.tab-red}"
    textColor: "{colors.tab-red-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "16px 44px 16px 24px"
  tab-forward-medium:
    backgroundColor: "{colors.tab-red}"
    textColor: "{colors.tab-red-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 40px 12px 20px"
  edge-tab-must-change:
    backgroundColor: "{colors.tab-red}"
    textColor: "{colors.tab-red-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 12px 0 20px"
    height: "40px"
    width: "200px"
  edge-tab-worth-raising:
    backgroundColor: "{colors.tab-yellow}"
    textColor: "{colors.tab-yellow-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 12px 0 20px"
    height: "40px"
    width: "200px"
  film-must-change:
    backgroundColor: "{colors.film-red}"
    textColor: "{colors.ink}"
    typography: "{typography.document}"
    rounded: "{rounded.film}"
    padding: "0 2px"
  film-must-change-active:
    backgroundColor: "{colors.film-red-strong}"
  film-worth-raising:
    backgroundColor: "{colors.film-yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.document}"
    rounded: "{rounded.film}"
    padding: "0 2px"
  film-worth-raising-active:
    backgroundColor: "{colors.film-yellow-strong}"
  sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "64px 96px 64px 64px"
  flag-note:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "16px 20px 20px 20px"
  field:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  link:
    textColor: "{colors.pen}"
    typography: "{typography.body-small}"
---

# Design System: Redline

## Overview

**Creative North Star: "The Sign-Here Sheet"**

Every Redline screen is one white printed sheet lying on a cool grey desk. The document being read is the sheet. When something in it matters, a coloured adhesive tab is stuck beside the exact sentence, the way a contract arrives from a lawyer marked "sign here". The tab is see-through film, so the sentence it marks is tinted in the same colour. Red tabs mark must-change flags. Yellow tabs mark worth-raising flags. Ballpoint blue is the reader's own pen, and appears only where the reader acts.

The world is quiet and literal. Text sits on paper at a comfortable reading size, with wide margins. Depth comes from paper resting on a desk: soft shadows, a thin visible paper edge on the right, and tabs that stick out past that edge onto the grey. Contract text is set in a serif that matches Georgia's letter widths, because that is how emailed agreements usually print. Everything Redline itself says (headings, tab labels, controls) is set in narrow, heavy capitals, like the print on a stationery tab.

Motion is spare. On first load the tabs stick on one at a time in rank order, sliding in from the right and settling. After that, only tab state changes move: a tab nudges toward the sheet when chosen, its sentence's tint deepens, and its note slides level with it. Nothing else animates.

**Key Characteristics:**
- One sheet per surface, square-cornered, on a grey desk.
- Tabs are the only strong colour, and colour always means severity (red or yellow) or the reader's own action (blue).
- A tab is always attached to something: a sentence, a row, or an action.
- Two voices: a Georgia-like serif for the document, condensed capitals for Redline.
- One entrance animation, then only state changes.

## Colors

A near-colourless paper world where the only saturated colours are the tab films and the reader's pen.

### Primary
- **Tab Red** (rgb 205 8 0 at 85% opacity): the must-change tab, and the main action drawn as a forward-pointing tab ("Try it on a document", "Summarise it"). Its label is printed in **Tab Red Ink** (#fff7f4), a warm off-white. The film is slightly see-through, so the sheet's edge shows through where a tab crosses it.
- **Red Film** (rgb 205 8 0 at 10%, deepening to 20% when active): the tint a must-change tab casts on its source sentence.

### Secondary
- **Tab Yellow** (rgb 243 184 0 at 85% opacity): the worth-raising tab. Its label is printed in **Ink** (#1b1b1a), never white.
- **Yellow Film** (rgb 244 194 27 at 30%, deepening to 58% when active): the tint a worth-raising tab casts on its source sentence. The strong yellow film is also the text selection colour.

### Tertiary
- **Ballpoint Blue** (#1f3a93): the reader's pen. Links, the focus ring around anything the keyboard has reached, and the text cursor in fields. Nothing else.

### Neutral
- **Cool Grey Desk** (#d3d7dc): the page background that every sheet rests on. Tabs stick out onto it.
- **Laser Paper** (#fbfcfc): the sheet, the flag note, and the fill of every field.
- **Toner Black** (#1b1b1a): all main text, document text, and the yellow tab's label.
- **Faded Toner** (#50545a): secondary text such as small print, field hints, clause numbers and captions. Also the border of form fields.
- **Ruled Line** (#d3d6da): thin dividing lines on the sheet, under the letterhead and between list rows.
- **Paper Edge** (#b4bac2): the one-pixel line on the sheet's right side where tabs cross it.

### Named Rules
**The Colour Means Severity Rule.** Red and yellow appear only as tabs and their film, and they always mean must-change and worth-raising. The red forward tab for the main action is the single exception, because it is still a tab. Never use red or yellow for decoration, warnings unrelated to a flag, or emphasis.

**The Reader's Pen Rule.** Ballpoint blue marks only the reader's own actions: links, focus rings and the text cursor. Redline's own voice never writes in blue.

**The Film Contrast Rule.** Tab colours are chosen so labels keep at least 4.5 to 1 contrast (the minimum readable ratio for small text) over both the sheet and the desk. Red tabs take off-white labels; yellow tabs take black ones.

## Typography

**Display Font:** Archivo, using its width setting at 72% for narrow capitals (with system-ui, sans-serif as fallback)
**Body Font:** Archivo at normal width (with system-ui, sans-serif)
**Document Font:** Gelasio, a free serif built to the same letter widths as Georgia (with Georgia, serif)

**Character:** Redline speaks in the narrow, heavy capitals printed on stationery tabs, and explains in a plain sans serif. The document speaks in the serif it was most likely emailed in, so the reader recognises their own paperwork.

### Hierarchy
- **Display** (weight 750, 72% width, capitals, 2rem growing to 3.5rem, line height 0.95): the one headline at the top of a surface.
- **Headline** (weight 750, 72% width, capitals, 1.75rem growing to 2.75rem, line height 1): section headings on later sheets.
- **Title** (weight 750, 72% width, capitals, 1.25rem on phones and 1.5rem wider): a document's own title, and result headings.
- **Body** (weight 400, 1.125rem, line height 1.625, at most 62 characters per line): Redline's explanations. Clause type names inside rows use weight 600.
- **Small body** (weight 400, 0.875rem, Faded Toner): fine print, field hints, the letterhead link.
- **Document** (Gelasio, weight 400, 1.0625rem, line height 1.7, at most 62 characters per line): the text of the document being read.
- **Document quote** (Gelasio, 1.35rem growing to 1.9rem, line height 1.5, at most 34 characters per line): a single source sentence shown large, with its film.
- **Label** (weight 750, 72% width, capitals, 0.8125rem, letter spacing 0.04em): tab labels, clause numbers and headings inside the document, form labels.
- **Small label** (weight 750, 72% width, capitals, 0.75rem, Faded Toner): captions naming where a quote came from, and severity words beside a row.
- **Wordmark** ("Redline" in the Label style at 1.125rem with wider letter spacing of 0.08em): the letterhead, top left of every sheet.

### Named Rules
**The Two Voices Rule.** The document is always in the serif. Redline is always in Archivo. A source sentence quoted anywhere, including inside a note, keeps the serif so it reads as the document's own words.

**The Printed Caps Rule.** Narrow capitals are for headings, tab labels, controls and short captions only. Never set a sentence of explanation in them.

## Layout

The page is a grey desk with a little padding (12px on phones, 24px from 640px wide, 32px from 1024px wide). On it, each section of a long page is its own sheet, stacked with gaps between them (32px, 48px, then 64px).

From 1024px wide, every sheet sits in a two-column grid capped at 1344px: the sheet on the left, and a 368px margin column on the right. Tabs stick out from the sheet's right edge into that margin, and the open flag's note sits in the margin level with the tab that opened it. Below 1024px the margin column disappears: the sheet fills the width, tabs shrink to short stubs showing only their rank number, and the open note drops into the sheet just below its clause.

A sheet has more padding on the right than the left (left 20px, 48px, 64px; right 56px, 80px, 96px) so there is room for a tab's pointed end to land on paper before the tab crosses the edge. Text inside a sheet is held to 56 to 62 characters per line. Within a sheet, spacing is loose: 20px between paragraphs, 40px to 64px between blocks, and thin ruled lines rather than boxes to separate rows.

A single-purpose page with no tabs, such as the paste page, uses one narrower sheet (896px wide at most) centred on the desk, with no margin column.

**The Sheet Is The Page Rule.** A surface is a sheet on a desk, never a dashboard of panels. When the signed-in app is built, the document stays the sheet, the margin column to its right becomes the working column (the selected flag's note, then the question box), and any navigation is a narrow strip on the left of the desk, not a second sheet.

## Elevation & Depth

Depth is physical and shallow: paper resting on a desk, and film stuck on paper. There are exactly two shadows, both soft and close, both cast by Toner Black at low strength. Nothing floats high above the page and nothing uses a hard, solid offset shadow.

### Shadow Vocabulary
- **Sheet shadow** (`box-shadow: 0 1px 2px rgb(27 27 26 / 0.08), 0 12px 32px rgb(27 27 26 / 0.1)`): every sheet and every flag note. On sheets that carry tabs it is paired with a one-pixel Paper Edge line on the inside right (`inset -1px 0 0 #b4bac2`).
- **Tab shadow** (`box-shadow: 0 1px 1px rgb(27 27 26 / 0.12), 0 3px 8px rgb(27 27 26 / 0.12)`): every tab, so it reads as a strip of film lifted slightly off the paper.

### Named Rules
**The Two Layers Rule.** Paper sits on the desk; film sits on the paper. A note is a second slip of paper and takes the sheet shadow. There is no third, higher layer, and no pop-up windows.

## Shapes

Paper is cut square. Sheets and notes have no rounded corners at all. Tabs are cut with a pointed end: a tab marking a sentence points left toward the sentence (a 14px point), and a tab that is an action points right, toward where it leads (an 18px point). Film on a sentence has a barely softened 2px corner and follows the line breaks of the text, so each wrapped line is tinted separately. Form fields have a small 4px corner. Rows and sections are divided with one-pixel ruled lines, never with boxes. The final call to action sits on a thin black line running from the tab, like the line you sign on.

## Components

### Buttons (the forward tab)
The main action is drawn as a red tab pointing right, not as a rounded button.
- **Shape:** square on three sides, pointed on the right (18px point). The surrounding link or button has a 4px corner so the focus ring is not clipped.
- **Primary:** Tab Red with an off-white label in narrow capitals. Large size is 1.125rem text with 16px top and bottom padding; the form size is 1rem with 12px.
- **Hover / Focus:** the tab slides 4px to the right over 200ms. Focus shows a 2px Ballpoint Blue ring, 3px outside the link.
- **Busy:** the label changes to say what is happening and the tab fades to 70% strength.
- There is no secondary button style yet. Other links are plain underlined Ballpoint Blue text.

### Edge tabs (signature component)
A strip of see-through coloured film stuck on the sheet's right edge, beside the sentence or row it marks.
- **Shape:** pointed on the left (14px point), 40px tall and 200px wide from 1024px up; 36px tall and only as wide as the rank number below that.
- **Colour:** red for must-change, yellow for worth-raising. The label shows the rank number, then the severity in narrow capitals. On narrow screens only the number shows, so the severity word must appear in the row's own text.
- **Placement:** the pointed end lands on the paper, the rest sticks out onto the desk. Each tab lines up with the middle of the first line of its sentence.
- **Entrance:** once per page load, tabs slide in from 32px to the right and fade in over 560ms, in rank order, starting 350ms after load and 160ms apart, with a fast-then-gentle ease-out curve.
- **States:** hovering, focusing or tapping a tab chooses it. A chosen tab sits 6px further onto the sheet, its sentence's film deepens, and its note opens.

### Film (marked sentence)
- **Style:** the tab's colour at low strength behind the source sentence, Toner Black text on top, 2px of padding at each side.
- **State:** deepens when its flag is chosen, over 180ms. Tapping the sentence chooses its flag too.

### Cards / Containers (the sheet and the note)
- **Corner Style:** square (0px).
- **Background:** Laser Paper.
- **Shadow Strategy:** sheet shadow, see Elevation & Depth.
- **Border:** none, except the Paper Edge line on sheets that carry tabs.
- **Internal Padding:** sheet as in Layout; note 16px top, 20px sides and bottom.
- **The note:** opens beside its tab in the margin column and slides to stay level with it over 260ms. It holds the flag's rank, severity and clause type, then short labelled parts ("What it says", "What it might do"), then the source sentence in the serif with a caption naming its clause.

### Inputs / Fields
- **Style:** Laser Paper fill, one-pixel Faded Toner border, 4px corner. Labels sit above in narrow capitals; hints sit below the label in small Faded Toner text. The document text box uses the serif, because what is pasted is the document.
- **Focus:** 2px Ballpoint Blue ring, 3px outside the field. The text cursor is Ballpoint Blue.
- **Error:** a plain notice on paper with a thin red border, in ordinary words. No icon.

### Navigation (the letterhead)
- **Style:** the top of every sheet is a letterhead: the wordmark at left, one plain link or note at right, and a ruled line beneath. The wordmark links home on inner pages. There is no menu bar on the public pages.

## Do's and Don'ts

### Do:
- **Do** put every surface on a Laser Paper sheet (#fbfcfc) resting on the Cool Grey Desk (#d3d7dc), with square corners and the sheet shadow.
- **Do** attach every tab to the exact sentence or row it marks, pointed end toward it, sticking out past the sheet's right edge.
- **Do** tint the source sentence with the film of its tab's colour, and deepen the film when the flag is chosen.
- **Do** set document text, and any quote from it, in Gelasio at a comfortable reading size.
- **Do** keep Ballpoint Blue (#1f3a93) for links, focus rings and the text cursor only.
- **Do** keep motion to the single tab entrance and tab state changes, and switch both off when the reader's device asks for reduced motion.

### Don't:
- **Don't** use red or yellow for anything but a tab, its film, or the forward action tab.
- **Don't** draw a rounded card, a bordered box or a pill as a container or a button. A container is a sheet or a slip of paper; a button is a tab.
- **Don't** use gradients, icons or illustrations to stand in for a tab or a flag.
- **Don't** add a hard, solid offset shadow, or any shadow stronger than the sheet shadow.
- **Don't** set Redline's explanations in the serif, or the document's words in Archivo.
- **Don't** show a tab whose source sentence is not on the sheet.
