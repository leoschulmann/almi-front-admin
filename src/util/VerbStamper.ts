import type { Binyan, GrammaticalPerson, Tense } from "@/model/VerbParameters.ts";
import { VerbForm } from "@/model/VerbForm.ts";

/**
 * Diff/substitution engine (CAP-1): builds a preview of every form of a new verb
 * by substituting the root letters of an already-saved "model" verb of the same
 * binyan+gizra with a new target root.
 *
 * Pure TS core — no React, no network (AD-2). Does not mutate its inputs.
 */

// ---------------------------------------------------------------------------
// Low-level Hebrew helpers (AD-1)
// ---------------------------------------------------------------------------

const HEBREW_CONSONANT = /[א-ת]/;
const SHIN_SIN_DOT = /[ׁׂ]/;
const SHVA = "ְ";
const DAGESH = "ּ";
// Marks that belong to the donor letter's own identity (dagesh + shin/sin
// dot) and must never be copied mechanically onto a substituted letter.
const DONOR_ONLY_MARKS = /[ּׁׂ]/g;

const SOFIT_TO_BASE: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};

const BASE_TO_SOFIT: Record<string, string> = {
  כ: "ך",
  מ: "ם",
  נ: "ן",
  פ: "ף",
  צ: "ץ",
};

const DAGESH_KAL_CANDIDATES = new Set(["ב", "כ", "פ"]);

function isHebrewConsonant(ch: string): boolean {
  return HEBREW_CONSONANT.test(ch);
}

function collapseSofit(ch: string): string {
  return SOFIT_TO_BASE[ch] ?? ch;
}

// ---------------------------------------------------------------------------
// Root parsing / validation
// ---------------------------------------------------------------------------

/**
 * One "unit" of a root: a consonant, optionally carrying a shin/sin
 * disambiguation dot (e.g. "שׁ"). Roots are entered without niqqud (vowels),
 * but the shin/sin dot is an orthographic property of the letter itself, not
 * a vowel — so it is allowed and treated as part of the same unit.
 */
function parseRootUnits(root: string, label: string): string[] {
  if (!root || root.trim() === "") {
    throw new Error(`${label} must not be empty`);
  }

  const chars = Array.from(root.normalize("NFD"));
  const units: string[] = [];

  for (const ch of chars) {
    if (isHebrewConsonant(ch)) {
      units.push(collapseSofit(ch));
    } else if (SHIN_SIN_DOT.test(ch) && units.length > 0) {
      units[units.length - 1] += ch;
    } else {
      throw new Error(
        `${label} must consist only of Hebrew consonants, got "${root}"`,
      );
    }
  }

  if (units.length === 0) {
    throw new Error(`${label} must contain at least one Hebrew letter, got "${root}"`);
  }

  return units;
}

function validateModelRoot(root: string): string[] {
  const units = parseRootUnits(root, "modelRootValue");

  if (units.length < 2 || units.length > 4) {
    throw new Error(
      `modelRootValue must contain between 2 and 4 letters, got ${units.length} ("${root}")`,
    );
  }

  return units;
}

function validateTargetRoot(root: string, modelRootUnits: string[]): string[] {
  const units = parseRootUnits(root, "targetRootValue");

  if (units.length < 2 || units.length > 4) {
    throw new Error(
      `targetRootValue must contain between 2 and 4 letters, got ${units.length} ("${root}")`,
    );
  }

  if (units.length !== modelRootUnits.length) {
    throw new Error(
      `targetRootValue length (${units.length}) must match modelRootValue length (${modelRootUnits.length})`,
    );
  }

  return units;
}

// ---------------------------------------------------------------------------
// Gizra classification (AD-3 heuristic input; not the source of truth)
// ---------------------------------------------------------------------------

export type GizraCategory =
  | "SHLEMIM"
  | "PE_NUN"
  | "PE_YOD"
  | "AYIN_VAV_YOD"
  | "LAMED_HE"
  | "KFULIM";

/**
 * Classifies a gizra purely from the shape of the root letters. This is a
 * coarse heuristic (a root can technically belong to more than one gizra;
 * see Review Triage Log) used only to pick a needsReview heuristic table —
 * never to block or alter the actual diff/substitution.
 */
export function classifyGizra(rootUnits: string[]): GizraCategory {
  const base = rootUnits.map((u) => collapseSofit(u[0]));

  if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
    return "KFULIM";
  }
  if (base[base.length - 1] === "ה") {
    return "LAMED_HE";
  }
  if (base[0] === "נ") {
    return "PE_NUN";
  }
  if (base[0] === "י") {
    return "PE_YOD";
  }
  if (base.length === 3 && (base[1] === "ו" || base[1] === "י")) {
    return "AYIN_VAV_YOD";
  }
  return "SHLEMIM";
}

