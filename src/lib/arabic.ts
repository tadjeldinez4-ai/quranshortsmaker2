// Strip Arabic diacritics (harakat) and Quranic annotation marks,
// while preserving Shadda (U+0651) and letters themselves.
//
// Removed:
//   U+064B Fathatan, U+064C Dammatan, U+064D Kasratan,
//   U+064E Fatha,    U+064F Damma,    U+0650 Kasra,
//   U+0652 Sukun,    U+0653 Maddah,   U+0654 Hamza above,
//   U+0655 Hamza below, U+0656 Subscript alef, U+0657 Inverted damma,
//   U+0658 Mark noon ghunna, U+0659..U+065F various marks,
//   U+0670 Superscript alef,
//   U+06D6..U+06ED Quranic annotation signs (small high/low marks, sajdah, etc.)
// Kept:
//   U+0651 Shadda
const DIACRITICS_RE = /[\u064B-\u0650\u0652-\u065F\u0670\u06D6-\u06ED]/g;

export function stripArabicDiacritics(text: string): string {
  return text.replace(DIACRITICS_RE, "");
}
