export const DOCUMENT_TYPES = [
  { value: "contract", label: "Contract" },
  { value: "lease", label: "Lease" },
  { value: "freelance-agreement", label: "Freelance agreement" },
  { value: "terms-of-service", label: "Terms of service" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

export function isDocumentType(value: unknown): value is DocumentType {
  return DOCUMENT_TYPES.some((type) => type.value === value);
}

// Exactly two levels, ranked by how hard a clause is to get out of (ADR 0003).
export type Severity = "must-change" | "worth-raising";

export type RedLine = {
  clauseType: string;
  severity: Severity;
  enabled: boolean;
};

// Whether the user can walk away from the deal (ADR 0005).
export type Leverage = "can-walk-away" | "cannot-walk-away";

export type AnalyseInput = {
  text: string;
  documentType: DocumentType;
  redLines: RedLine[];
  leverage: Leverage;
};

export type Analysis = {
  summary: string;
};
