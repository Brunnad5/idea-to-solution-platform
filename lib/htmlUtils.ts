/**
 * htmlUtils.ts
 * 
 * Utility-Funktionen zur Verarbeitung von HTML-Text aus Dataverse.
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Entfernt alle HTML-Tags aus einem Text und gibt nur Plain Text zurück.
 * Nützlich für Vorschauen/Previews wo keine HTML-Formatierung gewünscht ist.
 * 
 * @param html - HTML-String aus Dataverse
 * @returns Plain Text ohne HTML-Tags
 */
export function stripHtmlTags(html: string | undefined | null): string {
  if (!html) {
    return "";
  }

  // DOMPurify mit leeren ALLOWED_TAGS = alle Tags entfernen
  const cleanText = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // Keine Tags erlauben = nur Text
    ALLOWED_ATTR: [], // Keine Attribute erlauben
  });

  // Mehrfache Whitespaces und Zeilenumbrüche aufräumen
  return cleanText
    .replace(/\s+/g, " ") // Mehrfache Spaces zu einem
    .replace(/\n\s*\n/g, "\n") // Mehrfache Zeilenumbrüche zu einem
    .trim();
}
