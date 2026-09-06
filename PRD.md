# Redline — the brief

The document somebody reads before building. It records what was decided, what
was decided against, and who is worse off for it.

Vocabulary is defined in `CONTEXT.md`. Decisions are recorded in `docs/adr/`.
Where this brief and an ADR disagree, the ADR is right and this file is stale.

---

## 1. Who this is for, and what they do today instead

**Freelancers and small business owners**, holding a document they have not yet
signed.

Not renters, not job candidates, not creators reviewing brand deals. Those were
considered and rejected; ADR 0002 records why, and section 6 records who loses
by it.

**What they do today, in order of how often it happens:**

**They sign it unread.** 62% of small business owners admit signing a contract
they did not fully understand. Among consumers generally, 91% agree to terms and
conditions without reading a word. This is the real competition — not another
product, but the decision to skip the problem entirely.

**They never get a contract at all.** Only **28% of freelancers always use a
written contract**. For the other 72%, there is no document for Redline to read.
This single number is the largest limit on the size of this market, and it is
not a limit better software can lift.

**They pay a lawyer, or find they cannot.** A general contract review runs
$250–$750 flat; a freelance or service agreement $200–$500; a small-business
commercial lease $500–$1,500. Hourly rates run $150–$800+. One competitor,
QwickContractReview.com, sells plain-English review at a flat **$99 per
contract**, aimed explicitly at small businesses and freelancers. LegalShield
sells small-business plans bundling contract review at **$49–$169 a month**.
*Caveat: most of these figures come from sites that make money matching people
to lawyers, and have an interest in how the numbers look. Treat them as
industry-reported, not audited.*

**They use a free tool.** Rocket Lawyer launched a **free** AI contract review
for small businesses in **August 2025** that flags key terms and red flags. It
sits in this exact segment. Nothing in this brief yet explains why someone pays
for Redline instead — see section 6, call 1.

---

## 2. The problem

A person signs something they have not understood, and finds out what it said
only when they try to leave.

> "Disgusted to find out that It will cost me £95 to cancel a subscription to
> premier pro cc, which I have never used. It was not immediately apparent when
> I signed up and hidden in the t&c. **I would never have signed up if I knew**
> i just wanted to see what the sofware was like. Now im a stuck with an unfair
> bill."
>
> — Adobe Community forum, 11 March 2019 (spelling as in the original).
> https://community.adobe.com/t5/download-install-discussions/i-feel-scammed-by-contract-complaint-about-cc-early-cancellation-fee/td-p/10423998

"I would never have signed up if I knew" is the exact gap this product claims to
close. It is also the sentence that exposes the product's central risk: it was
said *afterwards*. See section 6, call 2.

For the segment actually being served, the stakes are larger than a subscription
fee:

> "I lost my house due to not getting paid back in 2010. Two clients,
> approximately $6,000 total. I learned the hard way it's best to demand partial
> payment along the way."
>
> — Sonya W., web designer, Texas, in the Freelancers Union report *The Costs of
> Nonpayment* (survey of 5,358 freelancers).
> https://www.onlabor.org/wp-content/uploads/2017/05/FU_NonpaymentReport_r3.pdf

71% of freelancers have had trouble getting paid at some point. Among those
affected in a single year, the average loss was **$5,968 — 13% of annual
income**.

**Say plainly what that quote does not support.** Redline cannot fix Sonya's
problem. Most freelance non-payment happens where no written contract exists,
and where one does, the failure is usually not confusing terms — it is that the
client simply did not pay, and enforcing the contract costs more than the
invoice. A tool that reads contracts better does not make a client pay. This
quote establishes the stakes of the segment, not the value of the product.

**What the evidence does support at scale** is the trap itself. Automatic
renewal and cancellation traps drew **100,000+ complaints to the US Federal
Trade Commission over five years**, with the daily complaint rate roughly
**doubling from 2021 to 2024** — and it was the only clause type present in
every first-person account the research found.

---

## 3. What the first version does

Six things. Nothing else ships.

1. **A plain-English summary of the document.**
2. **The clauses that could hurt the user, ranked by severity, each showing the
   exact sentence it came from.** A clean document returns a clean result — the
   statement that nothing was found, plus the list of what was checked for — and
   never an empty response.
3. **A drafted counter-offer for every flagged clause**, worded according to the
   user's stated leverage.
