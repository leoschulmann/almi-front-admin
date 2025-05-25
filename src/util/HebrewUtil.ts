export function startsWithHebrewLetter(str: string | undefined): boolean {
  if (!str) return false;
  const code = str.trim().charCodeAt(0);
  return str.length > 0 && code >= 0x0590 && code <= 0x05ff;
}
