# Agent 1 — Who has this pain

## Method (searches run, pages read, when you stopped and why)

I ran 12 web searches (the maximum allowed), trying many phrasings aimed at Reddit (r/legaladvice, r/freelance, r/Tenant, r/personalfinance, r/smallbusiness), Quora, Trustpilot, and news coverage of real people hurt by a contract clause they missed or didn't understand.

Problem: the search tool's `site:reddit.com` filter did not reliably return individual Reddit threads — it kept falling back to generic articles about contracts and fine print. None of the 12 searches surfaced a specific, quotable Reddit or Quora post.

So I switched to reading the most promising individual pages the searches did turn up — forum posts, a company-review complaints board, and news stories that quote real people by name. I read 15 pages (the maximum allowed), using a mix of the page-fetch tool and a direct download-and-search of the raw page (to make sure a quote I was about to use was actually on the page, word for word, and not summarized or guessed by an intermediate AI step).

Of the 15 pages read, 5 gave me a usable, verifiable, first-person quote. The other 10 were dead ends:
- 6 were blocked outright (403 Forbidden or a Cloudflare "checking your browser" wall): a JustAnswer UK legal thread, a TopClassActions.com article on a Trustpilot lawsuit, an NBC News arbitration-clause article, two Fiverr community forum threads, and an AnandTech tenant-forum thread.
- 1 direct attempt to reach Reddit (through a text-extraction proxy, since the search results and normal fetch both failed) was blocked with "You've been blocked by network security."
- 1 (a Fox News arbitration-clause article) only quoted advocacy-group and company spokespeople, not an affected individual, so it didn't qualify.
- 1 (a Substack post by a professional comic artist about a non-compete clause) turned out to be her paraphrasing a stranger's situation in a letter she wrote — not a verbatim quote from the person who was actually hurt — so I dropped it per the "verbatim quote only" rule.
- 1 (a roundup blog post about Reddit freelance complaints) summarized patterns but contained no direct quotes or source links to specific threads.

I stopped at 5 findings, short of the 8-finding target, because I hit the 15-page hard limit (with all 12 searches also already used) before I could chase down more leads. I did not stretch any of the 5 findings beyond what the source page actually says, and I dropped two candidate stories (about a failed timeshare "exit company") because the quotes I could verify were about the exit company failing, not about the person misunderstanding a specific contract clause — too weak a fit to include.

## Findings (numbered 1-5)

### 1. Individual consumer — Adobe Creative Cloud early-cancellation fee hidden in the terms

**Who:** An individual who signed up to try Adobe Premiere Pro (video editing software) on a paid plan, posting under the Adobe Community forum handle "seeyavashm38835280."

**What happened:** They signed up just to see what the software was like. They didn't notice — because it wasn't shown clearly at signup, only buried in the terms and conditions — that canceling early would trigger a cancellation fee. They only found out when they tried to cancel a subscription they say they had never even used.

**Verbatim quote:** "Disgusted to find out that It will cost me £95 to cancel a subscription to premier pro cc, which I have never used. It was not immediately apparent when I signed up and hidden in the t&c. I would never have signed up if I knew i just wanted to see what the sofware was like. Now im a stuck with an unfair bill. PLEASE HELP! It is not right to treat customers like this, I feeled scammed by a massive coporation." [spelling as in original]

**Source URL:** https://community.adobe.com/t5/download-install-discussions/i-feel-scammed-by-contract-complaint-about-cc-early-cancellation-fee/td-p/10423998

