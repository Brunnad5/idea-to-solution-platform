/**
 * app/ideas/[id]/edit/actions.ts
 * 
 * Server Action zum Aktualisieren einer Idee.
 * Nur die Beschreibung kann bearbeitet werden.
 */

"use server";

import { updateIdeaDescription } from "@/lib/dataverse";
import { editIdeaSchema, EditIdeaInput } from "@/lib/validators";

/**
 * Aktualisiert die Beschreibung einer Idee.
 * Bei Status "in Überarbeitung" wird automatisch auf "eingereicht" zurückgesetzt.
 * 
 * @param id - Die GUID der Idee
 * @param data - Die neuen Formulardaten (nur description)
 * @param currentStatus - Der aktuelle Lifecycle-Status (optional, für Status-Reset)
 */
export async function updateIdea(
  id: string,
  data: EditIdeaInput,
  currentStatus?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Daten validieren mit Zod
    const validationResult = editIdeaSchema.safeParse(data);

    if (!validationResult.success) {
      const errors = validationResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errors };
    }

    // In Dataverse aktualisieren (mit Status-Reset bei "in Überarbeitung")
    await updateIdeaDescription(
      id, 
      validationResult.data.description,
      currentStatus
    );

    return { success: true };
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Idee:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unbekannter Fehler";

    return {
      success: false,
      error: `Fehler beim Speichern: ${errorMessage}`,
    };
  }
}