/** Root-letter index (0-based) that a gizra's heuristic table cares about. */
function gizraFocusIndex(gizra: GizraCategory, rootLength: number): number {
  switch (gizra) {
    case "PE_NUN":
    case "PE_YOD":
      return 0;
    case "AYIN_VAV_YOD":
      return 1;
    case "LAMED_HE":
    case "KFULIM":
      return rootLength - 1;
    default:
      return -1;
  }
}

type Visibility = "visible" | "absent" | "variable";

/**
 * Category → expected letter visibility, per `gizrot-academy-rules.md`. This
 * is a coarse (gizra, binyan, tense, person) table, deliberately NOT a
 * per-verb exception list (see Boundaries "Never"). "variable" means the
 * Academy itself documents per-verb variability — we never flag needsReview
 * for those cells.
 */
function expectedVisibility(
  gizra: GizraCategory,
  binyan: string,
  tense: Tense,
  person: GrammaticalPerson,
): Visibility {
  switch (gizra) {
    case "SHLEMIM":
      return "visible";

    case "PE_NUN":
      // נ never drops in past/present; future/imperative/infinitive
      // assimilation is documented as verb-specific (Academy).
      if (tense === "PAST" || tense === "PRESENT") return "visible";
      return "variable";

    case "PE_YOD":
      if (tense === "PAST" || tense === "PRESENT") return "visible";
      if (binyan === "HIFIL" || binyan === "HUFAL") {
        // Diphthong contraction after the prefix is the documented default.
        return "absent";
      }
      // Kal future/infinitive: three documented sub-patterns, verb-specific.
      return "variable";

    case "AYIN_VAV_YOD":
      if (binyan === "NIFAL") {
        // Documented sub-rule: Nifal always keeps the middle letter as ו.
        return "visible";
      }
      if (binyan === "HIFIL" || binyan === "HUFAL") {
        return "absent";
      }
      if (binyan === "PAAL") {
        if (tense === "PAST" || tense === "PRESENT") return "absent";
        return "visible";
      }
      // Piel/Pual/Hitpael use the polel pattern (letter duplication) — a
      // structurally different case, not modeled here.
      return "variable";

    case "LAMED_HE":
      if (tense === "PAST" && (person === "FIRST" || person === "SECOND")) {
        // Letter surfaces as י instead of ה — our positional diff will not
        // find the root's ה, which is the expected (legal) outcome here.
        return "absent";
      }
      return "visible";

    case "KFULIM":
      if (binyan === "HIFIL" || binyan === "HUFAL" || binyan === "NIFAL") {
        return "visible";
      }
      if (binyan === "PAAL") {
        if (tense === "FUTURE" || tense === "IMPERATIVE") return "absent";
        if (tense === "PAST" && person === "THIRD") return "visible";
        if (tense === "PRESENT") return "visible";
        return "variable";
      }
      return "variable";

    default:
      return "variable";
  }
}

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export interface RootLetterPosition {
  /** Index of the letter within the root (0-based), not within the form's string. */
  rootIndex: number;
  present: boolean;
}

export interface PreviewRow {
  sourceForm: VerbForm;
  result: string;
  letterPositions: RootLetterPosition[];
  letterAbsent: boolean;
  needsReview: boolean;
  needsReviewReason?: string;
}

interface WordSegment {
  letter: string;
  marks: string;
}

interface RootMatch {
  /** Index into the word's consonant segments, or null if the letter is absent. */
  segmentIndex: number | null;
}

// ---------------------------------------------------------------------------
// Positional matching + substitution
// ---------------------------------------------------------------------------

function buildSegments(formValue: string): { prefix: string; segments: WordSegment[] } {
  const chars = Array.from(formValue.normalize("NFD"));
  const baseIndices: number[] = [];
  chars.forEach((ch, i) => {
    if (isHebrewConsonant(ch)) baseIndices.push(i);
  });

  const prefix = baseIndices.length > 0 ? chars.slice(0, baseIndices[0]).join("") : chars.join("");

  const segments: WordSegment[] = baseIndices.map((idx, i) => {
    const nextBoundary = i + 1 < baseIndices.length ? baseIndices[i + 1] : chars.length;
    return {
      letter: chars[idx],
      marks: chars.slice(idx + 1, nextBoundary).join(""),
    };
  });

  return { prefix, segments };
}

