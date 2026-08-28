# Redline — research summary

Four researchers worked in parallel, each capped at 12 web searches and 15 pages read, each required to attach a source link to every claim or drop it. Their raw notes are in this folder:
`agent-1-who-has-this-pain.md`, `agent-2-what-goes-wrong.md`, `agent-3-what-already-exists.md`, `agent-4-who-would-pay.md`.

This file is the synthesis. Where the evidence is thin, it says so.

---

## Verdict up front

**The problem is real. The product, as described, is not yet supported by the evidence.**

Three things separate those two sentences:

1. **The pain shows up at the exit, not at the signing.** In every first-person story found, the person discovered the clause that hurt them when they tried to cancel, pause, or leave — never at the moment they signed. Redline acts before you sign. Nobody in the evidence was standing at that moment wishing for help.
2. **Most people don't read contracts and won't, even for free.** 91% of consumers agree to terms and conditions without reading a word. Only 27% say they would use a *free* general AI chat tool for legal help. A product that charges money to do a thing most people won't do for free has a demand problem, not a feature problem.
3. **This exact product already exists twice, and neither version has traction.** An iPhone app called Pact already does severity-ranked clauses, plain-English explanations, drafted replacement language, and questions answered from your own uploaded document — the near-complete Redline feature list — for about $1 per contract. It has 2 App Store ratings.

That is not a "don't build it." It is a "the hypothesis you wrote down is not the one the evidence supports." The evidence points somewhere narrower and sharper, and that is spelled out in section 5.

---

## 1. The three sharpest pain points

### Pain point 1 — The expensive clause is only discovered at the exit

A person signed up to try Adobe's video editing software, never used it, and tried to cancel:

> "Disgusted to find out that It will cost me £95 to cancel a subscription to premier pro cc, which I have never used. It was not immediately apparent when I signed up and hidden in the t&c. I would never have signed up if I knew i just wanted to see what the sofware was like. Now im a stuck with an unfair bill." *(spelling as in the original)*

— Adobe Community forum, March 11, 2019. https://community.adobe.com/t5/download-install-discussions/i-feel-scammed-by-contract-complaint-about-cc-early-cancellation-fee/td-p/10423998

**Why this is the sharpest one:** the sentence "I would never have signed up if I knew" is exactly the gap Redline claims to close. It is also the sentence that reveals the timing problem — they only said it *after* it was too late.

This shape repeated across all five first-person stories found: a gym charging $30 (US dollars) a month just to *pause* a membership after surgery; a gym reinterpreting its own "within 50 miles of a branch" cancellation clause by pointing to a branch 80 miles away; a business auto-renewed into a 12-month term it says it never agreed to.

### Pain point 2 — For freelancers, the damage is not confusion, it is money that never arrives

> "I lost my house due to not getting paid back in 2010. Two clients, approximately $6,000 total. I learned the hard way it's best to demand partial payment along the way."

— Sonya W., web designer, Texas, quoted in the Freelancers Union report *The Costs of Nonpayment* (survey of 5,358 freelancers). https://www.onlabor.org/wp-content/uploads/2017/05/FU_NonpaymentReport_r3.pdf

**Scale behind the quote:** 71% of freelancers have had trouble getting paid at some point. Among those affected in a single year, the average loss was $5,968 (US dollars) — 13% of annual income.

**But read the caveat in section 5.** This is the largest, best-measured pain in the whole research file, and it is also the one Redline is least able to fix.

### Pain point 3 — Understanding the contract costs more than the thing you're signing

A New York City tenant was quoted a $1,000 (US dollars) retainer just to have a lawyer read their lease, on the grounds that it was:

> "SO EXTENSIVE, SO MANY PROVISIONS, AND PAGES TO THE EXTENT THAT THE TENANT'S LAWYER MUST SPEND NUMEROUS HOURS OR DAYS OF HIS TIME TO READ AND EVALUATE"

— patch.com, Forest Hills, New York. https://patch.com/new-york/foresthills/lease-resembles-the-bible

