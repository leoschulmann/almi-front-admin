import React, { useRef } from "react";

export function InputRoot({
  glyphs,
  setGlyphs,
}: {
  glyphs: string[];
  setGlyphs: (value: ((prevState: string[]) => string[]) | string[]) => void;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const letter = e.target.value;
    const isValidHebrew = /^[\u0590-\u05FF]$/.test(letter);

    if (!isValidHebrew && letter !== "") return;

    const allLetters = [...glyphs];
    allLetters[index] = letter;
    setGlyphs(allLetters);

    if (letter && index >= 0) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      const newValues = [...glyphs];
      newValues[index] = "";
      setGlyphs(newValues);

      if (index < glyphs.length - 1) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.target.value.length > 0) {
      e.target.setSelectionRange(1, 1);
    }
  };

  return (
    <div dir="rtl" className="flex items-center gap-2">
      {glyphs.map((glyph, index) => (
        <input
          key={index}
          ref={function (el: HTMLInputElement | null): void {
            inputsRef.current[index] = el;
          }}
          type="text"
          value={glyph}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={(e) => handleFocus(e, index)}
          maxLength={1}
          className="w-16 h-16 text-3xl text-center border rounded-lg focus:outline-none"
        />
      ))}
    </div>
  );
}
