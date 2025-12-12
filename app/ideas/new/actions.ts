/**
 * app/ideas/new/actions.ts
 * 
 * Server Action zum Erstellen einer neuen Idee.
 * Server Actions werden auf dem Server ausgeführt und können direkt
 * aus Client Components aufgerufen werden.
 */

"use server";

import { createIdea } from "@/lib/dataverse";
import { getCurrentUserAsync } from "@/lib/auth";
import { createIdeaSchema, CreateIdeaInput } from "@/lib/validators";

/**
 * Erstellt eine neue Idee in Dataverse.
 * 
 * @param data - Die Formulardaten (title, description)
 * @returns Erfolgsmeldung oder Fehler
 */
export async function submitIdea(data: CreateIdeaInput): Promise<{ 
  success: boolean; 
  error?: string;
  ideaId?: string;
}> {
  try {
    // Daten validieren mit Zod
    const validationResult = createIdeaSchema.safeParse(data);
    
    if (!validationResult.success) {
      // Validierungsfehler zurückgeben (Zod v4 API)
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    // Aktuellen User holen (aus Token oder ENV-Variable)
    const currentUser = await getCurrentUserAsync();
    console.log(`[SubmitIdea] User: ${currentUser.name} <${currentUser.email}> (Source: ${currentUser.source})`);

    // Idee in Dataverse erstellen (mit E-Mail für Ideengeber-Zuordnung)
    const newIdea = await createIdea(
      validationResult.data, 
      currentUser.name,
      currentUser.email // E-Mail für automatische Ideengeber-Zuordnung
    );

    // Erfolg zurückgeben
    return { 
      success: true, 
      ideaId: newIdea.id 
    };
  } catch (error) {
    console.error("Fehler beim Erstellen der Idee:", error);
    
    // Detaillierte Fehlermeldung für Debugging (kann später vereinfacht werden)
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unbekannter Fehler";
    
    return { 
      success: false, 
      error: `Fehler beim Speichern: ${errorMessage}` 
    };
  }
}
