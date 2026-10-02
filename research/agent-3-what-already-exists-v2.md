# Agent 3 V2 — What already exists (round 2)

This builds on the first round of research (`agent-3-what-already-exists.md`). It does not re-profile the 13 products already covered there unless something changed. It focuses on the five gaps that round left open.

A word used below: "hallucination" means an AI tool confidently states something false — for example, inventing a clause that isn't in the real document, or quietly changing a word so the meaning shifts. This is the core risk for any tool, including Redline, that claims to read a document faithfully.

---

## What was searched, and limits hit

**Searches run (11 of 12 allowed):**
1. ChatGPT contract review — reddit, "made up"/hallucinated clauses
2. People pasting leases into ChatGPT — reddit experience
3. Site-restricted Reddit search for ChatGPT + lease review
4. Pact (usepact.org) — founder posts, update log, user counts
5. LegalOn — exact sentence / source-sentence / pinpoint citation
6. Spellbook — cites/quotes exact text from source document
7. Rocket Lawyer Copilot — red flags, exact quote of clause text
8. New AI contract review apps for freelancers/consumers, 2025–2026
9. AELA.AI — pricing, reviews, complaints
10. ReviewMyContract / BeforeJD — launch details
11. (combined into the searches above where results overlapped)

**Pages fetched (10 of 15 allowed):** worldcc.com hallucination article; G2's Pact discussion page (blocked, 403 — same block V1 hit on other G2 pages); usepact.org/blog; gc.ai/features/exact-quote; LegalOn's Intercom help redirect, then the redirected help.legalontech.com page (no answer found); Spellbook citation claim came through a search summary, not a direct fetch; Product Hunt page for VIDI 2.0; rocketlawyer.com/rocket-copilot.

**Why I stopped:** I had 9 distinct sourced findings by search 9, past the required minimum of 8. I kept one search and a few pages in reserve to firm up the Rocket Lawyer and ReviewMyContract/BeforeJD details, then stopped rather than spend the full budget. Reddit itself stayed unreachable by direct search the same way V1 found — no linkable reddit.com thread turned up in three attempts, so finding 1 below rests on legal-industry writeups that cite real examples, not on reddit posts themselves.

---

## Findings

