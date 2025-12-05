/**
 * subscribeActions.ts
 * 
 * Server Actions für das Abonnieren/Deabonnieren von Ideen.
 */

"use server";

import { revalidatePath } from "next/cache";

const DATAVERSE_URL = process.env.DATAVERSE_URL || "";
const TABLE_NAME = "cr6df_sgsw_digitalisierungsvorhabens";

/**
 * Holt den Access Token (aus Cookie oder ENV)
 */
async function getAccessToken(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get("dataverse_token")?.value;
  return tokenFromCookie || process.env.DATAVERSE_ACCESS_TOKEN || null;
}

/**
 * Aktualisiert die Abonnenten-Liste einer Idee in Dataverse.
 * 
 * @param ideaId - Die GUID der Idee
 * @param subscribers - Array der Abonnenten-Namen
 * @returns Erfolgsmeldung oder Fehler
 */
export async function updateSubscribers(
  ideaId: string,
  subscribers: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Kein Access Token verfügbar" };
    }

    // Abonnenten als Semikolon-separierter String
    const subscribersString = subscribers.join(";");

    // PATCH-Request an Dataverse
    const url = `${DATAVERSE_URL}/api/data/v9.2/${TABLE_NAME}(${ideaId})`;
    
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "Accept": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        cr6df_abonnenten: subscribersString,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Fehler beim Updaten der Abonnenten: ${response.status}`, errorText);
      return { 
        success: false, 
        error: `Fehler beim Speichern: ${response.status} ${response.statusText}` 
      };
    }

    // Cache invalidieren, damit die Änderung sofort sichtbar ist
    revalidatePath(`/ideas/${ideaId}`);
    revalidatePath("/ideas");

    return { success: true };
  } catch (error) {
    console.error("Fehler beim Updaten der Abonnenten:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unbekannter Fehler" 
    };
  }
}

/**
 * Fügt einen Abonnenten zu einer Idee hinzu.
 * 
 * @param ideaId - Die GUID der Idee
 * @param currentSubscribers - Aktuelle Liste der Abonnenten
 * @param userName - Name des Users der sich abonniert
 */
export async function subscribeToIdea(
  ideaId: string,
  currentSubscribers: string[],
  userName: string
): Promise<{ success: boolean; error?: string }> {
  // Nicht doppelt abonnieren
  if (currentSubscribers.includes(userName)) {
    return { success: true };
  }

  const newSubscribers = [...currentSubscribers, userName];
  return updateSubscribers(ideaId, newSubscribers);
}

/**
 * Entfernt einen Abonnenten von einer Idee.
 * 
 * @param ideaId - Die GUID der Idee
 * @param currentSubscribers - Aktuelle Liste der Abonnenten
 * @param userName - Name des Users der sich deabonniert
 */
export async function unsubscribeFromIdea(
  ideaId: string,
  currentSubscribers: string[],
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const newSubscribers = currentSubscribers.filter(s => s !== userName);
  return updateSubscribers(ideaId, newSubscribers);
}
