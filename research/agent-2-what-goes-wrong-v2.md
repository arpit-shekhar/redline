# Agent 2, round 2 — What goes wrong (filling V1's gaps)

This is a second pass on the same question: which contract clause types actually
cause the most real-world pain, and how do we know? It builds on
`agent-2-what-goes-wrong.md` (V1) and does not re-collect anything V1 already
found. V1 ranked 8 clause types; this round chases V1's stated gaps: kill fees
(a fee owed if a freelance job is cancelled early), unlimited-revision clauses,
exclusivity clauses, fee escalators (built-in price increases), data and
privacy terms, one-sided termination rights (only one side can end the deal
early), intellectual property (IP — ownership of the work) assignment as its
own problem, hard numbers for indemnity/liability clauses, and anything from
2025-2026 that changes the auto-renewal or non-compete picture.

## Method

- **Web searches run:** 12 (the full guardrail budget).
- **Pages read in full:** 3. One (jobbers.io) returned "403 Forbidden" and
  could not be read beyond its search-result snippet. The other two
  (coverageopinions.info, brookings.edu) loaded fully.
- **Stopped when:** the search budget ran out (12/12) and 9 distinct, sourced
  findings had been collected, past the 8-finding minimum the guardrail asks
  for.
- **What was blocked:** direct page reads of ftc.gov were not attempted again
  (V1 already documented they 403; this round relied on search-result text
  and secondary sources that quote FTC data directly, same approach as V1).
  jobbers.io's full article could not be opened — its specific frequency
  numbers, if any, are not verified and are not used below beyond what the
  search snippet showed.

## Findings

### 1. Kill fees — still no hard data (OPINION, confirms the V1 gap)
**What it is:** a fee a client owes a freelancer if a project is cancelled
partway through, usually a percentage (commonly cited as 25%–50%) of the
remaining contract value, meant to cover work already done and the lost
chance to take other jobs.
**Evidence found:** industry how-to pages (Workmade, Crunch, Columbia's
Kernochan Center for Entertainment, Media and Intellectual Property Law) all
describe kill fees and the typical 25%-50% range, and describe them as a
frequent source of friction when a project ends early. None of them cite a
complaint count, survey, or court-case dataset. This is professional opinion
and industry convention, not a measured statistic.
**Source:** https://www.workmade.com/blog/kill-fee ; https://crunch.co.uk/knowledge/article/kill-fees-explained
**Date read:** October 2026 (pages undated/evergreen).
**Tag:** CONFIRMS V1 (V1 flagged this as unresearched; this round researched
it and still found no hard number — the gap stands, now confirmed rather than
just unreached).

### 2. Unlimited-revision clauses — no hard data, anecdotal only (OPINION)
**What it is:** a freelance contract clause that lets the client demand
endless free rounds of rework instead of a capped number of revisions.
**Evidence found:** no survey or complaint-count data exists on this specific
clause. What exists is first-person anecdotes on freelancer community forums
(Upwork's and Fiverr's own community boards) describing clients demanding
7-8+ revision rounds without a clear definition of "done," and advice pages
recommending designers cap revisions at 2 rounds. This is a real, recurring
complaint pattern but entirely qualitative — no one has counted it.
**Source:** https://community.upwork.com/t5/Freelancers/Client-not-satisfying-with-my-Designs/m-p/649503 ; https://community.fiverr.com/public/forum/boards/start-here-c9d/posts/306387-unlimited-revisions-problem-in-custom-offer
**Date read:** October 2026.
**Tag:** NEW (V1 never reached this topic).

