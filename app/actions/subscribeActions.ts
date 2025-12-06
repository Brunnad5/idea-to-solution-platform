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
 * Findet die Mitarbeiter-ID anhand der Azure AD Object ID.
 * Prüft ob der User sowohl als SystemUser als auch in cr6df_sgsw_mitarbeitendes existiert.
 * 
 * @param azureAdObjectId - Die Azure AD Object ID aus dem Auth Token
 * @returns Mitarbeiter GUID aus cr6df_sgsw_mitarbeitendes oder null
 */
async function getMitarbeiterIdFromAzureId(
  azureAdObjectId: string
): Promise<{ mitarbeiterId: string | null; error?: string }> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.error("[MITARBEITER] Kein Access Token verfügbar");
      return { mitarbeiterId: null, error: "Kein Access Token" };
    }

    // Schritt 1: Azure AD ID -> SystemUser GUID
    const systemUserUrl = `${DATAVERSE_URL}/api/data/v9.2/systemusers?` +
      `$select=systemuserid` +
      `&$filter=azureactivedirectoryobjectid eq '${azureAdObjectId}'`;

    console.log("[MITARBEITER] SystemUser Lookup:", systemUserUrl);

    const systemUserResponse = await fetch(systemUserUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!systemUserResponse.ok) {
      const errorText = await systemUserResponse.text();
      console.error(`[MITARBEITER] SystemUser Fehler ${systemUserResponse.status}:`, errorText);
      return { mitarbeiterId: null, error: "SystemUser nicht gefunden" };
    }

    const systemUserData = await systemUserResponse.json();
    
    if (!systemUserData.value || systemUserData.value.length === 0) {
      console.warn(`[MITARBEITER] Kein SystemUser für Azure AD ID ${azureAdObjectId}`);
      return { mitarbeiterId: null, error: "Du bist nicht in Dataverse authentifiziert" };
    }

    const systemUserId = systemUserData.value[0].systemuserid;
    console.log(`[MITARBEITER] SystemUser gefunden: ${systemUserId}`);

    // Schritt 2: Prüfe ob Mitarbeiter in cr6df_sgsw_mitarbeitendes existiert
    const mitarbeiterUrl = `${DATAVERSE_URL}/api/data/v9.2/cr6df_sgsw_mitarbeitendes(${systemUserId})`;
    
    console.log("[MITARBEITER] Mitarbeiter Lookup:", mitarbeiterUrl);

    const mitarbeiterResponse = await fetch(mitarbeiterUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!mitarbeiterResponse.ok) {
      console.warn(`[MITARBEITER] Nicht in Mitarbeiter-Tabelle: ${mitarbeiterResponse.status}`);
      return { 
        mitarbeiterId: null, 
        error: "Du musst zuerst als Mitarbeiter in Dataverse angelegt werden. Bitte kontaktiere einen Administrator." 
      };
    }

    console.log(`[MITARBEITER] ✅ Mitarbeiter-Eintrag existiert: ${systemUserId}`);
    return { mitarbeiterId: systemUserId };
    
  } catch (error) {
    console.error("[MITARBEITER] Fehler:", error);
    return { mitarbeiterId: null, error: "Technischer Fehler beim Lookup" };
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
 * 
 * @param ideaId - Die GUID der Idee
 * @param azureAdObjectId - Die Azure AD Object ID des Users (aus Auth Token)
 */
export async function subscribeToIdea(
  ideaId: string,
  azureAdObjectId: string
): Promise<{ success: boolean; error?: string }> {
  // Azure AD ID -> Mitarbeiter ID (mit Existenz-Check)
  const result = await getMitarbeiterIdFromAzureId(azureAdObjectId);
  
  if (!result.mitarbeiterId) {
    return { 
      success: false, 
      error: result.error || "Mitarbeiter konnte nicht gefunden werden" 
    };
  }
  
  return setSubscriber(ideaId, result.mitarbeiterId);
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
