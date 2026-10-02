import type { Severity } from "../analysis/types.ts";

// A freelance agreement written for the landing page. It describes no real
// parties and is labelled as a sample wherever it is shown.
export type SampleClause = { number: number; heading: string; text: string };

export type SampleFlag = {
  rank: number;
  severity: Severity;
  clauseType: string;
  clause: number;
  // Quoted word for word from the clause text; sample.test.ts enforces it.
  sentence: string;
  says: string;
  mightDo: string;
};

export const SAMPLE_TITLE = "Freelance Design Agreement";

export const SAMPLE_CLAUSES: SampleClause[] = [
  {
    number: 1,
    heading: "Services",
    text: "The Designer will produce a logo and a set of packaging labels for the Client's new range of bread.",
  },
  {
    number: 2,
    heading: "Fees",
    text: "The Client will pay the Designer a fixed fee of $2,400. Payment is due within 60 days of the Client's written acceptance of the final designs.",
  },
  {
    number: 3,
    heading: "Acceptance",
    text: "The Client may request revisions until it is satisfied with the designs. The final designs are accepted only when the Client confirms acceptance in writing.",
  },
  {
    number: 4,
    heading: "Ownership",
    text: "All rights in the designs pass to the Client on delivery, whether or not payment has been made.",
  },
  {
    number: 5,
    heading: "Delivery",
    text: "The Designer will deliver first drafts within 14 days. If the Designer misses a delivery date, the Client may deduct 5% of the fee for each day of delay.",
  },
  {
    number: 6,
    heading: "Term",
    text: "This agreement renews automatically for further periods of twelve months unless either party gives 90 days' written notice before the renewal date.",
  },
  {
    number: 7,
    heading: "Exclusivity",
    text: "For twelve months after this agreement ends, the Designer will not provide design services to any other business that sells baked goods.",
  },
  {
    number: 8,
    heading: "Liability",
    text: "The Designer will indemnify the Client against all losses, claims and costs arising from the designs.",
  },
  {
    number: 9,
    heading: "Ending the agreement",
    text: "The Client may end this agreement at any time by giving 7 days' written notice.",
  },
];

// Ranked must-change first, then worth-raising, each group in document order.
export const SAMPLE_FLAGS: SampleFlag[] = [
  {
    rank: 1,
    severity: "must-change",
    clauseType: "Weak freelance payment terms",
    clause: 2,
    sentence:
      "Payment is due within 60 days of the Client's written acceptance of the final designs.",
    says: "You are paid 60 days after the client accepts the final designs in writing.",
    mightDo:
      "The 60 days only start once the client accepts in writing, so payment might take much longer than 60 days.",
  },
  {
    rank: 2,
    severity: "must-change",
    clauseType: "Weak freelance payment terms",
    clause: 4,
    sentence:
      "All rights in the designs pass to the Client on delivery, whether or not payment has been made.",
    says: "The client owns the designs as soon as you deliver them, paid or not.",
    mightDo:
      "If the client never pays, you might have nothing left to hold back.",
  },
  {
    rank: 3,
    severity: "must-change",
    clauseType: "Automatic renewal",
    clause: 6,
    sentence:
      "This agreement renews automatically for further periods of twelve months unless either party gives 90 days' written notice before the renewal date.",
    says: "The agreement renews every twelve months unless someone gives 90 days' written notice.",
    mightDo: "Miss that window and you might be held to another full year.",
  },
  {
    rank: 4,
    severity: "must-change",
    clauseType: "Non-competes",
    clause: 7,
    sentence:
      "For twelve months after this agreement ends, the Designer will not provide design services to any other business that sells baked goods.",
    says: "For a year after it ends, you cannot design for any other business that sells baked goods.",
    mightDo:
      "That might rule out a whole group of clients. Whether it can be enforced depends on where you work, which the document does not say.",
  },
  {
    rank: 5,
    severity: "worth-raising",
    clauseType: "Late fees and penalties",
    clause: 5,
    sentence:
      "If the Designer misses a delivery date, the Client may deduct 5% of the fee for each day of delay.",
    says: "The client can take 5% off your fee for each day a delivery is late.",
    mightDo: "Twenty late days would use up the whole fee.",
  },
  {
    rank: 6,
    severity: "worth-raising",
    clauseType: "Indemnity and liability caps",
    clause: 8,
    sentence:
      "The Designer will indemnify the Client against all losses, claims and costs arising from the designs.",
    says: "You cover the client's losses, claims and costs that come from the designs. No upper limit is stated.",
    mightDo: "A single claim about the designs might cost you more than the fee.",
  },
];
