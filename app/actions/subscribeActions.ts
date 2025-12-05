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
 * Findet die SystemUser GUID anhand der Azure AD Object ID.
 * 
 * @param azureAdObjectId - Die Azure AD Object ID aus dem Auth Token
 * @returns SystemUser GUID oder null wenn nicht gefunden
 */
async function getSystemUserIdFromAzureId(
  azureAdObjectId: string
): Promise<string | null> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.error("[SYSTEMUSER] Kein Access Token verfügbar");
      return null;
    }

    const url = `${DATAVERSE_URL}/api/data/v9.2/systemusers?` +
      `$select=systemuserid` +
      `&$filter=azureactivedirectoryobjectid eq '${azureAdObjectId}'`;

    console.log("[SYSTEMUSER] Lookup URL:", url);

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SYSTEMUSER] Fehler ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    
    if (!data.value || data.value.length === 0) {
      console.warn(`[SYSTEMUSER] Kein SystemUser für Azure AD ID ${azureAdObjectId} gefunden`);
      return null;
    }

    const systemUserId = data.value[0].systemuserid;
    console.log(`[SYSTEMUSER] Gefunden: Azure AD ${azureAdObjectId} -> SystemUser ${systemUserId}`);
    
    return systemUserId;
  } catch (error) {
    console.error("[SYSTEMUSER] Fehler beim Lookup:", error);
    return null;
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
    const body = userId
      ? { "cr6df_abonnenten@odata.bind": `/systemusers(${userId})` }
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
  // Azure AD ID -> SystemUser GUID mappen
  const systemUserId = await getSystemUserIdFromAzureId(azureAdObjectId);
  
  if (!systemUserId) {
    return { 
      success: false, 
      error: "SystemUser konnte nicht gefunden werden. Bist du in Dataverse als Benutzer angelegt?" 
    };
  }
  
  return setSubscriber(ideaId, systemUserId);
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