### 3. IP (intellectual property — who owns the finished work) assignment — still cannot be isolated as its own measured problem
**What it is:** a clause that says who actually owns the copyright or other
rights to work a freelancer or contractor produces. Without a written
assignment clause, in both US and most other law the default is that the
person who created the work owns it — even if the client paid in full —
unless a signed agreement transfers it.
**Evidence found:** one aggregator site (jobbers.io, read only via search
snippet since the full page 403'd) asserts "intellectual property ownership
is the most frequently litigated issue in freelancer disputes" and that "the
Scope of Work clause is cited in an estimated 60-70% of freelance payment and
revision disputes," attributing methodology to "Freelancers Union
(2020-2024)." This claim could not be verified — the full article could not
be opened, and no citation to an actual Freelancers Union report with that
figure was found anywhere else. **Treat this specific 60-70% number as
unverified and do not use it in a PRD.** No other source gave a hard count
isolating IP disputes from general payment disputes.
**Source:** https://www.jobbers.io/the-most-common-freelance-contract-clauses-that-prevent-disputes-ranked-by-frequency/ (snippet only, full page blocked) ; background on default ownership rules: https://patentpc.com/blog/how-to-prevent-ip-ownership-disputes-with-contractors-and-freelancers
**Date read:** October 2026.
**Tag:** CONFIRMS V1 (the gap V1 flagged — IP assignment cannot be isolated as
its own measured problem — still stands after a second attempt; the one
number that claims otherwise is not verifiable).

### 4. Indemnity and liability-cap clauses — a real court-case dataset exists (COURT DATA, fills V1's hard-number gap)
**What it is:** the same two clauses V1 described — indemnity means agreeing
in advance to cover the other side's legal costs or losses; a liability cap
sets, in advance, the most the other side could ever be forced to pay.
**Evidence found:** V1 found zero hard numbers for this. This round found
one: the legal-analytics firm Lex Machina's 2018 Insurance Litigation Report
examined 93,000 federal district court insurance-coverage cases filed between
2009 and 2017, with business-liability-policy filings (the category that
includes indemnity and "duty to defend/indemnify" disputes) averaging around
3,000 per year, dropping to roughly 2,500/year in the three most recent years
studied. Within cases where a court actually ruled on the duty to indemnify,
85% of rulings favored the insurer; 80% favored the insurer on duty-to-defend
rulings. About two-thirds of these cases ended in dismissal (likely meaning
settlement). **Caveat:** this dataset counts insurance-coverage litigation —
disputes between a policyholder and their insurance company over whether a
loss is covered — which is adjacent to, but not identical to, a plain
indemnity clause written directly between two contracting parties (e.g., a
freelancer and a client). It is the closest real court-case count found for
this clause family, and still the best available.
**Source:** https://coverageopinions.info/Vol7Issue9/Study.html (summarizing
the Lex Machina 2018 Insurance Litigation Report)
**Date read:** October 2026 (report published October 2018; data covers
2009-2017/2018).
**Tag:** NEW (V1 explicitly found no hard numbers for this clause family; this
is the first dataset found for it, with the caveat above about scope).

### 5. Exclusivity clauses — no hard data, only case examples (OPINION / ANECDOTE)
**What it is:** a clause that stops one or both sides from dealing with
competitors — for example, a supplier agreeing to sell only through one
retailer, or a creator agreeing to promote only one brand.
**Evidence found:** no survey, complaint count, or aggregated court-case
dataset was found. What exists is individual lawsuits (a coffee shop vs. a
competing café, a coffee-in company vs. a cinema chain) and law-firm
explainer pages describing exclusivity disputes as common across retail,
fitness, pharma, and distribution deals — but with no count attached.
**Source:** https://www.valleyrecord.com/?p=23081 ; https://www.sprintlaw.com.au/articles/exclusivity-clause-in-agreement
**Date read:** October 2026.
**Tag:** NEW (V1 never reached this topic; the gap remains open).

### 6. Fee escalators (built-in price increases) — no US data, but a live regulator action in Ireland
**What it is:** a clause that lets the other side raise the price you pay
partway through the contract — common in phone, broadband, and gym contracts,
sometimes tied to inflation or a cost index.
**Evidence found:** no US complaint count or survey was found. What was found
is a live 2025-2026 regulatory move: the Irish government is drafting
legislation specifically targeting "in-contract price increase" (ICPI)
clauses in mobile and broadband contracts, which will require advance notice
and give consumers a penalty-free right to cancel when a provider raises
prices mid-contract. This is a regulator action, but not a US one, and it is
not yet passed law — it's a stated plan as of November 2025.
**Source:** https://lawsociety.ie/gazette/top-stories/2025/november/plan-to-tackle-communications-contract-clauses
**Date:** November 2025.
**Tag:** NEW (V1 never reached this topic). No US-specific hard number found.

### 7. Data and privacy terms — one dated but real survey (SURVEY, old)
**What it is:** the part of a contract or terms-of-service agreement that
describes what the company can do with your personal data — collect it, sell
it, share it, use it to target ads.
**Evidence found:** the Brookings Institution surveyed 2,006 US adult
internet users (May 8-10, 2019) and found 71% rarely read terms of service at
all (32% never read them, 39% read them "sometimes"); 67% want one consistent
set of government rules for how companies handle online consumer data; and
78% think the Federal Trade Commission (FTC, the main US consumer-protection
regulator) should build a national "do-not-track" list people can join. This
is a real, named survey with a stated sample size, but it is from 2019 — more
than six years old — and it measures general reading/trust attitudes, not a
specific count of people harmed by a data clause.
**Source:** https://www.brookings.edu/articles/brookings-survey-finds-three-quarters-of-online-users-rarely-read-business-terms-of-service/
**Date:** survey run May 2019; article undated but references 2019 data.
**Tag:** NEW (V1 never reached this topic). No 2025-2026-dated complaint count
or survey specific to data/privacy terms was found despite a dedicated
search.