/** Positional, cursor-based subsequence match of root letters against a form's skeleton. */
function matchRootPositions(segments: WordSegment[], modelRootUnits: string[]): RootMatch[] {
  const skeletonBase = segments.map((s) => collapseSofit(s.letter));
  const modelBase = modelRootUnits.map((u) => collapseSofit(u[0]));

  const matches: RootMatch[] = [];
  let cursor = 0;

  for (const letter of modelBase) {
    let found = -1;
    for (let j = cursor; j < skeletonBase.length; j++) {
      if (skeletonBase[j] === letter) {
        found = j;
        break;
      }
    }
    if (found >= 0) {
      matches.push({ segmentIndex: found });
      cursor = found + 1;
    } else {
      matches.push({ segmentIndex: null });
    }
  }

  return matches;
}

function isBareOrShvaNach(marks: string): boolean {
  if (marks.length === 0) return true;
  return Array.from(marks).every((c) => c === SHVA);
}

function substituteRoot(
  formValue: string,
  modelRootUnits: string[],
  targetRootUnits: string[],
): { result: string; positions: RootLetterPosition[] } {
  const { prefix, segments } = buildSegments(formValue);
  const matches = matchRootPositions(segments, modelRootUnits);

  const positions: RootLetterPosition[] = matches.map((m, i) => ({
    rootIndex: i,
    present: m.segmentIndex !== null,
  }));

  // Work on a shallow copy so we never mutate anything derived from the
  // (read-only) input form.
  const output: WordSegment[] = segments.map((s) => ({ ...s }));
  const lastSegmentIndex = output.length - 1;

  matches.forEach((m, rootIndex) => {
    if (m.segmentIndex === null) return;

    const j = m.segmentIndex;
    const targetUnit = targetRootUnits[rootIndex];
    const targetBase = targetUnit[0];
    const extraMark = targetUnit.length > 1 ? targetUnit.slice(1) : "";

    const isFinal = j === lastSegmentIndex;
    const newLetter = isFinal ? (BASE_TO_SOFIT[targetBase] ?? targetBase) : targetBase;

    const isCandidate = DAGESH_KAL_CANDIDATES.has(targetBase);
    const previousMarks = j === 0 ? null : output[j - 1].marks;
    const dageshApplies = isCandidate && (previousMarks === null || isBareOrShvaNach(previousMarks));

    // Strip the donor letter's own dagesh and shin/sin dot — both are
    // properties of the donor's letter identity, not of the target letter,
    // and must not be copied mechanically (AD-1 / Boundaries).
    let marks = output[j].marks.replace(DONOR_ONLY_MARKS, "");
    if (dageshApplies) {
      marks = DAGESH + marks;
    }
    marks = extraMark + marks;

    output[j] = { letter: newLetter, marks };
  });

  const result = (prefix + output.map((s) => s.letter + s.marks).join("")).normalize("NFC");

  return { result, positions };
}

// ---------------------------------------------------------------------------
// needsReview heuristic
// ---------------------------------------------------------------------------

function evaluateNeedsReview(
  gizra: GizraCategory,
  binyan: string,
  tense: Tense,
  person: GrammaticalPerson,
  positions: RootLetterPosition[],
): { needsReview: boolean; reason?: string } {
  const focusIndex = gizraFocusIndex(gizra, positions.length);
  if (focusIndex < 0 || focusIndex >= positions.length) {
    return { needsReview: false };
  }

  const expected = expectedVisibility(gizra, binyan, tense, person);
  if (expected === "variable") {
    return { needsReview: false };
  }

  const actualPresent = positions[focusIndex].present;
  const expectedPresent = expected === "visible";

  if (actualPresent !== expectedPresent) {
    return {
      needsReview: true,
      reason: `Academy heuristic expects root letter ${focusIndex} to be ${
        expectedPresent ? "visible" : "absent"
      } for ${gizra}/${binyan}/${tense}${person !== "NONE" ? "/" + person : ""}, but the diff found it ${
        actualPresent ? "visible" : "absent"
      }`,
    };
  }

  return { needsReview: false };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function stampVerb(
  modelForms: VerbForm[],
  modelRootValue: string,
  targetRootValue: string,
  modelBinyanValue: Binyan,
): PreviewRow[] {
  const modelRootUnits = validateModelRoot(modelRootValue);
  const targetRootUnits = validateTargetRoot(targetRootValue, modelRootUnits);

  const gizra = classifyGizra(modelRootUnits);
  const binyan = modelBinyanValue.value;

  return modelForms.map((form) => {
    const { result, positions } = substituteRoot(form.value, modelRootUnits, targetRootUnits);
    const letterAbsent = positions.some((p) => !p.present);
    const review = evaluateNeedsReview(gizra, binyan, form.tense, form.person, positions);

    return {
      sourceForm: form,
      result,
      letterPositions: positions,
      letterAbsent,
      needsReview: review.needsReview,
      needsReviewReason: review.reason,
    };
  });
}
