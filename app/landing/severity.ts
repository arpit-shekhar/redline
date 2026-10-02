import type { Severity } from "@/lib/analysis/types.ts";

export const SEVERITY_LABEL: Record<Severity, string> = {
  "must-change": "Must change",
  "worth-raising": "Worth raising",
};

export const TAB_CLASS: Record<Severity, string> = {
  "must-change": "tab-red",
  "worth-raising": "tab-yellow",
};

export const FILM_CLASS: Record<Severity, string> = {
  "must-change": "film-must-change",
  "worth-raising": "film-worth-raising",
};
