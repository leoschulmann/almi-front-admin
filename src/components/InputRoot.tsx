import { ClipboardEvent, KeyboardEvent, useEffect, useRef } from "react";
import { rootLetterFromKey, rootLettersFromText } from "@/util/HebrewUtil.ts";

// Root input: the cells only draw `value`, a gap-free string. Letters are only appended to the
// end and Backspace removes the last one; the focus is always on the first empty cell (the last
// cell when full). Letters come from the physical key, so any keyboard layout works.
export function InputRoot({
  value,
  onChange,
  length = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}) {
  const cellsRef = useRef<Array<HTMLInputElement | null>>([]);
  const focusedRef = useRef(false);
  const letters = [...value];
  const activeCell = Math.min(letters.length, length - 1);

  // the focus follows the active cell once the new value is rendered
  useEffect(() => {
    if (focusedRef.current) cellsRef.current[activeCell]?.focus();
  }, [activeCell, value]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.metaKey || e.ctrlKey || e.altKey) return; // copy / paste shortcuts
    if (e.key === "Tab" || e.key === "Enter" || e.key === "Escape") return;

    e.preventDefault();
    if (e.key === "Backspace" || e.key === "Delete") {
      onChange(letters.slice(0, -1).join(""));
      return;
    }
    if (e.key.length !== 1 || letters.length >= length) return;
    const letter = rootLetterFromKey(e.key, e.code);
    if (letter) onChange(value + letter);
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = rootLettersFromText(e.clipboardData.getData("text"));
    onChange([...letters, ...pasted].slice(0, length).join(""));
  }

  return (
    <div dir="rtl" className="flex items-center gap-2">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            cellsRef.current[index] = el;
          }}
          type="text"
          readOnly
          value={letters[index] ?? ""}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => {
            focusedRef.current = true;
            if (index !== activeCell) cellsRef.current[activeCell]?.focus();
          }}
          onBlur={() => {
            focusedRef.current = false;
          }}
          className="w-16 h-16 text-3xl text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 caret-transparent cursor-text"
        />
      ))}
    </div>
  );
}
