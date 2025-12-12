/**
 * subscribeActions.ts
 * 
 * Server Actions für das Abonnieren/Deabonnieren von Ideen.
 * Verwendet die E-Mail-basierte Mitarbeitersuche (wie bei Ideengeber).
 */

"use server";

import { revalidatePath } from "next/cache";
import { findEmployeeByEmail } from "@/lib/dataverse";
import { getCurrentUserAsync } from "@/lib/auth";

const DATAVERSE_URL = process.env.DATAVERSE_URL || "";
const TABLE_NAME = "cr6df_sgsw_digitalisierungsvorhabens";

/**
 * Holt den Access Token (aus Cookie oder ENV)
 */
async function getAccessToken(): Promise<string | null> {
  try {
    // Direkt aus ENV lesen - stabiler für Server Actions
    if (process.env.DATAVERSE_ACCESS_TOKEN) {
      return process.env.DATAVERSE_ACCESS_TOKEN;
    }
    
    // Fallback: Cookie probieren (funktioniert nicht immer in Server Actions)
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get("dataverse_token")?.value;
    return tokenFromCookie || null;
  } catch (error) {
    console.error("[TOKEN] Fehler beim Token-Zugriff:", error);
    return process.env.DATAVERSE_ACCESS_TOKEN || null;
  }
}

/**
 * Setzt den Abonnenten einer Idee (Single-Select Lookup).
 * 
 * @param ideaId - Die GUID der Idee
 * @param userId - GUID des systemusers (Abonnent) oder null zum Entfernen
 * @returns Erfolgsmeldung oder Fehler
 */
export async function setSubscriber(
  ideaId: string,
  userId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Kein Access Token verfügbar" };
    }

    // PATCH-Request an Dataverse
    const url = `${DATAVERSE_URL}/api/data/v9.2/${TABLE_NAME}(${ideaId})`;
    
    // Body: Lookup setzen oder entfernen
    // WICHTIG: EntitySet Name ist PLURAL: cr6df_sgsw_mitarbeitendes (mit "s")
    const body = userId
      ? { "cr6df_abonnenten@odata.bind": `/cr6df_sgsw_mitarbeitendes(${userId})` }
      : { "cr6df_abonnenten@odata.bind": null };
    
    console.log("[SUBSCRIBE] PATCH URL:", url);
    console.log("[SUBSCRIBE] Body:", body);
    
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SUBSCRIBE] Fehler ${response.status}:`, errorText);
      
      // Parse JSON Error falls vorhanden
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`[SUBSCRIBE] Error Details:`, JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Kein JSON
      }
      
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
    console.error("Fehler beim Updaten des Abonnenten:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unbekannter Fehler" 
    };
  }
}

/**
 * Abonniert den aktuellen User zu einer Idee.
 * Verwendet E-Mail-basierte Mitarbeitersuche (wie bei Ideengeber).
 * 
 * @param ideaId - Die GUID der Idee
 * @param ideengeberId - Die GUID des Ideengebers (optional, für Prüfung)
 */
export async function subscribeToIdea(
  ideaId: string,
  ideengeberId?: string
): Promise<{ success: boolean; error?: string; isIdeengeber?: boolean }> {
  // Aktuellen User holen (aus Token oder ENV)
  const currentUser = await getCurrentUserAsync();
  console.log(`[Subscribe] User: ${currentUser.email} (Source: ${currentUser.source})`);
  
  // Mitarbeiter anhand E-Mail suchen
  const mitarbeiterId = await findEmployeeByEmail(currentUser.email);
  
  if (!mitarbeiterId) {
    return { 
      success: false, 
      error: `Kein Mitarbeiter gefunden für E-Mail: ${currentUser.email}. Bitte kontaktiere einen Administrator.` 
    };
  }
  
  // Prüfen ob User der Ideengeber ist
  if (ideengeberId && mitarbeiterId === ideengeberId) {
    console.log(`[Subscribe] User ist Ideengeber - Abonnieren nicht notwendig`);
    return {
      success: false,
      error: "Abonnieren nicht notwendig. Als Ideengeber bist du automatisch für Updates abonniert.",
      isIdeengeber: true,
    };
  }
  
  console.log(`[Subscribe] Setze Abonnent: ${mitarbeiterId}`);
  return setSubscriber(ideaId, mitarbeiterId);
}

/**
 * Entfernt das Abonnement des Users von einer Idee.
 * 
 * @param ideaId - Die GUID der Idee
 */
export async function unsubscribeFromIdea(
  ideaId: string
): Promise<{ success: boolean; error?: string }> {
  return setSubscriber(ideaId, null);
}
