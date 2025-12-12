/**
 * subscribeActions.ts
 * 
 * Server Actions für das Abonnieren/Deabonnieren von Ideen.
 * Verwendet die E-Mail-basierte Mitarbeitersuche (wie bei Ideengeber).
 */

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserAsync } from "@/lib/auth";

const DATAVERSE_URL = process.env.DATAVERSE_URL || "";
const TABLE_NAME = "cr6df_sgsw_digitalisierungsvorhabens";
const EMPLOYEE_TABLE_NAME = "cr6df_sgsw_mitarbeitendes";

/**
 * Holt den Access Token (aus Cookie oder ENV)
 * Priorisiert ENV für Server Actions (stabiler)
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
 * Sucht einen Mitarbeiter anhand der E-Mail-Adresse.
 * Lokale Version für Server Actions mit eigenem Token-Handling.
 * 
 * @param email - Die E-Mail-Adresse des Mitarbeiters
 * @param token - Der Access Token für Dataverse
 * @returns Die GUID des Mitarbeiters oder null
 */
async function findEmployeeByEmailLocal(email: string, token: string): Promise<string | null> {
  console.log(`[Subscribe] Suche Mitarbeiter für E-Mail: ${email}`);

  try {
    // OData-Filter für E-Mail-Suche
    // ACHTUNG: In Dataverse ist die Spalte vertauscht!
    // cr6df_vorname enthält die E-Mail (DisplayName: "email")
    const filter = `$filter=cr6df_vorname eq '${email}'`;
    const select = "$select=cr6df_sgsw_mitarbeitendeid,cr6df_vorname,cr6df_nachname";
    const url = `${DATAVERSE_URL}/api/data/v9.2/${EMPLOYEE_TABLE_NAME}?${filter}&${select}`;

    console.log(`[Subscribe] Mitarbeiter-API-URL: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Subscribe] Mitarbeitersuche fehlgeschlagen: ${response.status}`, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`[Subscribe] Mitarbeiter-Antwort:`, JSON.stringify(data, null, 2));
    
    if (data.value && data.value.length > 0) {
      const employeeId = data.value[0].cr6df_sgsw_mitarbeitendeid;
      const employeeName = data.value[0].cr6df_nachname;
      console.log(`[Subscribe] Mitarbeiter gefunden: ${employeeName} (${employeeId})`);
      return employeeId;
    }

    console.warn(`[Subscribe] Kein Mitarbeiter gefunden für E-Mail: ${email}`);
    return null;
  } catch (error) {
    console.error("[Subscribe] Fehler bei Mitarbeitersuche:", error);
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
  // Token zuerst holen - wird für alle API-Calls benötigt
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Kein Access Token verfügbar. Bitte verbinde dich mit Dataverse." };
  }
  
  // Aktuellen User holen (aus Token oder ENV)
  const currentUser = await getCurrentUserAsync();
  console.log(`[Subscribe] User: ${currentUser.email} (Source: ${currentUser.source})`);
  
  // Mitarbeiter anhand E-Mail suchen (lokale Funktion mit eigenem Token)
  const mitarbeiterId = await findEmployeeByEmailLocal(currentUser.email, token);
  
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
