export function startsWithHebrewLetter(str: string | undefined): boolean {
  if (!str) return false;
  const code = str.trim().charCodeAt(0);
  return str.length > 0 && code >= 0x0590 && code <= 0x05ff;
}

// letters only: NFC, no niqqud / dagesh / cantillation / maqaf (the same marks almi-ai ignores)
export function hebrewLettersOnly(str: string): string {
  return str.normalize("NFC").replace(/[֑-ׇ]/g, "");
}

// כתב -> כ-ת-ב
export function dashedRoot(name: string): string {
  return [...name].join("-");
}

// Standard Hebrew keyboard layout by physical key: the same key gives the same letter
// whatever layout is active (S, Ы and ד are one key).
const HEBREW_KEY_BY_CODE: Record<string, string> = {
  KeyE: "ק",
  KeyR: "ר",
  KeyT: "א",
  KeyY: "ט",
  KeyU: "ו",
  KeyI: "ן",
  KeyO: "ם",
  KeyP: "פ",
  KeyA: "ש",
  KeyS: "ד",
  KeyD: "ג",
  KeyF: "כ",
  KeyG: "ע",
  KeyH: "י",
  KeyJ: "ח",
  KeyK: "ל",
  KeyL: "ך",
  Semicolon: "ף",
  KeyZ: "ז",
  KeyX: "ס",
  KeyC: "ב",
  KeyV: "ה",
  KeyB: "נ",
  KeyN: "מ",
  KeyM: "צ",
  Comma: "ת",
  Period: "ץ",
};

const FINAL_TO_REGULAR: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};

// roots have no final letters (sofit): ך -> כ, ם -> מ, ...
function toRegularLetter(ch: string): string {
  return FINAL_TO_REGULAR[ch] ?? ch;
}

function isHebrewLetter(ch: string): boolean {
  return ch >= "א" && ch <= "ת";
}

// the root letter a key press stands for, or null when it is not a letter key
export function rootLetterFromKey(key: string, code: string): string | null {
  if (isHebrewLetter(key)) return toRegularLetter(key);
  const byCode = HEBREW_KEY_BY_CODE[code];
  return byCode ? toRegularLetter(byCode) : null;
}

// letters of a pasted text: Hebrew letters only, regular forms
export function rootLettersFromText(text: string): string[] {
  return [...text.normalize("NFC")].filter(isHebrewLetter).map(toRegularLetter);
}