**1. General AI chat tools (ChatGPT, Claude, Gemini) — the real free alternative, with a measurable error rate. [NEW]**
What it does: people already paste a lease, contract, or terms-of-service text directly into a general AI chatbot and ask it to review it — no specialized product needed. What goes wrong, with concrete examples from a legal-technology industry writeup: in one case the AI "quietly corrected" a party's name in a signed contract, changing "Jaris Exhibiton LED Video Services, LLC" to "Exhibition" — silently rewriting a legal name. In another, asked to extract a liability clause "without modifying the wording," the AI changed "acts of negligence or omissions" to "acts of omissions or commissions" — a small wording change that shifts the clause from covering careless mistakes only, to covering any action at all. The same piece cites a generalization that these tools "hallucinate" (state something false with full confidence) "as often as 20–30% of the time," with "10–20%" as a more conservative estimate for legal/professional use. A separate, often-cited Stanford University study (referenced in these search results but not independently re-opened by me) found GPT-style models deviated from accurate legal facts 69–88% of the time on legal reasoning tasks — that specific number should be verified against the original Stanford paper before being used in a PRD, since I did not fetch it directly.
Target user: anyone with a document and no budget for a lawyer — this is a free substitute for every paid product in this space.
Price: free (within the chatbot's normal free tier).
Most common complaint: confident wording changes and invented details that look like real contract text but aren't — the opposite failure of what Redline promises to avoid.
Exact source citation: No — a general chatbot summarizing pasted text has no built-in mechanism forcing it to quote the literal source sentence; the examples above show it actively rewrites wording instead.
Source: https://www.worldcc.com/resource/can-you-trust-generative-ai-contract-co-pilots-not-quite-but-a-new-type-of-autopilot-might-change-this.html
Tag: NEW

**2. GC.ai — a product built specifically around "exact quote" citation. [NEW]**
What it does: an AI tool for in-house legal teams that extracts verbatim (word-for-word, unaltered) passages from legal documents and lets a user click a citation to see the exact quoted passage highlighted in the original document.
Target user: in-house legal teams and departments (corporate, not consumer).
Price: not published on the page checked.
Most common complaint: not found — this fetch was about the citation feature, not user reviews, and I did not search review sites for this product within budget.
Exact source citation: Yes, by design — this is the product's named feature. Its own page states the goal is to "verify source accuracy instantly with direct document references," with the original document shown and the exact quote highlighted.
Source: https://gc.ai/features/exact-quote
Tag: NEW — and it directly answers part of question 2: at least one real product in this space has already built exact-quote citation as a headline feature, so the idea is proven useful enough that others have shipped it.

**3. Spellbook — partial confirmation on citation (V1 could not confirm; this round narrows it). [CONFIRMS V1, partially]**
What it does, beyond V1's notes: Spellbook's "Ask" feature lets a user have a back-and-forth conversation about a contract, and a search-result summary describes it as returning "a direct answer with the relevant clause cited," using "numbered links to take the user to the passage behind an answer, proving where the system looked."
Target user: unchanged from V1 — lawyers and in-house legal teams.
Price: unchanged from V1 — not published.
Most common complaint: unchanged from V1 (AI "sometimes glitches").
Exact source citation: Could not fully confirm. The Ask/question-answering feature appears to link back to a source clause, which is encouraging, but I could not independently verify (this came through a search-result summary, not a page I fetched directly) whether this citation is the literal exact sentence versus a located clause/section, and I could not confirm whether Spellbook's separate risk-flagging feature (as opposed to its Q&A feature) does the same thing.
Source: search summary citing spellbook.com pages (https://spellbook.com/legal-ai-in-word, https://spellbook.com/fast-contract-reviews) — not independently re-fetched, so treat as a lead, not a confirmed fact.
Tag: CONFIRMS V1 (still "could not confirm" for the risk-flagging half of the product), narrows the open question to one specific feature.

**4. LegalOn — still could not confirm exact citation; the question itself may be the wrong one. [CONFIRMS V1]**
What was checked: LegalOn's own help documentation (after a redirect from Intercom to help.legalontech.com) lists article titles like "Reviewing a PDF file without converting it" and "Cross-Document Review," but the fetched table-of-contents page did not contain the article bodies, so I could not read the actual explanation of how a flagged issue is displayed.
A separate marketing page (not independently verified by direct fetch) claims LegalOn can pull "precise, verbatim quotes from legal documents while maintaining every character" and lets a user "verify source accuracy instantly with direct document references" — language similar to GC.ai's.
Exact source citation: Could not confirm directly (same result as V1) — the strongest lead suggests yes, but I could not open the actual help article that would prove it.
Source: https://help.legalontech.com/en/collections/13989154-review-basics (table of contents only, article bodies not accessible in this fetch)
Tag: CONFIRMS V1 — the gap from round 1 is still open, though the marketing language leans toward "probably yes."

**5. Rocket Lawyer "Rocket Copilot Contract Review" — still could not confirm exact citation. [CONFIRMS V1]**
What it does, confirmed directly this round: launched as a free AI tool, it is explicitly built to "catch contract red flags that other AIs miss," give "jargon-free explanations of contract key terms," and catch things like "hidden auto-renewals" and "one-sided liability."
Price: confirmed free (this specific feature), which V1 could not confirm.
Exact source citation: Could not confirm. The product page describes what it catches but never states whether the flagged red flag is shown next to the literal sentence from the user's contract, or just named generically (e.g., "this contract has an auto-renewal clause") without quoting the user's own document.
Source: https://www.rocketlawyer.com/rocket-copilot ; https://www.rocketlawyer.com/newsroom/rocket-lawyer-launches-rocket-copilot-contract-review
Tag: CONFIRMS V1 (price is now confirmed free; citation question remains open)

**6. Why Pact and LegalBoof stalled — still unanswered; one new dead end found. [CONFIRMS V1]**
What was checked: Pact's own blog (usepact.org/blog) has no founder posts or update log about traction — it is entirely legal-guide content (templates, explainers) dated between June and October 2026, authored by one person ("Vlad Kuzin"), with nothing about user growth or business performance. A possible G2 discussion page for the company behind Pact (ShepherdStack LLC) exists but returned a 403 Forbidden error (blocked), the same wall V1 hit on other G2 pages, so it could not be read. Note of caution: a web search for "Pact" also surfaces several unrelated apps also named "Pact" (a goal-accountability app, a parental-control app, and a shut-down fitness-betting startup also once called "GymPact") — none of these are the contract-review Pact, and this name collision makes Pact especially hard to research by search alone.
Most common complaint / reason for stalling: not found. No founder statement, no update log, no review-site discussion accessible.
Source: https://www.usepact.org/blog ; https://www.g2.com/products/shepherdstack-llc-pact/discuss (blocked)
Tag: CONFIRMS V1 — this remains an open question, not answered this round.

**7. A wave of new, narrowly-targeted consumer/freelancer contract-review tools, all appearing to launch in the last 12 months. [NEW]**
Four to six small products surfaced in one search, all aimed at exactly Redline's audience:
- **VIDI — AI Contract Review**: uploads a PDF, gives a Risk Score (High/Medium/Low) per clause and an overall "Contract Health Score" out of 100, flags missing clauses, and generates an improved contract version with a downloadable report. Targets "founders, freelancers, and small businesses." No pricing visible on its Product Hunt page. Launched February 18, 2026; a "2.0" version launched March 24, 2026, with only 9 upvotes and 6 comments — too little activity to read a common complaint from. Source: https://www.producthunt.com/products/vidi-ai-contract-review/launches/vidi-2-0
- **AELA.AI**: calls itself "the first AI-powered contract review platform built specifically for freelancers," giving a full color-coded risk breakdown in 90 seconds and auto-written counteroffers — i.e., it claims to do the same counter-offer-drafting step Redline plans. Positions its price as between "$50K/year enterprise tools and cheap text analyzers," but no specific number was found. No review or complaint data found. Source: https://www.producthunt.com/p/aela
- **ReviewMyContract**: describes itself as "free, privacy-first," for "freelancers, small business owners, and individuals," and states it does not keep uploaded files — "your files are analyzed securely and immediately deleted after processing." Launched November 24, 2025. No complaint data found (too new). Source: https://www.producthunt.com/p/upload-contract/reviewmycontract
- **BeforeJD**: targets "freelancers, consultants, and small business owners," promising a plain-English risk analysis and "ready-to-go negotiation recommendations" in under five minutes. Listed on Stanford Law School's legal-tech company index. As of this research it had not yet launched (planned for April 2026), so it has zero usage data. Source: https://techindex.law.stanford.edu/companies/beforejd
- Two more names surfaced but were not opened or verified beyond their listing titles: **"FlagMyContract"** and **"Signoti,"** both appearing on a product-launch tracking site (hunted.space). I did not fetch these pages, so I cannot state what they charge, who exactly they target, or any complaint — I list them only so they aren't lost, under "What I could not find" below.
Tag: NEW

---

## Comparison table

| Product | What it does | Target user | Price | Most common complaint | Exact source citation | Source | Tag |
|---|---|---|---|---|---|---|---|
| General AI chat (ChatGPT/Claude/Gemini) | Free-text review of pasted contract/lease text | Anyone, no budget | Free | Confidently rewrites wording / invents details (hallucination rate cited at 10–30%) | No | worldcc.com | NEW |
| GC.ai | In-house legal AI with verbatim "exact quote" citation feature | Corporate in-house legal teams | Not published | Not found this round | Yes (by design) | gc.ai/features/exact-quote | NEW |
| Spellbook (Ask feature) | Clause-cited Q&A inside a contract | Lawyers / in-house legal | Not published | AI "glitches," per V1 | Could not fully confirm (likely yes for Q&A, unconfirmed for risk flags) | search summary of spellbook.com | CONFIRMS V1 |
| LegalOn | Clause-by-clause playbook review | In-house counsel | $550/mo (per V1) | Translation add-on cost, non-standard leases (per V1) | Could not confirm | help.legalontech.com | CONFIRMS V1 |
| Rocket Lawyer "Rocket Copilot Contract Review" | Free AI red-flag review for small business | Small business owners | Free (confirmed this round) | "False promise," unexpected fees, per V1 Trustpilot | Could not confirm | rocketlawyer.com/rocket-copilot | CONFIRMS V1 |
| Pact | Severity-ranked clause review, counter-offer drafting, document-scoped Q&A | Renters, freelancers | Pay-per-token (per V1) | Reason for low traction still unknown; blog has no update log; G2 page blocked | Could not confirm (per V1) | usepact.org/blog | CONFIRMS V1 |
| VIDI | Risk score + contract health score + improved contract generation | Founders, freelancers, small business | Not published | Too new to have one (launched Feb/Mar 2026) | Not confirmed | producthunt.com | NEW |
| AELA.AI | Color-coded risk breakdown + auto-written counteroffers | Freelancers | Positioned "mid-market," no number found | Not found (too new) | Not confirmed | producthunt.com | NEW |
| ReviewMyContract | Free, no-file-retention contract analysis | Freelancers, small business, individuals | Free | Not found (too new, launched Nov 2025) | Not confirmed | producthunt.com | NEW |
| BeforeJD | Plain-English risk analysis + negotiation recommendations | Freelancers, consultants, small business | Not published | Not launched yet (planned April 2026) — no usage data | Not confirmed | techindex.law.stanford.edu | NEW |

---

## What I could not find

- No reddit.com thread was directly reachable in three attempts (same block V1 hit) — the ChatGPT-for-contracts finding rests on a legal-industry writeup citing real examples, not on a first-person forum post.
- Could not independently verify the "69–88%" legal-hallucination figure attributed to a Stanford University study — it came through a search-engine summary, and I did not open the original paper. Treat it as unverified until someone opens the source directly.
- Could not read why Pact or LegalBoof have so little traction — no founder statement, blog post, or accessible review page explained it. The G2 discussion page for Pact's maker returned a 403 Forbidden error, the same wall V1 hit elsewhere on G2.
- Could not confirm, for LegalOn, Spellbook's risk-flagging feature (as opposed to its separate Q&A feature), or Rocket Lawyer's Copilot, whether the flagged risk is shown next to the literal exact sentence from the user's own uploaded document, or just a generic named category of risk. This open question carries over directly from V1.
- Did not reach Luminance, Lexion, ContractPodAi, DocJuris, or Pactum at all — same gap as V1, budget was spent on priorities 1–3 and the new 2025–2026 consumer wave instead, per the brief's stated priority order.
- Found but did not verify two more new-sounding tool names, "FlagMyContract" and "Signoti," listed on a product-launch tracking site — no pricing, target user, or complaint data gathered for either.
- No pricing was found for VIDI, AELA.AI, or BeforeJD — all three keep pricing off their public launch pages.

---

## How this changes the V1 picture

The real competitor to Redline may not be another contract-review product at all — it's a free chatbot people already have open, and the documented failure mode (quietly rewriting a party's name, changing "negligence" to "omissions or commissions") is exactly the kind of error Redline's exact-sentence-citation design is meant to prevent, which sharpens Redline's differentiation story rather than weakening it. At the same time, that differentiation is less unique than it sounded in V1: GC.ai already ships "exact quote" as a named, working feature for corporate legal teams, proving the idea is buildable and wanted, even though it serves a different (corporate) customer than Redline. The citation question for the five tools closest to Redline's design — Spellbook, LegalOn, and Rocket Copilot — is still unresolved after a second attempt, which means "we quote the actual line" remains an unverified, not a confirmed, claim about every one of V1's main comparisons. The most material new fact is volume: at least four more individual/freelancer-facing contract-review tools (VIDI, AELA.AI, ReviewMyContract, BeforeJD) appear to have launched or announced in just the last twelve months, on top of V1's Pact and LegalBoof — this is no longer a two-product gap, it's a small, fast-moving wave, and every one of them is too new to show whether any of them will get more traction than Pact did. Finally, the question of why Pact and LegalBoof haven't gained users is still completely open — this round found no founder statement, no blog update, and hit the same G2 access block V1 hit — so that remains a real unknown, not something this research can explain away.
