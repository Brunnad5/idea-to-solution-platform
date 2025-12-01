/**
 * dataverse.ts
 * 
 * Hilfsfunktionen für die Kommunikation mit Microsoft Dataverse.
 * Dataverse ist die Datenbank hinter Power Apps, in der die Ideen gespeichert werden.
 * 
 * Die Tabelle heisst: sgsw_digitalisierungsvorhabens
 * 
 * MANUELLER TOKEN-ANSATZ:
 * Da keine Azure App Registration verfügbar ist, wird der Access Token
 * manuell geholt und in der Umgebungsvariable DATAVERSE_ACCESS_TOKEN gespeichert.
 * Der Token läuft nach ca. 1 Stunde ab und muss dann erneuert werden.
 */

import { Idea, CreateIdeaInput, IdeaStatus } from "./validators";

// ============================================
// KONFIGURATION
// ============================================

/**
 * Basis-URL der Dataverse-Umgebung.
 * Beispiel: https://scepdevstud6.crm17.dynamics.com
 */
const DATAVERSE_URL = process.env.DATAVERSE_URL || "";

/**
 * Manuell geholter Access Token für Dataverse.
 * Wird aus der Umgebungsvariable gelesen.
 */
const ACCESS_TOKEN = process.env.DATAVERSE_ACCESS_TOKEN || "";

/**
 * EntitySetName der Tabelle in Dataverse.
 * Gefunden über Power Apps: cr6df_sgsw_digitalisierungsvorhaben
 */
const TABLE_NAME = "cr6df_sgsw_digitalisierungsvorhabens";

/**
 * Mapping zwischen unseren Feldnamen und den Dataverse-Feldnamen.
 * Dataverse verwendet Präfixe wie "cr6df_" für benutzerdefinierte Felder.
 */
const FIELD_MAP = {
  // Unsere Namen -> Dataverse Namen
  id: "cr6df_sgsw_digitalisierungsvorhabenid", // Primary Key (GUID)
  title: "cr6df_name",
  description: "cr6df_beschreibung",
  submittedBy: "_createdby_value", // Lookup-Feld, gibt GUID zurück
  submittedByName: "_createdby_value@OData.Community.Display.V1.FormattedValue", // Anzeigename
  type: "cr6df_typ", // OptionSet (Choice) mit numerischen Werten
  status: "cr6df_lifecyclestatus",
  createdOn: "createdon",
  modifiedOn: "modifiedon",
} as const;

/**
 * Mapping für das Typ-Feld (OptionSet/Choice in Dataverse).
 * Die Werte sind numerisch in Dataverse gespeichert.
 */
const TYPE_MAP: Record<number, string> = {
  562520000: "Idee",
  562520001: "Vorhaben",
  562520002: "Projekt",
};

/** Wandelt den numerischen Typ-Wert in einen lesbaren String um */
function mapTypeValue(value: unknown): string | undefined {
  if (typeof value === "number") {
    return TYPE_MAP[value] || undefined;
  }
  if (typeof value === "string") {
    return value; // Falls bereits als String (z.B. FormattedValue)
  }
  return undefined;
}

// ============================================
// HILFSFUNKTIONEN
// ============================================

/**
 * Erstellt die Standard-Header für Dataverse API-Calls.
 * Verwendet den Token aus der Umgebungsvariable.
 */
function createHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
    Accept: "application/json",
    Prefer: 'odata.include-annotations="*"', // Gibt formatierte Werte zurück
  };
}

/**
 * Wandelt einen Dataverse-Datensatz in unser Idea-Format um.
 * 
 * @param record - Rohdaten aus Dataverse
 */
function mapDataverseToIdea(record: Record<string, unknown>): Idea {
  // Status aus Dataverse holen, oder Default "Eingereicht" verwenden
  const rawStatus = record[FIELD_MAP.status] as string | undefined;
  const status: IdeaStatus = isValidStatus(rawStatus) ? rawStatus : "Eingereicht";

  // submittedBy: Zuerst formatierten Namen probieren, dann GUID, dann Fallback
  const submittedBy = 
    (record[FIELD_MAP.submittedByName] as string) || 
    (record[FIELD_MAP.submittedBy] as string) || 
    "Unbekannt";

  // Typ: Numerischen Wert in lesbaren String umwandeln
  const type = mapTypeValue(record[FIELD_MAP.type]);

  return {
    id: record[FIELD_MAP.id] as string,
    title: record[FIELD_MAP.title] as string,
    description: record[FIELD_MAP.description] as string,
    submittedBy,
    type,
    status,
    createdOn: record[FIELD_MAP.createdOn] as string,
    modifiedOn: record[FIELD_MAP.modifiedOn] as string | undefined,
  };
}

