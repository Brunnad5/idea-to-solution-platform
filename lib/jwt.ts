/**
 * jwt.ts
 * 
 * Utility zum Dekodieren von JWT-Tokens.
 * Extrahiert User-Informationen aus dem Dataverse Bearer Token.
 * 
 * HINWEIS: Wir validieren die Signatur nicht, da wir dem Token vertrauen
 * (er kommt direkt aus der Power Apps Session des Users).
 */

/**
 * User-Informationen aus dem JWT-Token
 */
export interface TokenUser {
  // Azure AD Object ID (GUID) - eindeutige Identifikation
  id: string;
  // Anzeigename des Users
  name: string;
  // E-Mail-Adresse
  email: string;
  // Ablaufzeit des Tokens (Unix Timestamp)
  expiresAt: number;
}

/**
 * Dekodiert den Payload eines JWT-Tokens (ohne Signaturprüfung).
 * 
 * Ein JWT besteht aus drei Teilen, getrennt durch Punkte:
 * header.payload.signature
 * 
 * Wir extrahieren nur den Payload (mittlerer Teil).
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    // JWT aufteilen
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Ungültiges Token-Format: Erwartet 3 Teile, erhalten:", parts.length);
      return null;
    }

    // Payload ist der zweite Teil (Base64-kodiert)
    const payload = parts[1];
    
    // Base64 dekodieren (funktioniert im Browser und Node.js)
    let decoded: string;
    if (typeof window !== "undefined") {
      // Browser: atob verwenden
      decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    } else {
      // Node.js: Buffer verwenden
      decoded = Buffer.from(payload, "base64").toString("utf-8");
    }

    return JSON.parse(decoded);
  } catch (error) {
    console.error("Fehler beim Dekodieren des Tokens:", error);
    return null;
  }
}

/**
 * Extrahiert User-Informationen aus einem Dataverse Bearer Token.
 * 
 * Der Token enthält typischerweise diese relevanten Felder:
 * - oid: Object ID (Azure AD User ID)
 * - name: Anzeigename
 * - preferred_username: E-Mail-Adresse
 * - exp: Ablaufzeit (Unix Timestamp)
 */
export function extractUserFromToken(token: string): TokenUser | null {
  // "Bearer " Präfix entfernen falls vorhanden
  const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;
  
  const payload = decodeJwtPayload(cleanToken);
  if (!payload) {
    return null;
  }

  // Relevante Felder extrahieren
  const id = payload.oid as string | undefined;
  const name = payload.name as string | undefined;
  const email = (payload.preferred_username || payload.upn || payload.email) as string | undefined;
  const exp = payload.exp as number | undefined;

  // Mindestens ID muss vorhanden sein
  if (!id) {
    console.error("Token enthält keine Object ID (oid)");
    return null;
  }

  return {
    id,
    name: name || email || "Unbekannter User",
    email: email || "",
    expiresAt: exp || 0,
  };
}

/**
 * Prüft ob ein Token abgelaufen ist.
 */
export function isTokenExpired(token: string): boolean {
  const user = extractUserFromToken(token);
  if (!user || !user.expiresAt) {
    return true; // Im Zweifel als abgelaufen behandeln
  }
  
  // Aktuelle Zeit in Sekunden (Unix Timestamp)
  const now = Math.floor(Date.now() / 1000);
  
  // 60 Sekunden Puffer, um Probleme bei knapper Ablaufzeit zu vermeiden
  return user.expiresAt < now + 60;
}

/**
 * Formatiert die verbleibende Gültigkeitsdauer des Tokens.
 */
export function getTokenTimeRemaining(token: string): string {
  const user = extractUserFromToken(token);
  if (!user || !user.expiresAt) {
    return "Unbekannt";
  }
  
  const now = Math.floor(Date.now() / 1000);
  const remaining = user.expiresAt - now;
  
  if (remaining <= 0) {
    return "Abgelaufen";
  }
  
  const minutes = Math.floor(remaining / 60);
  if (minutes < 60) {
    return `${minutes} Min.`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} Std. ${remainingMinutes} Min.`;
}