4. **A question box that answers only from the uploaded document.**
5. **An editable list of the user's own red lines, which drives the analysis.**
   This list ships with the defaults in section 5, and also stores the user's
   leverage — whether they can walk away from this deal.
6. **A saved library of their past documents.**

Two rules govern how all six behave:

- **Every flag cites the exact sentence it came from.** A flag whose source
  sentence cannot be shown is a bug, not a limitation to work around (ADR 0001).
- **Confidence is split by claim type** (ADR 0004). What the clause *says* is
  checkable against the source sentence and is stated plainly, with no hedging.
  What it *might do to the user* depends on facts the document does not contain,
  and is always marked uncertain.

---

## 4. What good looks like

Seven checks. The first four can be automated and should gate the build; the
last three need a person.

**1. Every source sentence is real.** Every flag's quoted sentence appears word
for word in the stored document text. Target: **100%**. A single failure is a
build failure, not a warning (ADR 0001).

**2. Must-change flags are almost always right.** On a review set of real
documents, a reviewer with relevant expertise agrees with the must-change call.
Target: **90% or better**. This is the number that protects the product's
credibility — because every flag shows its source sentence, a user can check a
false alarm instantly and watch the tool be wrong.

**3. Planted traps get caught.** On documents with deliberately planted clauses
of known type, the trap is flagged at either level. Target: **95% or better**.
This is where the over-flagging decision (section 6, call 7) is meant to pay off.

**4. Benign documents stay clean at the top level.** On a set of documents
judged genuinely fair, the number of **must-change** flags is **zero**. Some
worth-raising flags are acceptable. A must-change flag on a fair document is the
single most damaging failure this product can produce.

**5. The question box refuses what the document cannot answer.** Asked questions
the document does not address, it declines rather than answering from general
knowledge. Target: **no answer drawn from outside the document, ever.**

**6. Counter-offers are sendable without editing.** A reviewer judges whether
each counter-offer addresses the specific clause and could be sent as written.
No target is set — this needs a baseline before a threshold means anything.

**7. Uncertainty is marked where it belongs.** Every outcome claim carries an
uncertainty marker; no text claim does.

**The gap in all of this: there is no review set.** None of checks 2, 3, 4, or 6
can run until a set of real documents exists with expert judgements attached.
Building that set is the first engineering task, and it is not a small one.

---

## 5. My red lines — what gets flagged, and how severely

These are the product's defaults. They seed each user's editable list
(capability 5), and each user can change them. *Note the vocabulary collision:
`CONTEXT.md` defines a "red line" as the user's own rule. These are the defaults
that list starts from, not a separate concept.*

**Severity means escapability** — how hard it is to get out of an obligation
once signed — not how many dollars are at stake (ADR 0003). The evidence forced
this. Nothing that hurt a real person in the research was financially large: £95
to cancel Adobe, $30 a month to pause a gym membership, a "within 50 miles"
cancellation clause reinterpreted to mean 80 miles. Every one was a trap they
could not exit. Ranking by dollars would have missed all of them.

There are exactly two levels: **must-change** and **worth-raising**. The levels
below are the *starting point* for each clause type; the level a specific flag
actually gets depends on what the clause in front of it says.

| Clause | Default | Why it matters | Evidence |
|---|---|---|---|
| **Automatic renewal** | must-change | Designed to be hard to exit, and cancelling is often made deliberately difficult. The one clause type present in every first-person account found. | 100,000+ US Federal Trade Commission complaints over five years; daily rate roughly doubled 2021→2024 |
| **Personal guarantees** | must-change | The owner repays a business debt from their own house, car, or savings. Escapability is close to zero and the exposure is personal, not corporate. | 59% of small firms with debt secured it this way; 38% pledged personal assets (Federal Reserve) |
| **Forced arbitration / class-action waivers** | must-change | Gives up the right to sue in public court or join a group case, permanently and before any dispute exists. Cannot be undone after signing. | 2,393 complaints to the Consumer Financial Protection Bureau in 2025, up 150% since 2023 |
| **Weak freelance payment terms** | must-change | Once work is delivered under bad terms, the position cannot be recovered. This is the core exposure of the segment being served. | 71% of freelancers have had trouble getting paid; average annual loss $5,968 (n=5,358) |
| **Non-competes** | must-change | Binds after the person has already left, when they have no remaining leverage. *The text claim is certain; whether it will be enforced is an outcome claim and stays marked uncertain.* | US Federal Trade Commission estimate: 18% of the US workforce, ~30 million people; academic estimates up to 46.5% |
| **Security deposit withholding** | must-change | The money is already held. Disputing it usually costs more than the deposit is worth. | Only 42% of renters who moved got their full deposit back; 26% lost one entirely, and 36% of those got no explanation (Zillow 2024) |
| **Late fees and penalties** | worth-raising | Large in aggregate, but conditional on the user's own behaviour and avoidable by paying on time. Escapable, therefore not must-change. | $14 billion in US credit card late fees in 2022 — over 10% of all card interest and fees that year |
| **Indemnity and liability caps** | worth-raising | Potentially the largest exposure of any clause here — and the least measured. Must-change requires near-certainty, and there is no evidence base to be certain from. | **No hard numbers exist.** Only law firms saying, from their own experience, that these are the most heavily litigated terms. |