/** Prüft, ob ein String ein gültiger IdeaStatus ist */
function isValidStatus(value: unknown): value is IdeaStatus {
  const validStatuses = [
    "Eingereicht",
    "In Prüfung",
    "Genehmigt",
    "In Umsetzung",
    "Abgeschlossen",
    "Abgelehnt",
  ];
  return typeof value === "string" && validStatuses.includes(value);
}

/**
 * Prüft, ob die Dataverse-Konfiguration vollständig ist (URL + Token).
 */
export function isDataverseConfigured(): boolean {
  return Boolean(DATAVERSE_URL) && Boolean(ACCESS_TOKEN);
}

/**
 * Prüft, ob nur die URL konfiguriert ist (aber kein Token).
 * Nützlich für Fehlermeldungen.
 */
export function isTokenMissing(): boolean {
  return Boolean(DATAVERSE_URL) && !ACCESS_TOKEN;
}

// ============================================
// CRUD-OPERATIONEN
// ============================================

/**
 * Lädt alle Ideen aus Dataverse.
 * Verwendet den Token aus der Umgebungsvariable DATAVERSE_ACCESS_TOKEN.
 * 
 * @returns Liste aller Ideen, sortiert nach Erstelldatum (neueste zuerst)
 */
export async function fetchAllIdeas(): Promise<Idea[]> {
  // Fallback auf Mock-Daten, wenn nicht konfiguriert
  if (!isDataverseConfigured()) {
    console.warn("Dataverse nicht konfiguriert - verwende Mock-Daten");
    return getMockIdeas();
  }

  const url = `${DATAVERSE_URL}/api/data/v9.2/${TABLE_NAME}?$orderby=createdon desc`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(),
      cache: "no-store", // Immer frische Daten holen
    });

    if (!response.ok) {
      // Bei Fehlern: Log und Fallback auf Mock-Daten
      console.error(`Dataverse Fehler: ${response.status} ${response.statusText}`);
      console.error(`URL: ${url}`);
      
      if (response.status === 404) {
        console.error(`Tabelle "${TABLE_NAME}" nicht gefunden. Prüfe den EntitySetName in Dataverse.`);
      } else if (response.status === 401) {
        console.error("Token abgelaufen oder ungültig. Bitte neuen Token holen.");
      }
      
      return getMockIdeas();
    }

    const data = await response.json();
    return (data.value || []).map(mapDataverseToIdea);
  } catch (error) {
    // Netzwerkfehler oder andere Probleme
    console.error("Fehler beim Laden der Ideen:", error);
    return getMockIdeas();
  }
}

/**
 * Lädt eine einzelne Idee anhand ihrer ID.
 * 
 * @param id - Die GUID der Idee
 */
export async function fetchIdeaById(id: string): Promise<Idea | null> {
  // Fallback auf Mock-Daten, wenn nicht konfiguriert
  if (!isDataverseConfigured()) {
    console.warn("Dataverse nicht konfiguriert - verwende Mock-Daten");
    const mockIdeas = getMockIdeas();
    return mockIdeas.find((idea) => idea.id === id) || null;
  }

  const url = `${DATAVERSE_URL}/api/data/v9.2/${TABLE_NAME}(${id})`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(),
      cache: "no-store",
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error(`Dataverse Fehler: ${response.status} ${response.statusText}`);
      return null;
    }

    const record = await response.json();
    return mapDataverseToIdea(record);
  } catch (error) {
    console.error("Fehler beim Laden der Idee:", error);
    return null;
  }
}

/**
 * Erstellt eine neue Idee in Dataverse.
 * 
 * @param input - Titel und Beschreibung der neuen Idee
 * @param submittedBy - Name des einreichenden Users
 */