**Why it matters:** this is the clearest evidence that the current alternative is priced out of reach for an ordinary person. A separate forum thread shows a lawyer quoting 4–6 hours at $340/hour (roughly $2,000 US dollars) to review a lease, which a commenter called "outrageous."

---

## 2. The clause types that matter most, ranked

Ranked by strength of evidence that they cause real, measured harm. **Important caveat: these numbers are not comparable to each other.** Some are counts of complaints filed with a regulator, some are survey results about how common something is, some are total dollar amounts. There is no single dataset that ranks all contract clauses together — this ordering is a judgment call built from separate studies.

| # | Clause | What it does, in plain words | Evidence |
|---|---|---|---|
| 1 | **Weak freelance payment terms** | The contract doesn't force the client to pay on time, and often lets them keep using the work before paying. | 71% of freelancers have had trouble getting paid (survey, n=5,358). Only **28% always use a written contract at all.** |
| 2 | **Security deposit withholding** | The landlord keeps some or all of the deposit at move-out, often with no itemized reason. | Only 42% of renters who moved got their full deposit back (Zillow 2024). 26% have lost a deposit entirely; 36% of those got no explanation. |
| 3 | **Automatic renewal** | The contract renews itself and keeps charging you unless you cancel by a deadline — and cancelling is often made hard on purpose. | 100,000+ complaints to the US Federal Trade Commission over five years. Daily complaint rate roughly **doubled** from 2021 to 2024. |
| 4 | **Personal guarantees** | The business owner personally repays a business debt out of their own house, car, or savings if the business can't. | 59% of small firms with debt secured it with a personal guarantee; 38% pledged personal assets (Federal Reserve survey). |
| 5 | **Late fees and penalties** | An extra charge stacked on top of what you already owe. | $14 billion (US dollars) in credit card late fees in 2022 alone — over 10% of all card interest and fees that year. |
| 6 | **Non-competes** | Bars you from working for a competitor or starting a similar business after you leave. | US Federal Trade Commission estimate: 18% of the US workforce, about 30 million people. Academic estimates run as high as 46%. |
| 7 | **Forced arbitration / class-action waivers** | You give up the right to sue in public court or join a group lawsuit; disputes go to a private process the company chose. | 2,393 complaints mentioning arbitration to the Consumer Financial Protection Bureau in 2025 — up 150% since 2023. |
| 8 | **Indemnity and liability caps** | You agree in advance to cover the other side's legal costs; or they cap in advance the most they could ever owe you. | **No hard numbers exist.** Only law firms saying, from their own experience, that these are the most heavily litigated terms. Rank 8 means "least measured," not "least damaging." |

Every source link is in `agent-2-what-goes-wrong.md`.

**Not researched, and therefore unknown:** kill fees, unlimited-revision clauses, exclusivity, fee escalators, data and privacy terms, and one-sided termination rights. The researcher hit the stop-at-8 rule before reaching them. Intellectual property assignment could not be isolated as its own measured problem — no dataset separates "the client took my work without paying" from general non-payment.

**The one number in this table that should change how you think about the product:** only 28% of freelancers always use a written contract. For the other 72%, there is no document for Redline to read.

---

## 3. Where the existing tools are weak

Thirteen products were profiled. The market splits cleanly in two, with almost nothing in between.

**The well-funded, heavily-reviewed tools all serve corporate legal departments, and are priced out of an individual's reach.**
- LegalOn: $550/month (US dollars) for one person.
- Ironclad: median actual price paid was $38,825/year (US dollars), across 328 real purchases.
- Spellbook, LawGeex, Robin AI: pricing not published at all — you have to contact sales. For Spellbook, that opacity is itself the most common complaint.
- Robin AI's minimum is $100/month for 5 users. One reviewer specifically complained there is no individual plan.

**Their real weaknesses, from actual reviews:** Ironclad draws complaints about "poor search functionality and problems finding older contracts" — which is close to the core job it sells. Robin AI "often misunderstands the phrasing of legal theory." LegalOn "could struggle with heavily customized or non-standard lease formats." LawGeex has **zero reviews** on Capterra after years in market, which makes its real reputation impossible to check from outside its own marketing.