**The ranking these are drawn from is not a measurement.** The research states
its own ordering "is a judgment call built from separate studies" and that the
numbers "are not comparable to each other" — some are complaint counts, some
survey results, some dollar totals. Row 8 is labelled "least measured, not least
damaging." Severity now rests on that ranking. See section 6, call 5.

---

## 6. The calls I made, and what I gave up

Ten decisions. For each: the choice, what it was chosen against, and who is
worse off.

**1. Serve freelancers and small business owners.**
Chosen against: job candidates reviewing an employment offer.
*Worse off:* job candidates, who have the cleanest version of this problem — one
document, high stakes, a real deadline, a $430 lawyer fee to undercut, and no
free incumbent. Also the product itself, which now competes directly with Rocket
Lawyer's free tool in a segment whose best-measured pain it cannot fix.

**2. Act before signing, not at the exit.**
Chosen against: helping people already trapped.
*Worse off:* every person in the research's evidence base. All five first-person
accounts describe discovering the damage while cancelling, moving out, or
leaving. None of them get anything from this product. This is the assumption
most likely to kill it.

**3. Keep all four document types.**
Chosen against: one document type, done deeply.
*Worse off:* users of whichever type ends up with the thinnest clause coverage.
Employment offers and leases share almost no vocabulary, so depth spreads four
ways. Pact shipped this same breadth to this same audience and has two App Store
ratings.

**4. Severity means escapability, not money.**
Chosen against: ranking by dollars at stake.
*Worse off:* someone facing a financially enormous clause that is easy to walk
away from. It will rank below a small clause they cannot escape, and will feel
under-weighted to them.

**5. Detect all eight clause types.**
Chosen against: going deep on the exit-trap family alone — the only family with
verified pain at scale, and the only one present in every first-person account.
*Worse off:* users whose actual risk is an exit trap, which now receives an
eighth of the attention instead of all of it. Eight clause types across four
document types is 32 combinations, each needing detection, severity
calibration, and a counter-offer, each bound by ADR 0001 to produce an exact
source sentence.

**6. Two severity levels, not three.**
Chosen against: high / medium / low.
*Worse off:* flags the analysis is genuinely unsure about. There is no middle to
put them in, so they drop to worth-raising and may be read as less serious than
they are. That is the intended trade — three-level scales collapse into
everything-is-medium — but the cost is real.

**7. Rather over-flag than miss a trap.**
Chosen against: never flagging anything harmless.
*Worse off:* users with clean documents, who will rarely see a clean result, and
the project's own stated purpose. `CLAUDE.md` says this version exists to prove
the analysis is trustworthy, and over-flagging is the documented way tools in
this category lose trust. **This decision and call 9 point in opposite
directions.** ADR 0004 records the mitigation: extra sensitivity lands in
worth-raising; must-change stays near-certain. If sensitivity is allowed to
inflate the must-change count, both this call and the severity model collapse.

**8. Confident about what the text says, uncertain about what it does to you.**
Chosen against: hedging everything, or sounding confident throughout.
*Worse off:* nobody badly — but some flags will read as less alarming than the
situation deserves. The alternative is worse: stating outcomes confidently is
what drew the US Federal Trade Commission's 2024 action against DoNotPay, which
ended in January 2025 with a $193,000 order and a ban on advertising itself as a
substitute for a lawyer.

**9. A clean document gets its checklist, never silence.**
Chosen against: a bare "no flags found."
*Worse off:* nobody directly, but the checklist exposes coverage. Showing what
was checked also shows what was not, making the eight-clause limit visible.

