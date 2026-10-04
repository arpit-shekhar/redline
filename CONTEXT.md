# Redline

The words this project uses, and the ones it deliberately avoids. Redline reads
a document somebody is about to sign and tells them what it does to them.

## Language

**Document**:
The text a user uploaded for analysis. Never the file itself, which is discarded
after the browser reads it.
_Avoid_: file, upload, contract (a contract is one of several document types)

**Flag**:
A single clause in a document identified as capable of hurting the user, carrying
a severity and a source sentence. There is one flag per source sentence. When a
sentence crosses more than one red line, its one flag names every red line it
crosses, takes the highest severity among them, and counts once.
_Avoid_: issue, finding, alert, risk, red flag

**Source sentence**:
The exact sentence from the document that a flag came from, quoted word for word
and checkable against the stored text. A flag without one is a bug.
_Avoid_: citation, quote, excerpt, reference, evidence

**Severity**:
How much a flagged clause could hurt this user, ranked primarily by escapability.
Has exactly two values: must-change and worth-raising.
_Avoid_: score, priority, rating, risk level, high/medium/low

**Escapability**:
How hard it is to get out of an obligation once signed, without paying or
waiting. The primary axis for severity — see ADR 0003.
_Avoid_: exit cost, lock-in, stickiness

**Exit clause**:
A clause that lets a party end the whole agreement, for example "either party
may end this agreement with 14 days of written notice by email." It bears on
escapability but does not settle it: ending the deal may not release the user
from an obligation that already applies, such as waiting to be paid for work
delivered, or one that starts when the deal ends, such as a non-compete.
_Avoid_: termination right, way out, escape hatch

**Must-change flag**:
A flag the user should not sign without changing. Reserved for clauses the
analysis is near-certain about.
_Avoid_: high severity, critical, blocker, red

**Worth-raising flag**:
A flag worth asking the other side about, but not on its own a reason to walk.
Where genuine uncertainty lives.
_Avoid_: medium severity, low severity, minor, yellow

**Counter-offer**:
Replacement wording drafted for one flagged clause, written so the user can send
it to the other side.
_Avoid_: redline (collides with the product name), suggestion, edit, rewrite,
markup

**Red line**:
A rule the user sets in advance about what they will not accept in any document.
Red lines drive the analysis. Two words, always: the one-word form is the product.
_Avoid_: preference, dealbreaker, requirement, rule

**Library**:
The user's saved collection of documents already analysed.
_Avoid_: history, archive, vault, workspace

**Leverage**:
Whether the user can walk away from this deal. A standing fact about the user,
stored with their red lines, that changes the wording of every counter-offer.
_Avoid_: power, position, negotiating strength, bargaining power

**Text claim**:
A statement about what the document's words actually say. Checkable against the
source sentence, and therefore stated plainly and without hedging.
_Avoid_: fact, finding, observation

**Outcome claim**:
A statement about what a clause might do to the user in the world. Depends on
facts the document does not contain, and is therefore always marked uncertain.
_Avoid_: prediction, risk, consequence, impact

**Escapability reasoning**:
Why a flag has its severity. It is made of text claims about what the document
says, or leaves out, about getting out of the clause, stated plainly, and
outcome claims about what that could mean for the user, marked uncertain. It
never states the user's future as fact.
_Avoid_: rationale, justification, explanation

**Clean result**:
What a document with no flags returns: a statement that it is clean, plus the
list of what was checked for and not found. Never an empty response.
_Avoid_: no results, null result, pass, all clear

**Pre-signature moment**:
The point at which a user holds an unsigned document and can still negotiate it.
The moment Redline acts on, and an unproven assumption rather than an observed
behaviour — see ADR 0002.
_Avoid_: signing moment, decision point, onboarding