**The consumer side is where the honest news is.** Two apps already target exactly Redline's audience by name:
- **Pact** (iPhone/iPad/Mac) scans a lease, freelance contract, confidentiality agreement, or offer letter; rates each clause high/medium/low risk; explains it plainly; "suggests replacement language that better protects your interests"; and answers follow-up questions about "specific clauses in your actual document." Pricing is per-use: 5 analyses for $4.99, 20 for $12.99 (US dollars). **It has 2 App Store ratings.**
- **LegalBoof** makes the same pitch to "freelancers, small-business owners, renters, entrepreneurs." Its App Store page says it "hasn't received enough ratings or reviews to display an overview."

**The genuine gaps that remain:**
1. **Nobody has proven the individual segment works.** The idea has been tried; it has not been validated. That is different from an open field, and much less encouraging.
2. **Trust is a live liability in this category.** The US Federal Trade Commission charged DoNotPay in September 2024 over claims its chatbot could replace a lawyer, finalized in January 2025 with a $193,000 relief order and a ban on advertising itself as a lawyer substitute. Any product making confident claims about legal risk inherits that scrutiny.
3. **Billing trust, separate from product quality.** Both DoNotPay and Rocket Lawyer draw Trustpilot complaints about surprise recurring charges. There is real irony in a "we'll catch the auto-renewal trap" product being sold on a subscription.
4. **Not checked at all:** Luminance, Lexion, ContractPodAi, DocJuris, Pactum. And for none of the enterprise tools could the researcher confirm whether they show the *exact source sentence* — so "we quote the actual line" may or may not be a real differentiator.

---

## 4. Who would plausibly pay, and roughly what

Ranked by strength of evidence, not by size.

**1. Small business owners and freelancers — strongest evidence.**
A competitor, QwickContractReview.com, sells plain-English contract review at a flat **$99 (US dollars) per contract**, aimed explicitly at "small businesses and freelancers." LegalShield sells small-business legal plans bundling contract review at **$49–$169/month (US dollars)** and is a going concern. 62% of small business owners admit signing a contract they didn't fully understand.

**2. Job candidates reviewing an employment offer — solid.**
Lawyers charge an average flat fee of about **$430 (US dollars)** for this. 61% of employees say they signed a work contract they didn't fully understand, and nearly a third of those hit a problem later. This is the cleanest match: one document, high stakes, a specific moment, an existing price to undercut.

**3. Renters — real pain, unproven wallet.**
The $1,000 retainer quote above shows the cost problem sharply. But no evidence was found of renters paying anything for review. Only that they can't afford a lawyer.

**4. Creators reviewing brand deals — small but rich.**
A niche law firm charges **$800–$1,400 (US dollars)** flat per brand-deal review. Real money, narrow pool.

**5. Gig workers, landlords, gym/telecom consumers — no evidence found either way.**

**What the market currently charges to do this by hand:** $250–$750 (US dollars) flat fee for a general contract; $200–$500 for a freelance or service agreement; $500–$1,500 for a small-business commercial lease; $150–$800+/hour for a lawyer. Freelance contract reviewers on Upwork go for $30–$150/hour.

**Rough read:** the defensible price band is **$10–$99 (US dollars) per document**, or **under $30/month**, for freelancers, small business owners, and job candidates. Above that you're competing with a real lawyer; below it you're competing with free.

**One large caveat on all of these prices.** Most come from sites (ContractsCounsel, UpCounsel, MyLegalPal) that make money matching people to lawyers. They have an interest in how those numbers look. Treat them as industry-reported estimates, not audited data. No independent bar-association fee survey was found.

---

## 5. What contradicts your hypothesis

This is the section that matters most. Five findings cut against the idea, and I'd rather put them plainly than bury them.

**1. The timing is wrong. This is the most serious one.**
Redline helps you *before* you sign. Every single first-person account found describes discovering the problem *at the exit* — cancelling, pausing, moving out, trying to leave. Not one person in the evidence describes standing over an unsigned contract, anxious, wanting help. That does not prove the pre-signature moment doesn't exist. It means four researchers' worth of searching did not find it, and you should not assume it. **The user's felt moment of need and your product's moment of action may be different moments.** That is a positioning problem, not a feature problem, and no amount of good clause detection fixes it.

