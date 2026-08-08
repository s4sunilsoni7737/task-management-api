/**
 * ✅ PATTERN: Escape special regex characters before interpolating
 * user-supplied search text into a Mongo `$regex` filter — prevents
 * ReDoS / invalid-pattern errors from unescaped input.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
