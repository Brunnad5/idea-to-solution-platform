/**
 * auth.ts
 * 
 * Hilfsfunktionen für die Authentifizierung.
 * 
 * HYBRID-MODUS:
 * 1. Versucht E-Mail aus dem Bearer Token zu extrahieren (wenn vorhanden)
 * 2. Fallback auf Umgebungsvariablen CURRENT_USER_NAME/EMAIL
 * 
 * Für Produktion: NextAuth.js mit Azure AD einbinden.
 */

import { cookies } from "next/headers";

// Cookie-Name für den Dataverse Token
const TOKEN_COOKIE_NAME = "dataverse_token";

/**
 * Typ für einen authentifizierten User.
 */
export interface User {
  name: string;
  email: string;
  source: "token" | "env" | "fallback"; // Woher die Daten stammen
}

/**
 * Dekodiert einen JWT Token und extrahiert die Payload.
 * JWT besteht aus: header.payload.signature (Base64-encoded)
 * 
 * @param token - Der JWT Bearer Token
 * @returns Die dekodierte Payload oder null bei Fehler
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    // JWT besteht aus 3 Teilen, getrennt durch Punkte
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("[Auth] Token ist kein gültiges JWT-Format");
      return null;
    }
    
    // Payload ist der mittlere Teil (Base64URL-encoded)
    const payload = parts[1];
    
    // Base64URL zu Base64 konvertieren
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    
    // Padding hinzufügen falls nötig
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    
    // Dekodieren
    const decoded = Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch (error) {
    console.error("[Auth] Fehler beim Dekodieren des JWT:", error);
    return null;
  }
}

/**
 * Extrahiert User-Informationen aus einem Bearer Token.
 * Azure AD Tokens enthalten typischerweise:
 * - email: E-Mail-Adresse
 * - upn: User Principal Name (oft gleich wie E-Mail)
 * - name: Anzeigename
 * - preferred_username: Bevorzugter Benutzername
 * 
 * @param token - Der Bearer Token
 * @returns User-Objekt oder null wenn nicht extrahierbar
 */
function extractUserFromToken(token: string): { name: string; email: string } | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  
  // E-Mail aus verschiedenen möglichen Claims extrahieren
  const email = 
    (payload.email as string) ||
    (payload.upn as string) ||
    (payload.preferred_username as string) ||
    (payload.unique_name as string);
  
  // Name aus verschiedenen möglichen Claims extrahieren
  const name = 
    (payload.name as string) ||
    (payload.given_name as string) ||
    email?.split("@")[0] || // Fallback: Teil vor @ der E-Mail
    "Unbekannt";
  
  if (email) {
    console.log(`[Auth] User aus Token extrahiert: ${name} <${email}>`);
    return { name, email };
  }
  
  console.warn("[Auth] Keine E-Mail im Token gefunden. Claims:", Object.keys(payload));
  return null;
}

/**
 * Gibt den aktuell "eingeloggten" User zurück.
 * 
 * Priorität:
 * 1. E-Mail aus Bearer Token (wenn Token im Cookie vorhanden)
 * 2. Umgebungsvariablen CURRENT_USER_NAME/EMAIL
 * 3. Fallback auf Demo-Werte
 */
export async function getCurrentUserAsync(): Promise<User> {
  // 1. Versuche Token aus Cookie zu lesen
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
    
    if (tokenCookie?.value) {
      const userFromToken = extractUserFromToken(tokenCookie.value);
      if (userFromToken) {
        return {
          ...userFromToken,
          source: "token",
        };
      }
    }
  } catch {
    // cookies() kann in bestimmten Kontexten fehlschlagen
  }
  
  // 2. Fallback auf Umgebungsvariablen
  const envEmail = process.env.CURRENT_USER_EMAIL;
  const envName = process.env.CURRENT_USER_NAME;
  
  if (envEmail) {
    return {
      name: envName || envEmail.split("@")[0],
      email: envEmail,
      source: "env",
    };
  }
  
  // 3. Letzter Fallback
  console.warn("[Auth] Kein User gefunden - verwende Demo-Fallback");
  return {
    name: "Demo User",
    email: "demo@example.com",
    source: "fallback",
  };
}

/**
 * Synchrone Version für Komponenten, die keine async/await unterstützen.
 * Verwendet nur Umgebungsvariablen (kein Token-Zugriff).
 */
export function getCurrentUser(): User {
  const envEmail = process.env.CURRENT_USER_EMAIL;
  const envName = process.env.CURRENT_USER_NAME;
  
  if (envEmail) {
    return {
      name: envName || envEmail.split("@")[0],
      email: envEmail,
      source: "env",
    };
  }
  
  return {
    name: "Demo User",
    email: "demo@example.com",
    source: "fallback",
  };
}

/**
 * Prüft, ob ein User eingeloggt ist.
 * 
 * Im Prototyp: Immer true, da wir den Mock-User verwenden.
 * In Produktion: Würde die Session prüfen.
 */
export function isAuthenticated(): boolean {
  // Im Prototyp: Immer "eingeloggt"
  return true;
}

/**
 * Prüft, ob der aktuelle User der Besitzer einer Idee ist.
 * 
 * PROTOTYP-HINWEIS: Da wir keine echte Authentifizierung haben,
 * erlauben wir das Bearbeiten aller Ideen. In Produktion würde
 * hier die echte User-ID mit der createdby-GUID verglichen.
 * 
 * @param ideaSubmittedBy - Der Name des Users, der die Idee eingereicht hat
 */
export function isIdeaOwner(ideaSubmittedBy: string | undefined | null): boolean {
  // PROTOTYP: Immer true, damit alle Ideen bearbeitet werden können
  // TODO: In Produktion echten User-ID-Vergleich implementieren
  return true;
  
  // Original-Logik (für Produktion mit echter Auth):
  // if (!ideaSubmittedBy) return false;
  // const currentUser = getCurrentUser();
  // return currentUser.id === ideaCreatedByGuid;
}
