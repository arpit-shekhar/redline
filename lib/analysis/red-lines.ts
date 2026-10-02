import type { Leverage, RedLine } from "./types.ts";

// The defaults every user's list starts from (PRD.md section 5). Fixed until
// red lines become editable.
export const DEFAULT_RED_LINES: RedLine[] = [
  { clauseType: "Automatic renewal", severity: "must-change", enabled: true },
  { clauseType: "Personal guarantees", severity: "must-change", enabled: true },
  {
    clauseType: "Forced arbitration and class-action waivers",
    severity: "must-change",
    enabled: true,
  },
  {
    clauseType: "Weak freelance payment terms",
    severity: "must-change",
    enabled: true,
  },
  { clauseType: "Non-competes", severity: "must-change", enabled: true },
  {
    clauseType: "Security deposit withholding",
    severity: "must-change",
    enabled: true,
  },
  {
    clauseType: "Late fees and penalties",
    severity: "worth-raising",
    enabled: true,
  },
  {
    clauseType: "Indemnity and liability caps",
    severity: "worth-raising",
    enabled: true,
  },
];

// Until the user says otherwise, assume they cannot afford to lose the deal,
// so nothing drafted for them reads as a demand.
export const DEFAULT_LEVERAGE: Leverage = "cannot-walk-away";
