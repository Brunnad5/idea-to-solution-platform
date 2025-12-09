/**
 * SanitizedHtml.tsx
 * 
 * Client Component zur sicheren Anzeige von HTML-Inhalten aus Dataverse.
 * Verwendet DOMPurify zur Bereinigung und behält harmlose Formatierungen bei.
 */

"use client";

import DOMPurify from "isomorphic-dompurify";

interface SanitizedHtmlProps {
  html: string | undefined | null;
  className?: string;
}

/**
 * Zeigt HTML-Inhalte sicher an.
 * 
 * Erlaubte HTML-Elemente (sichere Formatierung):
 * - p, br, div, span
 * - strong, b, em, i, u
 * - h1-h6
 * - ul, ol, li
 * - blockquote
 * - a (ohne target/_blank)
 * 
 * Gefährliche Elemente werden entfernt:
 * - script, iframe, object, embed
 * - onclick, onerror, etc. Event-Handler
 * - style (CSS-Injection)
 */
export default function SanitizedHtml({ html, className = "" }: SanitizedHtmlProps) {
  if (!html) {
    return null;
  }

  // HTML bereinigen - nur sichere Elemente erlauben
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "div", "span",
      "strong", "b", "em", "i", "u",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote",
      "a"
    ],
    ALLOWED_ATTR: ["href"], // Nur href für Links erlauben
    ALLOW_DATA_ATTR: false, // data-* Attribute verbieten
  });

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      style={{
        // Grundlegende Stile für HTML-Elemente
        '--p-margin-bottom': '0.5rem',
        '--ul-margin-left': '1.5rem',
        '--ol-margin-left': '1.5rem',
        '--li-margin-bottom': '0.25rem',
        '--blockquote-border-left': '4px solid var(--fallback-bc,oklch(var(--bc)))',
        '--blockquote-padding-left': '1rem',
        '--blockquote-margin': '1rem 0',
        '--blockquote-font-style': 'italic',
        '--a-color': 'var(--fallback-pc,oklch(var(--pc)))',
        '--strong-weight': '600',
        '--em-style': 'italic',
      } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
