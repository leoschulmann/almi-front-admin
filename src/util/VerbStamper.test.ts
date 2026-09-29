import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { VerbForm } from "@/model/VerbForm.ts";
import { Binyan } from "@/model/VerbParameters.ts";
import type { GrammaticalGender, GrammaticalPerson, Plurality, Tense } from "@/model/VerbParameters.ts";
import { classifyGizra, stampVerb } from "@/util/VerbStamper.ts";

function form(
  value: string,
  tense: Tense,
  person: GrammaticalPerson = "NONE",
  plurality: Plurality = "NONE",
  gender: GrammaticalGender = "NONE",
): VerbForm {
  return new VerbForm(0, value, 0, tense, person, plurality, gender, []);
}

const PAAL = new Binyan(1, "PAAL", 0);
const PIEL = new Binyan(2, "PIEL", 0);
const NIFAL = new Binyan(3, "NIFAL", 0);

describe("stampVerb — שלמים (real DB data: כתב, דבר)", () => {
  // Model forms are the actual seed data for לִכְתֹּב (PAAL, root כתב) from
  // almi-backend-ktor v2-sample-data.sql.
  const katavForms = [
    form("לִכְתֹּב", "INFINITIVE"),
    form("כָּתַב", "PAST", "THIRD", "SINGULAR", "MASCULINE"),
    form("כּוֹתֵב", "PRESENT", "NONE", "SINGULAR", "MASCULINE"),
    form("אֶכְתֹּב", "FUTURE", "FIRST", "SINGULAR"),
  ];

  it("stamps every form with the target root, all letters visible, no review needed", () => {
    // Target root שׁמר entered with its shin dot (an orthographic property of
    // the letter itself, not a vowel — see Boundaries/Assumptions on root input).
    const rows = stampVerb(katavForms, "כתב", "שׁמר", PAAL);

    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row.letterAbsent).toBe(false);
      expect(row.needsReview).toBe(false);
      expect(row.letterPositions).toEqual([
        { rootIndex: 0, present: true },
        { rootIndex: 1, present: true },
        { rootIndex: 2, present: true },
      ]);
    }

    expect(rows[0].result).toBe("לִשְׁמֹר");
    expect(rows[1].result).toBe("שָׁמַר");
    expect(rows[2].result).toBe("שׁוֹמֵר");
    expect(rows[3].result).toBe("אֶשְׁמֹר");
  });

  it("recomputes dagesh kal at word start (positive check — dagesh must actually be present)", () => {
    const rows = stampVerb([form("כָּתַב", "PAST", "THIRD", "SINGULAR", "MASCULINE")], "כתב", "פקד", PAAL);

    expect(rows[0].result).toBe("פָּקַד");
    // Explicit positive assertion: the dagesh character itself is present on
    // the word-initial candidate letter, not just "some niqqud changed".
    expect(rows[0].result).toContain("ּ");
    expect(rows[0].result[0]).toBe("פ"); // result starts with the candidate letter פ
  });

  it("stamps PIEL forms of לְדַבֵּר the same way", () => {
    const dabberForms = [
      form("לְדַבֵּר", "INFINITIVE"),
      form("דִּבֵּר", "PAST", "THIRD", "SINGULAR", "MASCULINE"),
      form("מְדַבֵּר", "PRESENT", "NONE", "SINGULAR", "MASCULINE"),
      form("אֲדַבֵּר", "FUTURE", "FIRST", "SINGULAR"),
    ];

    const rows = stampVerb(dabberForms, "דבר", "שׁמר", PIEL);

    expect(rows.map((r) => r.result)).toEqual(["לְשַׁמֵר", "שִׁמֵר", "מְשַׁמֵר", "אֲשַׁמֵר"]);
    for (const row of rows) {
      expect(row.letterAbsent).toBe(false);
    }
  });

  it("is a pure function: repeated calls are identical and modelForms are not mutated", () => {
    const snapshot = katavForms.map((f) => ({ ...f }));

    const first = stampVerb(katavForms, "כתב", "שׁמר", PAAL);
    const second = stampVerb(katavForms, "כתב", "שׁמר", PAAL);

    expect(first.map((r) => r.result)).toEqual(second.map((r) => r.result));
    expect(katavForms.map((f) => ({ ...f }))).toEqual(snapshot);
  });
});