### 8. One-sided termination rights — no hard data (OPINION)
**What it is:** a clause that lets only one side end the contract early —
usually the company, not the customer, freelancer, or tenant.
**Evidence found:** no complaint count, survey, or court-case dataset was
found. Legal-commentary pages describe these clauses as common and as a
frequent source of disputes because of vague notice and compensation terms,
and note courts sometimes strike them down as "unconscionable" (so one-sided
it shouldn't be enforced) — but again, no one has counted how often this
happens.
**Source:** https://aaronhall.com/legal-traps-in-one-sided-termination-rights-clauses
**Date read:** October 2026.
**Tag:** NEW (V1 never reached this topic; the gap remains open).

### 9. Auto-renewal and non-compete: what changed since V1, dated 2025-2026
**Auto-renewal:** V1 reported the FTC's "click-to-cancel" rule was "struck
down in court on procedural grounds" and the FTC "restarted the rulemaking,"
describing the underlying complaint numbers as unaffected. This round found
a sharper and more final picture: the 8th Circuit federal appeals court fully
vacated the rule in 2025 (not a narrow procedural fix — the court ruled the
FTC had skipped a legally required economic-impact study, and said a later
fix couldn't cure that), so the rule is not in force at all right now. The
FTC reopened rulemaking in March 2026 and is gathering new evidence rather
than enforcing a rule. The underlying complaint trend V1 cited continues: more
than 90 complaints a day in 2025, still part of the same 100,000+
over-five-years total.
**Source:** https://www.fox26houston.com/news/ftc-click-to-cancel-negative-option-rule-delayed ; https://ailawyer.pro/blog/ftc-reopens-the-topic-of-click-to-cancel-and-subscriptions
**Date:** reporting from 2025-2026.
**Tag:** CONTRADICTS V1 in degree, not direction — V1's "struck down,
restarted" framing undersold how dead the rule currently is. The complaint
volume V1 cited still stands and is confirmed.

**Non-compete:** V1 cited the FTC's 2024 rule estimating 18% of US workers
(about 30 million people) are bound by a non-compete, framing it as an active
rulemaking. This round found the rule is now fully gone at the federal level:
a Texas federal appeals court ruled the FTC's non-compete ban illegal in its
entirety in August 2024; the Trump administration's FTC dropped its appeal on
September 5, 2026; and the rule was formally removed from the US federal
rulebook (the Code of Federal Regulations) on February 12, 2026. Non-compete
enforcement is now governed entirely by state law — 9 states plus Washington,
D.C. currently ban or heavily restrict non-competes (outright bans in
California, Oklahoma, North Dakota, and Minnesota; heavy restrictions in
Colorado, Illinois, Massachusetts, Oregon, and D.C.). The 18%-of-workforce
prevalence estimate V1 cited is a measurement of how common the clause is,
not tied to the now-dead federal rule, so it still stands as a number — only
the regulatory status around it has changed.
**Source:** https://tedmag.com/ftc-ends-non-compete-rule-appeal/ ; https://laborandemployment.btlaw.com/post/102l4v1/the-ftcs-non-compete-saga-comes-to-an-end ; https://www.mondaq.com/unitedstates/arbitration-dispute-resolution/1817088/noncompete-agreements-in-2026-a-federal-and-state-overview
**Date:** reporting through September 2026.
**Tag:** CONTRADICTS V1 — the federal rule V1 described as an active 2024
rulemaking is now dead; the clause itself is still widespread and now
regulated only state-by-state.

## Merged ranking table (V1's 8 clauses + this round's additions)

**Read this table's rank column as a judgment call, not a scientific score.**
The underlying numbers come from different measurement types (complaint
counts, survey percentages, dollar totals, court-case counts) that are not on
the same scale — exactly as V1 warned. Items with no hard number at all are
placed at the bottom and marked clearly; their position means "least
measured," not "least harmful."

| Rank | Clause type | Evidence type | Headline number | Tag |
|---|---|---|---|---|
| 1 | Freelance non-payment / weak payment terms | Survey | 71% of freelancers (n=5,358) had payment trouble at some point | V1 |
| 2 | Security deposit withholding | Survey | Only 42% of movers got their full deposit back | V1 |
| 3 | Automatic renewal | Regulator complaint count | 100,000+ FTC complaints over 5 years; >90/day in 2025; rule now fully vacated, not just delayed | V1, updated this round |
| 4 | Personal guarantees | Survey | 59% of indebted small firms secured debt with a personal guarantee | V1 |
| 5 | Late fees | Regulator dollar total | $14 billion in US credit-card late fees in 2022 | V1 |
| 6 | Non-competes | Regulator estimate (now stateless at federal level) | 18% of US workforce (~30M); federal ban now dead, 9 states + D.C. restrict it | V1, updated this round |
| 7 | Forced arbitration | Regulator complaint count | 2,393 CFPB complaints in 2025, up 150% since 2023 | V1 |
| 8 | Indemnity / liability caps | Court-case count (insurance-coverage proxy) | ~93,000 federal coverage cases 2009-2017, ~2,500-3,000/yr business-liability filings | V1, hard number added this round |
| 9 | IP assignment | Unverified claim only | A "60-70% of disputes" figure exists but could not be confirmed | NEW, still unmeasured |
| 10 | Kill fees | Opinion / industry convention | No count; 25%-50% of remaining value is the typical structure | NEW, still unmeasured |
| 11 | Data / privacy terms | Survey (dated 2019) | 71% rarely read terms; 78% want an FTC opt-out registry | NEW |
| 12 | Unlimited-revision clauses | Anecdote only | No count | NEW, still unmeasured |
| 13 | One-sided termination rights | Opinion only | No count | NEW, still unmeasured |
| 14 | Exclusivity clauses | Opinion / case examples only | No count | NEW, still unmeasured |
| 15 | Fee escalators | Regulator action (Ireland, not US; not yet law) | No US number; Irish legislation planned Nov 2025 | NEW |

Note on comparability: ranks 1-8 largely repeat V1's own order, since nothing
found this round beat that evidence on strength. Ranks 9-15 are all new
topics that remain data-poor after a dedicated search — their order among
themselves is close to arbitrary given how thin the evidence is for all of
them.

## What I could not find

- A complaint count, survey, or dataset that measures kill fees,
  unlimited-revision clauses, exclusivity clauses, fee escalators, or
  one-sided termination rights as their own tracked category, in the US or
  anywhere else. These appear to simply not be tracked by any regulator or
  surveyor as a named category — they show up only inside individual lawsuits
  or freelancer forum complaints.
- A 2025-2026-dated complaint count or survey specific to data-and-privacy
  contract terms. The only usable number (Brookings) is six years old and
  measures general reading habits, not a specific privacy-clause harm.
- Verification of the "60-70% of freelance disputes cite the Scope of Work
  clause" and "Freelancers Union (2020-2024)" claim from jobbers.io — the
  source page 403'd on direct fetch, and no independent source repeats this
  number. It should not be treated as confirmed.
- A single dataset that separates IP-assignment disputes from general
  non-payment disputes. Still not found after a second search; this may
  simply not exist as a tracked category because the two problems usually
  arrive in the same dispute.
- A US-specific hard number for fee-escalator clauses; the only regulator
  action found is in Ireland and not yet enacted.

## How this changes the V1 picture

The core ranking from V1 holds up: nothing found this round outranks the top
eight clauses on hard evidence, and the new clause types researched this
round (kill fees, unlimited revisions, exclusivity, fee escalators, one-sided
termination, data/privacy terms) all turn out to be real, commonly-discussed
problems that simply are not tracked by any regulator or survey — V1's "not
yet researched" gap mostly converts to "researched, and the data doesn't
exist," which is itself useful to know. The one true addition is a genuine
hard-number source for indemnity and liability-cap clauses (a Lex Machina
court-case count), though it measures insurance-coverage litigation, not
plain two-party indemnity clauses, so it should be used as a qualified proxy,
not a direct measurement. The most consequential update is regulatory, not
clause-level: the federal rules V1 described as active in both the
auto-renewal and non-compete rows are now dead or stalled — the click-to-cancel
rule was fully vacated by a federal appeals court (not just "delayed"), and the
FTC's non-compete ban was formally repealed from the federal rulebook in
February 2026, dropping enforcement back to a patchwork of nine states. The
underlying scale of harm behind both rows (complaint volume, workforce
prevalence) is unchanged — only who, if anyone, is regulating it has moved.
