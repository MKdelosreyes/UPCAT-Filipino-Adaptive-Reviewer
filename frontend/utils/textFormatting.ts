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