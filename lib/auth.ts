/**
 * auth.ts
 * 
 * Hilfsfunktionen für die Authentifizierung.
 * 
 * PROTOTYP-MODUS:
 * Da keine Azure App Registration verfügbar ist, verwenden wir einen
 * Mock-User, der über Umgebungsvariablen konfiguriert wird.
 * 
 * Für Produktion müsste hier NextAuth.js mit Azure AD eingebunden werden.
 */

/**
 * Typ für einen authentifizierten User.
 */
export interface User {
  name: string;
  email: string;
}

/**
 * Gibt den aktuell "eingeloggten" User zurück.
 * 
 * Im Prototyp: Liest die Werte aus den Umgebungsvariablen.
 * In Produktion: Würde die Session von NextAuth.js verwenden.
 */
export function getCurrentUser(): User {
  return {
    name: process.env.MOCK_USER_NAME || "Demo User",
    email: process.env.MOCK_USER_EMAIL || "demo@example.com",
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
 * @param ideaSubmittedBy - Der Name des Users, der die Idee eingereicht hat
 */
export function isIdeaOwner(ideaSubmittedBy: string | undefined | null): boolean {
  // Wenn kein Einreicher angegeben, kann niemand Besitzer sein
  if (!ideaSubmittedBy) {
    return false;
  }
  
  const currentUser = getCurrentUser();
  // Vergleich über den Namen (vereinfacht für Prototyp)
  return currentUser.name.toLowerCase() === ideaSubmittedBy.toLowerCase();
}
