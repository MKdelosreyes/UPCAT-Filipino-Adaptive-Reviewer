/**
 * Convert text to sentence case (first letter uppercase, rest lowercase)
 */
export function toSentenceCase(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert text to all lowercase
 */
export function toLowerCase(text: string): string {
  if (!text) return text;
  return text.toLowerCase();
}

/**
 * Convert text to title case (first letter of each word uppercase)
 */
export function toTitleCase(text: string): string {
  if (!text) return text;
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Capitalize first letter only (keeps rest unchanged)
 */
export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Underline the first occurrence of `wordToUnderline` in `sentence` using <u>...</u>.
 * Robust against quotes/parentheses and avoids lookbehind (more reliable).
 */
export function underlineWordInSentence(sentence: string, wordToUnderline: string) {
  const word = (wordToUnderline ?? "").trim();
  if (!sentence || !word) return sentence;

  const escaped = escapeRegExp(word);

  // Prefix boundary captured as group 1 (start/space/quotes/brackets/etc.)
  // Word captured as group 2
  // Suffix boundary checked via lookahead only (safe)
  const pattern = new RegExp(
    `(^|[\\s"“”'‘’(\\[{])(${escaped})(?=$|[\\s.,!?;:"“”'‘’\\)\\]\\}])`,
    "i"
  );

  return sentence.replace(pattern, (_m, prefix, w) => `${prefix}<u>${w}</u>`);
}

/**
 * True if the sentence contains `word` with similar boundary rules.
 */
export function sentenceContainsWord(sentence: string, word: string) {
  const w = (word ?? "").trim();
  if (!sentence || !w) return false;

  const escaped = escapeRegExp(w);
  const pattern = new RegExp(
    `(^|[\\s"“”'‘’(\\[{])(${escaped})(?=$|[\\s.,!?;:"“”'‘’\\)\\]\\}])`,
    "i"
  );
  return pattern.test(sentence);
}