export async function createIdea(
  input: CreateIdeaInput,
  submittedBy: string
): Promise<Idea> {
  // Fallback: Mock-Erstellung, wenn nicht konfiguriert
  if (!isDataverseConfigured()) {
    console.warn("Dataverse nicht konfiguriert - simuliere Erstellung");
    return {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      submittedBy,
      status: "Eingereicht",
      createdOn: new Date().toISOString(),
    };
  }

  const url = `${DATAVERSE_URL}/api/data/v9.2/${TABLE_NAME}`;

  // Nur editierbare Felder senden
  // createdby wird automatisch von Dataverse gesetzt (aktueller User des Tokens)
  const body = {
    [FIELD_MAP.title]: input.title,
    [FIELD_MAP.description]: input.description,
    // submittedBy wird NICHT gesendet - Dataverse setzt createdby automatisch
  };

  const response = await fetch(url, {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Versuche, Details aus dem Response-Body zu lesen
    let errorDetails = "";
    try {
      const errorBody = await response.json();
      errorDetails = errorBody?.error?.message || JSON.stringify(errorBody);
    } catch {
      errorDetails = await response.text().catch(() => "Keine Details verfügbar");
    }
    
    console.error("Dataverse Create Error:", { status: response.status, details: errorDetails });
    throw new Error(`Dataverse ${response.status}: ${errorDetails}`);
  }

  // Dataverse gibt die ID im Header zurück
  const locationHeader = response.headers.get("OData-EntityId");
  const idMatch = locationHeader?.match(/\(([^)]+)\)/);
  const newId = idMatch?.[1] || crypto.randomUUID();

  // submittedBy wird von Dataverse automatisch auf den Token-User gesetzt
  // Wir verwenden den übergebenen Namen nur für die Rückgabe
  return {
    id: newId,
    title: input.title,
    description: input.description,
    submittedBy, // Der Mock-User-Name (in Dataverse steht der Token-User)
    status: "Eingereicht",
    createdOn: new Date().toISOString(),
  };
}

/**
 * Aktualisiert die Beschreibung einer bestehenden Idee.
 * 
 * @param id - Die GUID der Idee
 * @param description - Die neue Beschreibung
 */
export async function updateIdeaDescription(
  id: string,
  description: string
): Promise<void> {
  // Mock-Update, wenn nicht konfiguriert
  if (!isDataverseConfigured()) {
    console.warn("Dataverse nicht konfiguriert - simuliere Update");
    return;
  }

  const url = `${DATAVERSE_URL}/api/data/v9.2/${TABLE_NAME}(${id})`;

  const body = {
    [FIELD_MAP.description]: description,
  };

  const response = await fetch(url, {
    method: "PATCH",
    headers: createHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Detaillierte Fehlerinfos
    let errorDetails = "";
    try {
      const errorBody = await response.json();
      errorDetails = errorBody?.error?.message || JSON.stringify(errorBody);
    } catch {
      errorDetails = await response.text().catch(() => "Keine Details verfügbar");
    }
    
    console.error("Dataverse Update Error:", { status: response.status, details: errorDetails });
    throw new Error(`Dataverse ${response.status}: ${errorDetails}`);
  }
}

// ============================================
// MOCK-DATEN (für Entwicklung ohne Dataverse)
// ============================================

/**
 * Gibt Beispiel-Ideen zurück, wenn keine Dataverse-Verbindung besteht.
 * Nützlich für lokale Entwicklung und Tests.
 */
function getMockIdeas(): Idea[] {
  return [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      title: "Digitale Zeiterfassung per App",
      description:
        "Aktuell erfassen wir Arbeitszeiten noch auf Papier oder in Excel. Eine mobile App würde den Prozess vereinfachen und Fehler reduzieren. Die App sollte offline funktionieren und sich mit unserem HR-System synchronisieren.",
      submittedBy: "Max Muster",
      status: "In Prüfung",
      createdOn: "2024-11-15T09:30:00Z",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      title: "Automatisierte Rechnungsverarbeitung",
      description:
        "Eingehende Rechnungen werden manuell in unser System eingegeben. Mit OCR und KI könnten wir diesen Prozess automatisieren. Das spart Zeit und reduziert Eingabefehler erheblich.",
      submittedBy: "Anna Beispiel",
      status: "Genehmigt",
      createdOn: "2024-11-10T14:15:00Z",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      title: "Self-Service Portal für Mitarbeitende",
      description:
        "Viele HR-Anfragen (Feriensaldo, Lohnabrechnung, Adressänderung) könnten über ein Portal selbst erledigt werden. Das entlastet die HR-Abteilung und gibt Mitarbeitenden mehr Autonomie.",
      submittedBy: "Peter Müller",
      status: "Eingereicht",
      createdOn: "2024-11-20T11:00:00Z",
    },
  ];
}