**10. Ask about leverage, and store it with the user's red lines.**
Chosen against: drafting every counter-offer identically; drafting two versions
of each; or dropping counter-offers entirely.
*Worse off:* first-time users, who now answer a question before receiving
anything. The reason it is worth the friction: a well-drafted counter-offer
handed to someone who cannot afford to lose the deal is not neutral — it can
cost them the thing they were trying to get.

**Three of these calls have no recorded reasoning.** Calls 1, 3, 5, and 7 were
made against the recommendation, and the reasoning behind them has not been
written down. ADR 0002 is marked `proposed` rather than `accepted` for exactly
this reason. A reader will want the why on precisely those decisions.

---

## 7. What we are not building, and why

**Payments and billing.** Neither makes the analysis more trustworthy, which is
the only thing this version exists to prove. There is also an irony worth
avoiding: both DoNotPay and Rocket Lawyer draw complaints about surprise
recurring charges, and a product that catches auto-renewal traps should not be
sold through one. *No price has been decided.* The research suggests a
defensible band of $10–$99 per document, or under $30 a month, but that is a
later decision and nothing here depends on it.

**OCR — reading scanned images as text.** This one is not neutral omission; it
actively undermines the product. A citation is worthless when the text it points
at was misread, and ADR 0001 makes an unshowable source sentence a bug. **The
honest cost: any document arriving as a scan cannot be read at all.** Nobody has
measured what share of real leases and offers arrive that way. That number
should be found before this exclusion is treated as settled.

**Sharing a document between users.** Adds no trust. Adds a way for other
people's contract text to leak.

**Helping people already trapped.** The larger and better-evidenced problem, and
deliberately out of scope — at the exit there is nothing left to negotiate, and
the counter-offer is where this product creates value rather than merely
explaining a loss.

**Flagging what is missing from a document.** Absent protections — no
late-payment interest, no kill fee, no rights reverting if the client never pays
— are often where the real danger sits for freelancers. This is the strongest
candidate for the next thing built. It is excluded now because it is a seventh
capability, and `CLAUDE.md` requires asking before adding one.

---

## 8. What the research could not tell us

The clause-level and competitor data are solid. The human evidence is thin, and
the honest summary is that **nobody was interviewed**.

**The evidence base is five stories, and four of them are about subscriptions
and gyms.** Reddit and Quora were blocked outright; six other promising pages
returned bot-checks or 403 errors. **There is no first-person account of a lease
or a freelance agreement anywhere in the file** — two of the four document types
this product accepts. That is a hole caused by tool blocks, not a finding.

**Nobody was found at the pre-signature moment.** Four researchers searching
found no one standing over an unsigned contract wanting help. That does not
prove the moment does not exist. It means the product's core assumption is
unverified, and testing it should come before building against it.

**The willingness-to-pay evidence has a single point of failure.** The four
statistics that most undercut this product — 91% agree without reading, 68% do
not read or do not understand, 69% signed anyway, and only 27% would use a
*free* AI tool for legal help — all came through one aggregator blog
(i-agree.io) citing the originals. The originals were never opened. Verify them
before they carry weight.

**Several government sources were unreachable.** The Federal Trade Commission's
site, the Federal Reserve small-business survey, and the Federal Register all
blocked direct access; their numbers came through search snippets or secondary
sources.

**Pricing evidence comes from parties with an interest.** ContractsCounsel,
UpCounsel, and MyLegalPal all make money matching people to lawyers. No
independent bar-association fee survey was found.

**Some clause types were never researched at all:** kill fees, unlimited-revision
clauses, exclusivity, fee escalators, data and privacy terms, and one-sided
termination rights. Intellectual property assignment could not be isolated as
its own measured problem.

**Five questions the evidence genuinely cannot answer:**

1. Does the pre-signature moment exist for anyone?
2. Would someone who would not read a contract read a summary of one?
3. Does anyone actually send the counter-offer, or does knowing the risk just
   make them sign anyway with a bad feeling?
4. Why did Pact and LegalBoof get no traction — wrong idea, wrong channel, or
   too early?
5. What did the 72% of freelancers with no written contract do instead, and is
   that a bigger problem than reading one?

Question 3 is the one that most threatens what has been decided here. The
counter-offer is the only capability separating Redline from the free
alternatives already in this segment, and no evidence exists that anyone sends
one.