**2. People don't read contracts, and won't, even when it's free.**
- 91% of consumers agree to terms and conditions without reading a word; 97% among 18–34 year olds (Deloitte).
- 68% either don't read or don't understand what they sign (University of Law, UK).
- 69% signed despite not knowing the details — and signed anyway rather than stopping to get help (Adobe).
- **Only 27% would use a free general AI chat tool for legal help** (LexisNexis, 2023).

That last one is the killer. If roughly three in four people won't use a *free* tool for this, a paid one is fighting the same indifference with a price tag attached.

*Source caveat, stated honestly: all four of these statistics were found through a single blog aggregator (i-agree.io) that cites the original studies. The originals were not opened directly. Verify these before they carry weight in a PRD.*

**3. It already exists, twice, and hasn't worked yet.**
Pact matches nearly Redline's full feature list — severity ranking, plain-English explanation, drafted replacement language, document-scoped questions — at roughly $1 per contract, and has 2 App Store ratings. LegalBoof makes the same pitch and has too few reviews to show a score. Neither is proof the market is impossible. Both are evidence that building this is not the hard part.

**4. Free, well-known competitors are already in the strongest segment.**
Rocket Lawyer launched "Rocket Copilot Contract Review" in August 2025 as a **free** AI tool for small businesses that flags key terms and red flags. Small business is the segment with your best willingness-to-pay evidence, and an established brand is already giving away a version of the core feature.

**5. The best-measured pain in the whole file is one Redline cannot solve.**
Freelance non-payment is the largest, hardest-evidenced problem found: 71% affected, average loss $5,968 in a year. But **only 28% of freelancers always use a written contract.** For most of them there is no document to analyze. And where a contract does exist, the failure is usually not that its terms were confusing — it's that the client simply didn't pay, and enforcing the contract costs more than the invoice. A tool that reads contracts better does not make a non-paying client pay.

**One thing that cuts in your favor, for balance:** the automatic-renewal and cancellation-trap problem is both the best-documented complaint category (100,000+ Federal Trade Commission complaints, rate doubling) and the one that showed up in every single first-person story. If any part of this hypothesis is anchored in real, verified, at-scale pain, it is that one.

---

## 6. How far to trust this research

Be aware of what these four reports could not do.

- **Agent 1 found 5 stories, not the 8 requested.** Reddit and Quora were blocked outright — the search tool never surfaced a single linkable thread from r/legaladvice, r/freelance, or r/Tenant, and a direct attempt to reach Reddit was blocked by its network security. Six other promising pages returned "403 Forbidden" or bot-check walls. **So the entire first-person evidence base here is five stories, four of them about subscriptions and gyms.**
- **There is no first-person account of a lease or a freelance agreement in this file.** Those are two of the four document types Redline names. That is a hole, not a finding, and it exists because of tool blocks, not because the stories don't exist.
- Several government sources (the Federal Trade Commission's site, the Federal Reserve small-business survey, the Federal Register) blocked direct access. Their numbers came through search snippets or secondary sources that quote them.
- The willingness-to-pay counter-evidence rests heavily on one aggregator blog. The pricing evidence rests heavily on lawyer-marketplace sites with a commercial interest.

**Net:** the clause-level data (section 2) and the competitor data (section 3) are solid. The human pain evidence (section 1) is thin and skewed toward consumer subscriptions. Nobody was interviewed. Before this becomes a PRD, the missing piece is people, not more searching.

---

## 7. The open questions this research could not answer

Not a plan — just the things the evidence genuinely cannot tell you.

1. Does the pre-signature moment exist for anyone? Nobody in the evidence was found at it.
2. Would someone who wouldn't read a contract read a summary of one?
3. Does anyone actually send the drafted counter-offer, or does knowing the risk just make them sign anyway with a bad feeling?
4. Why did Pact and LegalBoof get no traction — wrong idea, wrong channel, or just too early?
5. What did the 72% of freelancers with no written contract do instead, and is that a bigger problem than reading one?