**Source name + date:** Adobe Community forum, thread "I feel scammed by contract [Complaint about CC Early Cancellation Fee]," posted March 11, 2019. (Date and exact quote confirmed by downloading and searching the raw page — this is the page's embedded structured data, not a summary.)

---

### 2. Small business owner — Trustpilot subscription auto-renewed into a 12-month term they say they never agreed to

**Who:** A business that pays for Trustpilot's "Business" plan (a paid subscription for managing and displaying customer reviews). Identified only by their Better Business Bureau (BBB) complaint record — BBB does not publish full names.

**What happened:** After the first year of a quarterly subscription, the price jumped from $770 to $897 per quarter with, they say, no advance notice and no new agreement signed. When they tried to cancel, they were told by an automated email that they couldn't — because they were supposedly locked into another 12-month contract they say they never knowingly signed.

**Verbatim quote:** "Approximately two years ago, I subscribed to Trustpilot's Business platform at a quarterly subscription rate of $770.00. After the initial year, Trustpilot increased my quarterly subscription to $897.00 without providing any advance notice, renewal agreement, or obtaining my authorization to continue under new pricing terms. After discovering the increase, I contacted Trustpilot to cancel my subscription. In response, I received an automated email stating that I could not cancel because I was allegedly committed to another 12-month contract."

**Source URL:** https://www.bbb.org/us/ny/new-york/profile/digital-marketing/trustpilot-inc-0121-149835/complaints

**Source name + date:** Better Business Bureau complaints page for Trustpilot, Inc. Complaint is one of several filed in the June–August 2026 window shown on that page. (Quote confirmed by downloading and text-searching the raw page.)

---

### 3. Kimberly Mitchell — sued by a lender after canceling a timeshare, because the loan for the deposit was a separate contract from the timeshare itself

**Who:** Kimberly Mitchell, a consumer who bought into a timeshare (a shared-ownership vacation property) and took out a loan through Barclays to cover the deposit.

**What happened:** She canceled the timeshare in writing within 12 hours of signing — inside the legal window where you're allowed to back out — and got the timeshare company's own representative to agree to the cancellation in writing. But about a month later, Barclays sued her for the first loan payment anyway. The loan she'd signed to cover the deposit was a separate, legally distinct contract from the timeshare purchase, so canceling the timeshare didn't automatically cancel the loan. The lawsuit was only dropped after she got a lawyer involved.

**Verbatim quote:** "I feel like I was scammed. And I feel like I was misled."

**Source URL:** https://www.yahoo.com/news/articles/embarrassing-woman-says-lender-sued-223002011.html

**Source name + date:** Yahoo News (consumer-affairs story), dated approximately January 22, 2026. **Caveat:** unlike Findings 1, 2, 4, and 5, I was not able to independently re-download and text-search this page within my page-read budget — the quote and details come from the page-fetch tool's single extraction pass, not a second raw-text check. I'm including it because the fetch succeeded (not blocked or paywalled) and the details are specific and internally consistent, but flagging the lighter verification here for transparency.

---

### 4. "LNYU54" — signed a 6-month gym contract, then got hit with a monthly fee just to pause it after surgery

**Who:** A gym member posting under the handle "LNYU54" on Blind (an anonymous forum used mostly by working professionals).

**What happened:** They signed a 6-month gym membership, used it for 2 months, then had surgery that would keep them out of the gym for the remaining 8 months. They wanted to pause ("freeze") the membership instead of paying for a gym they couldn't use — and discovered the gym charges $30 a month just for that pause, a cost they don't seem to have anticipated when they signed up.

**Verbatim quote:** "I have a 6 month gym membership. I went for 2 months and then had surgery that doesn't allow me to go for 8 months. I wanted to freeze my membership but the gym has a $30 monthly fee to do so. Do you guys know if I can cancel that membership without penalty knowing that I am physically unfit to go to the gym for the remaining duration of my membership??"

**Source URL:** https://www.teamblind.com/post/legal-issue-with-gym-membership-2zmyhgmm

**Source name + date:** Blind, post titled "Legal issue with gym membership," posted January 11, 2022. (Confirmed via the page's own structured data after downloading the raw page.)

---

### 5. "Sr. 4loko" — gym used a vague "close enough" reading of its own cancellation clause to keep charging after a move

**Who:** A gym member commenting on the same Blind thread as Finding 4, under the handle "Sr. 4loko."

**What happened:** Many gym contracts let you cancel penalty-free if you move more than a set distance (in this case, roughly 50 miles) from the nearest branch — the kind of clause someone might skim past at signing without registering the exact number. When this person actually moved and tried to use that clause, the gym pointed to a branch that was, by their own account, 80 miles away and used it to argue the clause didn't apply, telling them cancellation would take two months to process. They ended up having to force the issue by telling their bank to stop the payments.

**Verbatim quote:** "Gym contracts are some of the sleaziest contacts around. I moved one time and they tried to claim that there was a branch of their within 50 miles of where I moved to so they wouldn't let me out of it. I asked them which branch and they pointed to one 80 miles away. They said they would cancel me in two months. I told my bank to quit paying them after a month. There's a local Facebook group for the community I live in and half the posts are people trying to sell their gym membership contacts." [likely means "contracts," typo in original]

**Source URL:** https://www.teamblind.com/post/legal-issue-with-gym-membership-2zmyhgmm

**Source name + date:** Blind, comment on "Legal issue with gym membership," dated January 10–11, 2022.

## Patterns I noticed (short, evidence-only)

- **The costly clause is discovered at exit, not at signing.** In all 5 stories, the person only found the clause that hurt them when they tried to cancel, pause, or leave — not when they signed. Nobody in these stories says they read and understood the clause upfront and regretted it; they say they didn't know it was there until it cost them.
- **"One document, two contracts" catches people off guard.** Kimberly Mitchell's case shows a specific trap: she thought canceling the timeshare canceled everything, but the loan for the deposit was a separate, still-binding agreement.
- **Fee-avoidance clauses get reinterpreted against the person after the fact.** The gym "50 miles from a branch" clause and Trustpilot's "12-month contract" claim both show the same shape: a company invokes a specific contract term the customer didn't remember agreeing to, and the customer has no easy way to check whether that's actually what they signed.
- **People default to drastic workarounds instead of the contract's own process.** Two of the five (the Trustpilot complainant and "Sr. 4loko") ended up disputing charges or cutting off bank payments rather than working through the contract's stated cancellation process — suggesting the process itself was unclear or felt untrustworthy to them.

## What I could not find

- **No individual Reddit or Quora posts.** Despite many search phrasings, the search tool never surfaced a specific, linkable Reddit thread from r/legaladvice, r/freelance, r/Tenant, r/personalfinance, r/smallbusiness, r/LegalAdviceUK, or Quora. A direct attempt to reach Reddit's own search page (through a text-extraction proxy, after the normal page-fetch tool also failed) was blocked with a network-security message. I could not get past this within the search/page budget.
- **No first-person freelance-agreement story.** I could not find a verbatim quote from a freelancer describing being hurt by a specific clause (kill fee, IP/ownership assignment, non-compete, unlimited revisions) in their own contract. The one non-compete story I found (a professional artist's Substack post) turned out to be her retelling someone else's situation in a letter, not that person's own words — so I excluded it rather than pass it off as a direct quote.
- **No first-person small-business or lease/rental story with a named person.** Leads existed (a tenant-forum thread, a Trustpilot class-action article that likely quotes named plaintiffs) but the pages were blocked by bot protection (403 or a "checking your browser" wall) before I could read them, and I did not have page-read budget left to keep retrying.
- **Did not reach 8 findings.** I stopped at 5 because I hit the 15-page read limit (with all 12 searches also already used). I chose not to pad the list with weaker matches — two timeshare "exit company" stories I found (a woman who paid $12,000 and a couple who paid $8,600 to a company that claimed it could get them out of their timeshares) were dropped because the quotes I could verify described the exit company failing to deliver, not the person misunderstanding a specific clause in a contract they signed.