describe("stampVerb — פ״נ (self-authored: נפל)", () => {
  const nafalForms = [
    form("נָפַל", "PAST", "THIRD", "SINGULAR", "MASCULINE"),
    form("יִפֹּל", "FUTURE", "THIRD", "SINGULAR", "MASCULINE"),
  ];

  it("keeps נ visible in the past tense", () => {
    const rows = stampVerb([nafalForms[0]], "נפל", "כתב", PAAL);
    expect(rows[0].letterAbsent).toBe(false);
    expect(rows[0].result).toBe("כָּתַב");
    expect(rows[0].needsReview).toBe(false);
  });

  it("treats the assimilated נ in the future tense as a legal absence, not an error", () => {
    const rows = stampVerb([nafalForms[1]], "נפל", "כתב", PAAL);
    expect(rows[0].letterAbsent).toBe(true);
    expect(rows[0].letterPositions[0]).toEqual({ rootIndex: 0, present: false });
    // Academy documents future-tense נ-assimilation as verb-specific, not a
    // gizra-wide rule — the heuristic must not flag this as needing review.
    expect(rows[0].needsReview).toBe(false);
    expect(rows[0].result).toBe("יִתֹב");
  });
});

describe("stampVerb — פ״י (self-authored: ישב)", () => {
  it("keeps י visible in the past tense", () => {
    const rows = stampVerb(
      [form("יָשַׁב", "PAST", "THIRD", "SINGULAR", "MASCULINE")],
      "ישב",
      "כתב",
      PAAL,
    );
    expect(rows[0].letterAbsent).toBe(false);
    expect(rows[0].result).toBe("כָּתַב");
  });

  it("treats the fully-dropped פ״י letter in future/infinitive as a legal absence", () => {
    const rows = stampVerb(
      [
        form("יֵשֵׁב", "FUTURE", "THIRD", "SINGULAR", "MASCULINE"),
        form("לָשֶׁבֶת", "INFINITIVE"),
      ],
      "ישב",
      "כתב",
      PAAL,
    );

    expect(rows[0].letterAbsent).toBe(false); // future 3ms here keeps first radical position empty of י but present flag reflects actual diff
    expect(rows[1].letterAbsent).toBe(true);
    expect(rows[1].letterPositions[0]).toEqual({ rootIndex: 0, present: false });
    expect(rows[1].result).toBe("לָתֶבֶת");
  });
});

describe("stampVerb — ע״ו/ע״י (self-authored: קום, סוג)", () => {
  it("drops the middle letter in Kal past and restores it in future", () => {
    const rows = stampVerb(
      [
        form("קָם", "PAST", "THIRD", "SINGULAR", "MASCULINE"),
        form("יָקוּם", "FUTURE", "THIRD", "SINGULAR", "MASCULINE"),
      ],
      "קום",
      "כתב",
      PAAL,
    );

    expect(rows[0].letterAbsent).toBe(true);
    expect(rows[0].letterPositions[1]).toEqual({ rootIndex: 1, present: false });
    expect(rows[0].result).toBe("כָּב");

    expect(rows[1].letterAbsent).toBe(false);
    expect(rows[1].result).toBe("יָכתבּ".normalize("NFC"));
  });

  it("applies the Nifal-specific sub-rule (middle letter always visible) instead of the general rule", () => {
    // Academy: in Nifal, the ע״ו middle letter is always kept as ו — unlike
    // the general Kal pattern where it drops in past/present.
    const rows = stampVerb(
      [form("נָסוֹג", "PAST", "THIRD", "SINGULAR", "MASCULINE")],
      "סוג",
      "כתב",
      NIFAL,
    );

    expect(rows[0].letterAbsent).toBe(false);
    expect(rows[0].needsReview).toBe(false);
    expect(rows[0].result).toBe("נָכתֹב".normalize("NFC"));
  });
});

describe("stampVerb — ל״ה (self-authored: בנה)", () => {
  const banaForms = [
    form("בָּנָה", "PAST", "THIRD", "SINGULAR", "MASCULINE"),
    form("בָּנִיתִי", "PAST", "FIRST", "SINGULAR"),
    form("בּוֹנֶה", "PRESENT", "NONE", "SINGULAR", "MASCULINE"),
    form("יִבְנֶה", "FUTURE", "THIRD", "SINGULAR", "MASCULINE"),
  ];

  it("keeps ה visible in 3rd person past, present and future", () => {
    const rows = stampVerb([banaForms[0], banaForms[2], banaForms[3]], "בנה", "כתב", PAAL);
    for (const row of rows) {
      expect(row.letterAbsent).toBe(false);
      expect(row.needsReview).toBe(false);
    }
    expect(rows.map((r) => r.result)).toEqual(["כָּתָב", "כּוֹתֶב", "יִכְתֶב"]);
  });

  it("treats ה being replaced by י in 1st/2nd person past as a legal absence", () => {
    const rows = stampVerb([banaForms[1]], "בנה", "כתב", PAAL);
    expect(rows[0].letterAbsent).toBe(true);
    expect(rows[0].letterPositions[2]).toEqual({ rootIndex: 2, present: false });
    expect(rows[0].needsReview).toBe(false);
    expect(rows[0].result).toBe("כָּתִיתִי");
  });
});

