/**
 * htmlUtils.ts
 * 
 * Utility-Funktionen zur Verarbeitung von HTML-Text aus Dataverse.
 * Server-kompatibel (ohne jsdom/DOMPurify für Server-seitiges Rendering).
 */

/**
 * Entfernt alle HTML-Tags aus einem Text und gibt nur Plain Text zurück.
 * Nützlich für Vorschauen/Previews wo keine HTML-Formatierung gewünscht ist.
 * 
 * Server-kompatible Implementierung ohne jsdom.
 * 
 * @param html - HTML-String aus Dataverse
 * @returns Plain Text ohne HTML-Tags
 */
export function stripHtmlTags(html: string | undefined | null): string {
  if (!html) {
    return "";
  }

  // HTML-Tags entfernen (Server-sicher, ohne DOM)
  const cleanText = html
    // Alle HTML-Tags entfernen
    .replace(/<[^>]*>/g, " ")
    // HTML-Entities dekodieren
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Mehrfache Whitespaces aufräumen
    .replace(/\s+/g, " ")
    .trim();

  return cleanText;
}