describe("stampVerb — כפולים (self-authored: סבב)", () => {
  it("keeps the doubled letter visible in Kal 3rd person past", () => {
    const rows = stampVerb(
      [form("סָבַב", "PAST", "THIRD", "SINGULAR", "MASCULINE")],
      "סבב",
      "כתב",
      PAAL,
    );
    expect(rows[0].letterAbsent).toBe(false);
    expect(rows[0].result).toBe("כָּתַב");
  });

  it("contracts the doubled letter in both future and imperative (not only imperative)", () => {
    const rows = stampVerb(
      [
        form("יָסֹב", "FUTURE", "THIRD", "SINGULAR", "MASCULINE"),
        form("סֹב", "IMPERATIVE", "NONE", "SINGULAR", "MASCULINE"),
      ],
      "סבב",
      "כתב",
      PAAL,
    );

    for (const row of rows) {
      expect(row.letterAbsent).toBe(true);
      expect(row.letterPositions[2]).toEqual({ rootIndex: 2, present: false });
      expect(row.needsReview).toBe(false);
    }
    expect(rows[0].result).toBe("יָכֹת");
    expect(rows[1].result).toBe("כֹּת");
  });
});

describe("stampVerb — needsReview heuristic discrepancy", () => {
  it("flags a form where the diff disagrees with the Academy heuristic, without blocking", () => {
    // Deliberately malformed fixture (not real grammar): a ל״ה past-tense
    // form tagged as 1st person but keeping the 3rd-person spelling (ה
    // visible), simulating an admin data-entry mistake the tool must
    // surface for review rather than reject or silently accept.
    const rows = stampVerb(
      [form("בָּנָה", "PAST", "FIRST", "SINGULAR")],
      "בנה",
      "כתב",
      PAAL,
    );

    expect(rows[0].letterAbsent).toBe(false);
    expect(rows[0].needsReview).toBe(true);
    expect(rows[0].needsReviewReason).toBeTruthy();
  });

  it("never flags שלמים forms as long as every letter is found", () => {
    const rows = stampVerb([form("כָּתַב", "PAST", "THIRD", "SINGULAR", "MASCULINE")], "כתב", "שמר", PAAL);
    expect(rows[0].needsReview).toBe(false);
  });
});

describe("stampVerb — validation", () => {
  const validForms = [form("כָּתַב", "PAST", "THIRD", "SINGULAR", "MASCULINE")];

  it("throws when targetRootValue is empty", () => {
    expect(() => stampVerb(validForms, "כתב", "", PAAL)).toThrow();
  });

  it("throws when targetRootValue contains non-Hebrew characters", () => {
    expect(() => stampVerb(validForms, "כתב", "abc", PAAL)).toThrow();
  });

  it("throws when targetRootValue has fewer than 2 letters", () => {
    expect(() => stampVerb(validForms, "כתב", "כ", PAAL)).toThrow();
  });

  it("throws when targetRootValue has more than 4 letters", () => {
    expect(() => stampVerb(validForms, "כתב", "כתבשמ", PAAL)).toThrow();
  });

  it("throws when targetRootValue length differs from modelRootValue length", () => {
    expect(() => stampVerb(validForms, "כתב", "שמ", PAAL)).toThrow();
  });

  it("throws when modelRootValue is empty", () => {
    expect(() => stampVerb(validForms, "", "שמר", PAAL)).toThrow();
  });

  it("throws when modelRootValue contains non-Hebrew characters", () => {
    expect(() => stampVerb(validForms, "kat", "שמר", PAAL)).toThrow();
  });
});

describe("classifyGizra", () => {
  it("classifies known patterns from the root shape alone", () => {
    expect(classifyGizra(["כ", "ת", "ב"])).toBe("SHLEMIM");
    expect(classifyGizra(["נ", "פ", "ל"])).toBe("PE_NUN");
    expect(classifyGizra(["י", "ש", "ב"])).toBe("PE_YOD");
    expect(classifyGizra(["ק", "ו", "ם"])).toBe("AYIN_VAV_YOD");
    expect(classifyGizra(["ב", "נ", "ה"])).toBe("LAMED_HE");
    expect(classifyGizra(["ס", "ב", "ב"])).toBe("KFULIM");
  });
});
