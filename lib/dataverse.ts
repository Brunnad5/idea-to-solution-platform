/**
 * dataverse.ts
 * 
 * Hilfsfunktionen für die Kommunikation mit Microsoft Dataverse.
 * Dataverse ist die Datenbank hinter Power Apps, in der die Ideen gespeichert werden.
 * 
 * Die Tabelle heisst: sgsw_digitalisierungsvorhabens
 * 
 * TOKEN-ANSATZ:
 * Der Access Token wird vom User im Browser eingegeben und als Cookie gespeichert.
 * Server-seitig lesen wir den Token aus dem Cookie.
 * Fallback: Umgebungsvariable DATAVERSE_ACCESS_TOKEN für lokale Entwicklung.
 */

import { cookies } from "next/headers";
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
 * Fallback Access Token aus Umgebungsvariable (für lokale Entwicklung).
 */
const FALLBACK_TOKEN = process.env.DATAVERSE_ACCESS_TOKEN || "";

/**
 * Cookie-Name für den Token (muss mit AuthProvider übereinstimmen)
 */
const TOKEN_COOKIE_NAME = "dataverse_token";

/**
 * EntitySetName der Tabelle in Dataverse.
 * Gefunden über Power Apps: cr6df_sgsw_digitalisierungsvorhaben
 */
const TABLE_NAME = "cr6df_sgsw_digitalisierungsvorhabens";

/**
 * EntitySetName der Business Process Flow Tabelle.
 * Wird für die Prozess-Visualisierung verwendet.
 */
const BPF_TABLE_NAME = "cr6df_ideatosolutions";

/**
 * Mapping zwischen unseren Feldnamen und den Dataverse-Feldnamen.
 * Dataverse verwendet Präfixe wie "cr6df_" für benutzerdefinierte Felder.
 */
/**
 * EntitySetName der Mitarbeiter-Tabelle.
 * Wird für die Zuordnung des Ideengebers verwendet.
 */
const EMPLOYEE_TABLE_NAME = "cr6df_sgsw_mitarbeitendes";

const FIELD_MAP = {
  // Unsere Namen -> Dataverse Namen
  id: "cr6df_sgsw_digitalisierungsvorhabenid", // Primary Key (GUID)
  title: "cr6df_name",
  description: "cr6df_beschreibung",
  submittedBy: "_createdby_value", // Lookup-Feld, gibt GUID zurück
  submittedByName: "_createdby_value@OData.Community.Display.V1.FormattedValue", // Anzeigename
  ideengeberId: "_cr6df_ideengeber_value", // Lookup zu Mitarbeiter
  ideengeberName: "_cr6df_ideengeber_value@OData.Community.Display.V1.FormattedValue",
  type: "cr6df_typ", // OptionSet (Choice) mit numerischen Werten
  status: "cr6df_lifecyclestatus",
  responsiblePerson: "_cr6df_verantwortlicher_value", // Lookup-Feld
  responsiblePersonName: "_cr6df_verantwortlicher_value@OData.Community.Display.V1.FormattedValue",
  subscriber: "_cr6df_abonnenten_value", // Lookup-Feld (Single-Select)
  subscriberName: "_cr6df_abonnenten_value@OData.Community.Display.V1.FormattedValue",
  createdOn: "createdon",
  modifiedOn: "modifiedon",
  // Initialprüfung
  initialReviewReason: "cr6df_initalbewertung_begruendung",
  complexity: "cr6df_komplexitaet",
  criticality: "cr6df_kritikalitaet",
  initialReviewDate: "cr6df_initialgeprueft_am",
  // Detailanalyse
  detailAnalysisResult: "cr6df_detailanalyse_ergebnis",
  detailAnalysisBenefit: "cr6df_detailanalyse_nutzen",
  detailAnalysisEffort: "cr6df_detailanalyse_personentage",
  priority: "cr6df_prioritat",
  // ITOT-Board
  itotBoardReason: "cr6df_itotboard_begruendung",
  itotBoardMeeting: "_cr6df_itotboardsitzung_value",
  itotBoardMeetingName: "_cr6df_itotboardsitzung_value@OData.Community.Display.V1.FormattedValue",
  // Planung
  plannedStart: "cr6df_planung_geplanterstart",
  plannedEnd: "cr6df_planung_geplantesende",
  // Abschluss
  completedOn: "cr6df_abgeschlossen_am",
  rejectedOn: "cr6df_abgelehnt_am",
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
 * Holt den Access Token aus dem Cookie oder der Umgebungsvariable.
 * 
 * Reihenfolge:
 * 1. Cookie (vom User im Browser gesetzt)
 * 2. Umgebungsvariable (Fallback für Entwicklung)
 */
async function getAccessToken(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
    if (tokenCookie?.value) {
      return tokenCookie.value;
    }
  } catch {
    // cookies() kann in bestimmten Kontexten fehlschlagen
    // (z.B. in Static Generation), dann Fallback verwenden
  }
  return FALLBACK_TOKEN;
}

/**
 * Erstellt die Standard-Header für Dataverse API-Calls.
 * Verwendet den Token aus Cookie oder Umgebungsvariable.
 */
async function createHeaders(): Promise<HeadersInit> {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
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
  // Status aus Dataverse holen (numerisch oder string)
  const status = mapStatusValue(record[FIELD_MAP.status]);

  // submittedBy: Zuerst formatierten Namen probieren, dann GUID, dann Fallback
  const submittedBy = 
    (record[FIELD_MAP.submittedByName] as string) || 
    (record[FIELD_MAP.submittedBy] as string) || 
    "Unbekannt";

  // submittedById: Die Azure AD Object ID des Erstellers (GUID)
  // Wird für die Besitzer-Prüfung verwendet
  const submittedById = record[FIELD_MAP.submittedBy] as string | undefined;

  // Typ: Numerischen Wert in lesbaren String umwandeln
  const type = mapTypeValue(record[FIELD_MAP.type]);

  // Verantwortliche Person: Formatierter Name oder undefined
  const responsiblePerson = record[FIELD_MAP.responsiblePersonName] as string | undefined;

  // Abonnent: Single-Select Lookup
  const subscriber = record[FIELD_MAP.subscriberName] as string | undefined;
  const subscriberId = record[FIELD_MAP.subscriber] as string | undefined;

  // Initialprüfungs-Felder (können OptionSets sein, daher FormattedValue verwenden)
  const initialReviewReason = record[FIELD_MAP.initialReviewReason] as string | undefined;
  const complexity = record[`${FIELD_MAP.complexity}@OData.Community.Display.V1.FormattedValue`] as string | undefined
    || record[FIELD_MAP.complexity] as string | undefined;
  const criticality = record[`${FIELD_MAP.criticality}@OData.Community.Display.V1.FormattedValue`] as string | undefined
    || record[FIELD_MAP.criticality] as string | undefined;
  const initialReviewDate = record[FIELD_MAP.initialReviewDate] as string | undefined;
  
  // Detailanalyse-Felder
  const detailAnalysisResult = record[FIELD_MAP.detailAnalysisResult] as string | undefined;
  const detailAnalysisBenefit = record[FIELD_MAP.detailAnalysisBenefit] as string | undefined;
  const detailAnalysisEffortRaw = record[FIELD_MAP.detailAnalysisEffort];
  const detailAnalysisEffort = typeof detailAnalysisEffortRaw === 'number' ? detailAnalysisEffortRaw : undefined;
  const priority = record[`${FIELD_MAP.priority}@OData.Community.Display.V1.FormattedValue`] as string | undefined
    || record[FIELD_MAP.priority] as string | undefined;
  
  // ITOT-Board-Felder
  const itotBoardReason = record[FIELD_MAP.itotBoardReason] as string | undefined;
  const itotBoardMeeting = record[FIELD_MAP.itotBoardMeetingName] as string | undefined;
  const itotBoardMeetingId = record[FIELD_MAP.itotBoardMeeting] as string | undefined;
  
  // Planungs-Felder
  const plannedStart = record[FIELD_MAP.plannedStart] as string | undefined;
  const plannedEnd = record[FIELD_MAP.plannedEnd] as string | undefined;
  
  // Abschluss-Felder
  const completedOn = record[FIELD_MAP.completedOn] as string | undefined;
  const rejectedOn = record[FIELD_MAP.rejectedOn] as string | undefined;

  return {
    id: record[FIELD_MAP.id] as string,
    title: record[FIELD_MAP.title] as string,
    description: record[FIELD_MAP.description] as string,
    submittedBy,
    submittedById,
    type,
    status,
    responsiblePerson,
    subscriber,
    subscriberId,
    createdOn: record[FIELD_MAP.createdOn] as string,
    modifiedOn: record[FIELD_MAP.modifiedOn] as string | undefined,
    // Initialprüfung
    initialReviewReason,
    complexity,
    criticality,
    initialReviewDate,
    // Detailanalyse
    detailAnalysisResult,
    detailAnalysisBenefit,
    detailAnalysisEffort,
    priority,
    // ITOT-Board
    itotBoardReason,
    itotBoardMeeting,
    itotBoardMeetingId,
    // Planung
    plannedStart,
    plannedEnd,
    // Abschluss
    completedOn,
    rejectedOn,
  };
}

/**
 * Mapping für das Status-Feld (OptionSet/Choice in Dataverse).
 * Die Werte sind numerisch in Dataverse gespeichert.
 */
const STATUS_MAP: Record<number, IdeaStatus> = {
  562520000: "eingereicht",
  562520001: "in Qualitätsprüfung",
  562520002: "in Überarbeitung",
  562520003: "in Detailanalyse",
  562520005: "ITOT-Board vorgestellt",
  562520006: "Projektportfolio aufgenommen",
  562520007: "Quartalsplanung aufgenommen",
  562520008: "Wochenplanung aufgenommen",
  562520010: "in Umsetzung",
  562520011: "abgeschlossen",
  562520004: "abgelehnt",
};

/** Wandelt den numerischen Status-Wert in einen lesbaren String um */
function mapStatusValue(value: unknown): IdeaStatus {
  if (typeof value === "number" && value in STATUS_MAP) {
    return STATUS_MAP[value];
  }
  if (typeof value === "string" && isValidStatus(value)) {
    return value;
  }
  return "eingereicht"; // Default
}

/** Prüft, ob ein String ein gültiger IdeaStatus ist */
function isValidStatus(value: unknown): value is IdeaStatus {
  const validStatuses: IdeaStatus[] = [
    "eingereicht",
    "in Qualitätsprüfung",
    "in Überarbeitung",
    "in Detailanalyse",
    "ITOT-Board vorgestellt",
    "Projektportfolio aufgenommen",
    "Quartalsplanung aufgenommen",
    "Wochenplanung aufgenommen",
    "in Umsetzung",
    "abgeschlossen",
    "abgelehnt",
  ];
  return typeof value === "string" && validStatuses.includes(value as IdeaStatus);
}

/**
 * Prüft, ob die Dataverse-URL konfiguriert ist.
 * Der Token wird separat via Cookie oder env geprüft.
 */
export function isDataverseUrlConfigured(): boolean {
  return Boolean(DATAVERSE_URL);
}

/**
 * Prüft async, ob die Dataverse-Konfiguration vollständig ist (URL + Token).
 */
export async function isDataverseConfigured(): Promise<boolean> {
  if (!DATAVERSE_URL) return false;
  const token = await getAccessToken();
  return Boolean(token);
}

/**
 * Debug-Info für Dataverse-Konfiguration.
 * Zeigt an, welche Umgebungsvariablen gesetzt sind und warum die Verbindung fehlschlägt.
 */
export async function getDataverseDebugInfo(): Promise<{
  isConfigured: boolean;
  hasUrl: boolean;
  hasToken: boolean;
  urlPreview: string;
  tokenPreview: string;
  errorDetails?: string;
}> {
  const hasUrl = Boolean(DATAVERSE_URL);
  const token = await getAccessToken();
  const hasToken = Boolean(token);
  
  // URL-Preview (nur Domain zeigen)
  let urlPreview = "nicht gesetzt";
  if (DATAVERSE_URL) {
    try {
      const url = new URL(DATAVERSE_URL);
      urlPreview = url.hostname;
    } catch {
      urlPreview = "ungültiges Format";
    }
  }
  
  // Token-Preview (nur erste/letzte Zeichen)
  let tokenPreview = "nicht gesetzt";
  if (token) {
    if (token.length > 20) {
      tokenPreview = `${token.substring(0, 8)}...${token.substring(token.length - 8)} (${token.length} Zeichen)`;
    } else {
      tokenPreview = `${token.length} Zeichen (zu kurz?)`;
    }
  }
  
  // Fehlerdetails ermitteln
  let errorDetails: string | undefined;
  if (!hasUrl) {
    errorDetails = "DATAVERSE_URL fehlt in Umgebungsvariablen";
  } else if (!hasToken) {
    errorDetails = "DATAVERSE_ACCESS_TOKEN fehlt in Umgebungsvariablen";
  }
  
  return {
    isConfigured: hasUrl && hasToken,
    hasUrl,
    hasToken,
    urlPreview,
    tokenPreview,
    errorDetails,
  };
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
  if (!(await isDataverseConfigured())) {
    console.warn("Dataverse nicht konfiguriert - verwende Mock-Daten");
    return getMockIdeas();
  }

  const url = `${DATAVERSE_URL}/api/data/v9.2/${TABLE_NAME}?$orderby=createdon desc`;

  try {
    // Parallel: Ideen und BPF-Status laden
    const [ideasResponse, bpfResponse] = await Promise.all([
      fetch(url, {
        headers: await createHeaders(),
        cache: "no-store",
      }),
      fetch(
        `${DATAVERSE_URL}/api/data/v9.2/${BPF_TABLE_NAME}?` +
        `$select=_bpf_cr6df_sgsw_digitalisierungsvorhabenid_value,activestageid` +
        `&$expand=activestageid($select=stagename)`,
        {
          headers: await createHeaders(),
          cache: "no-store",
        }
      ),
    ]);

    if (!ideasResponse.ok) {
      // Bei Fehlern: Log und Fallback auf Mock-Daten
      console.error(`Dataverse Fehler: ${ideasResponse.status} ${ideasResponse.statusText}`);
      console.error(`URL: ${url}`);
      
      if (ideasResponse.status === 404) {
        console.error(`Tabelle "${TABLE_NAME}" nicht gefunden. Prüfe den EntitySetName in Dataverse.`);
      } else if (ideasResponse.status === 401) {
        console.error("Token abgelaufen oder ungültig. Bitte neuen Token holen.");
      }
      
      return getMockIdeas();
    }

    const ideasData = await ideasResponse.json();
    
    // BPF-Status in Map speichern (ideaId -> stageName)
    const bpfMap = new Map<string, string>();
    if (bpfResponse.ok) {
      const bpfData = await bpfResponse.json();
      (bpfData.value || []).forEach((bpf: any) => {
        const ideaId = bpf._bpf_cr6df_sgsw_digitalisierungsvorhabenid_value;
        const stageName = bpf.activestageid?.stagename;
        if (ideaId && stageName) {
          bpfMap.set(ideaId, stageName);
        }
      });
    } else {
      console.warn("BPF-Status konnten nicht geladen werden.");
    }

    // Ideen mappen und BPF-Status hinzufügen
    return (ideasData.value || []).map((record: any) => {
      const idea = mapDataverseToIdea(record);
      const bpfStatus = bpfMap.get(idea.id);
      return { ...idea, bpfStatus };
    });
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
  if (!(await isDataverseConfigured())) {
    console.warn("Dataverse nicht konfiguriert - verwende Mock-Daten");
    const mockIdeas = getMockIdeas();
    return mockIdeas.find((idea) => idea.id === id) || null;
  }

  const url = `${DATAVERSE_URL}/api/data/v9.2/${TABLE_NAME}(${id})`;

  try {
    const response = await fetch(url, {
      headers: await createHeaders(),
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
 * Sucht einen Mitarbeiter anhand der E-Mail-Adresse.
 * Wird verwendet, um den Ideengeber automatisch zu setzen.
 * 
 * @param email - Die E-Mail-Adresse des Mitarbeiters
 * @returns Die GUID des Mitarbeiters oder null
 */
export async function findEmployeeByEmail(email: string): Promise<string | null> {
  if (!(await isDataverseConfigured())) {
    console.warn("Dataverse nicht konfiguriert - kann Mitarbeiter nicht suchen");
    return null;
  }

  try {
    // OData-Filter für E-Mail-Suche (case-insensitive)
    const filter = `$filter=cr6df_email eq '${email}'`;
    const select = "$select=cr6df_sgsw_mitarbeitendeid,cr6df_name,cr6df_email";
    const url = `${DATAVERSE_URL}/api/data/v9.2/${EMPLOYEE_TABLE_NAME}?${filter}&${select}`;

    const response = await fetch(url, {
      method: "GET",
      headers: await createHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Mitarbeitersuche fehlgeschlagen: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.value && data.value.length > 0) {
      // Ersten passenden Mitarbeiter zurückgeben
      return data.value[0].cr6df_sgsw_mitarbeitendeid;
    }

    console.warn(`Kein Mitarbeiter gefunden für E-Mail: ${email}`);
    return null;
  } catch (error) {
    console.error("Fehler bei Mitarbeitersuche:", error);
    return null;
  }
}

/**
 * Erstellt eine neue Idee in Dataverse.
 * 
 * @param input - Titel und Beschreibung der neuen Idee
 * @param submittedBy - Name des einreichenden Users
 * @param userEmail - E-Mail des einreichenden Users (für Ideengeber-Zuordnung)
 */
export async function createIdea(
  input: CreateIdeaInput,
  submittedBy: string,
  userEmail?: string
): Promise<Idea> {
  // Fallback: Mock-Erstellung, wenn nicht konfiguriert
  if (!(await isDataverseConfigured())) {
    console.warn("Dataverse nicht konfiguriert - simuliere Erstellung");
    return {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      submittedBy,
      type: "Idee", // Default-Typ
      status: "eingereicht",
      createdOn: new Date().toISOString(),
    };
  }

  const url = `${DATAVERSE_URL}/api/data/v9.2/${TABLE_NAME}`;

  // Ideengeber anhand E-Mail suchen (falls vorhanden)
  let ideengeberId: string | null = null;
  if (userEmail) {
    ideengeberId = await findEmployeeByEmail(userEmail);
    if (ideengeberId) {
      console.log(`Ideengeber gefunden: ${ideengeberId} für ${userEmail}`);
    }
  }

  // Body für Dataverse erstellen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    [FIELD_MAP.title]: input.title,
    [FIELD_MAP.description]: input.description,
    [FIELD_MAP.type]: 562520000, // Default-Typ: "Idee" (numerischer Wert für Dataverse OptionSet)
  };
  
  // Ideengeber als Lookup setzen (falls gefunden)
  // Dataverse Lookup-Syntax: "feldname@odata.bind": "/entitysetname(guid)"
  if (ideengeberId) {
    body["cr6df_ideengeber@odata.bind"] = `/${EMPLOYEE_TABLE_NAME}(${ideengeberId})`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: await createHeaders(),
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
    type: "Idee", // Default-Typ
    status: "eingereicht",
    createdOn: new Date().toISOString(),
  };
}

/**
 * Aktualisiert die Beschreibung einer bestehenden Idee.
 * Bei Status "in Überarbeitung" wird automatisch auf "eingereicht" zurückgesetzt.
 * 
 * @param id - Die GUID der Idee
 * @param description - Die neue Beschreibung
 * @param currentStatus - Der aktuelle Lifecycle-Status (optional)
 */
export async function updateIdeaDescription(
  id: string,
  description: string,
  currentStatus?: string
): Promise<void> {
  // Mock-Update, wenn nicht konfiguriert
  if (!(await isDataverseConfigured())) {
    console.warn("Dataverse nicht konfiguriert - simuliere Update");
    return;
  }

  const url = `${DATAVERSE_URL}/api/data/v9.2/${TABLE_NAME}(${id})`;

  // Body mit Beschreibung
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    [FIELD_MAP.description]: description,
  };
  
  // Bei Status "in Überarbeitung" automatisch auf "eingereicht" zurücksetzen
  if (currentStatus === "in Überarbeitung") {
    body[FIELD_MAP.status] = 562520000; // "eingereicht"
    console.log("Status wird von 'in Überarbeitung' auf 'eingereicht' zurückgesetzt");
  }

  const response = await fetch(url, {
    method: "PATCH",
    headers: await createHeaders(),
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
      submittedById: "11111111-1111-1111-1111-111111111111", // Mock GUID
      type: "Idee",
      status: "in Qualitätsprüfung",
      createdOn: "2024-11-15T09:30:00Z",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      title: "Automatisierte Rechnungsverarbeitung",
      description:
        "Eingehende Rechnungen werden manuell in unser System eingegeben. Mit OCR und KI könnten wir diesen Prozess automatisieren. Das spart Zeit und reduziert Eingabefehler erheblich.",
      submittedBy: "Anna Beispiel",
      submittedById: "22222222-2222-2222-2222-222222222222", // Mock GUID
      type: "Vorhaben",
      status: "Projektportfolio aufgenommen",
      createdOn: "2024-11-10T14:15:00Z",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      title: "Self-Service Portal für Mitarbeitende",
      description:
        "Viele HR-Anfragen (Feriensaldo, Lohnabrechnung, Adressänderung) könnten über ein Portal selbst erledigt werden. Das entlastet die HR-Abteilung und gibt Mitarbeitenden mehr Autonomie.",
      submittedBy: "Peter Müller",
      submittedById: "33333333-3333-3333-3333-333333333333", // Mock GUID
      type: "Projekt",
      status: "in Umsetzung",
      createdOn: "2024-11-20T11:00:00Z",
    },
  ];
}

// ============================================
// BUSINESS PROCESS FLOW (BPF)
// ============================================

/**
 * Stage im Business Process Flow.
 */
export interface BpfStage {
  stageName: string;
  stageCategory: number; // 0 = Initialisierung, 1 = Analyse & Bewertung, 2 = Planung, 3 = Umsetzung
  stageId: string;
}

/**
 * Aktueller BPF-Status einer Idee.
 */
export interface BpfStatus {
  activeStage: {
    stageName: string;
    stageCategory: number;
  };
  activeStageStartedOn: string;
  completedOn: string | null;
  stateCode: number; // 0 = Active, 1 = Completed
  statusCode: number;
}

/**
 * Holt den aktuellen BPF-Status einer Idee.
 * 
 * @param ideaId - Die GUID der Idee
 * @returns BpfStatus oder null wenn nicht gefunden
 */
export async function fetchBpfStatus(ideaId: string): Promise<BpfStatus | null> {
  if (!isDataverseConfigured()) {
    console.warn("Dataverse ist nicht konfiguriert. BPF-Status kann nicht geladen werden.");
    return null;
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn("Kein Access Token verfügbar. BPF-Status kann nicht geladen werden.");
      return null;
    }

    const url = `${DATAVERSE_URL}/api/data/v9.2/${BPF_TABLE_NAME}?` +
      `$select=activestageid,activestagestartedon,completedon,statecode,statuscode` +
      `&$filter=_bpf_cr6df_sgsw_digitalisierungsvorhabenid_value eq '${ideaId}'` +
      `&$expand=activestageid($select=stagename,stagecategory)`;

    const response = await fetch(url, {
      headers: await createHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BPF] Fehler beim Laden des BPF-Status: ${response.status} ${response.statusText}`);
      console.error(`[BPF] Error Response:`, errorText);
      return null;
    }

    const data = await response.json();
    
    // Erstes Ergebnis nehmen (sollte nur eines geben)
    if (!data.value || data.value.length === 0) {
      console.warn(`[BPF] Kein BPF-Eintrag für Idee ${ideaId} gefunden.`);
      return null;
    }

    const record = data.value[0];
    
    return {
      activeStage: {
        stageName: record.activestageid?.stagename || "Unbekannt",
        stageCategory: record.activestageid?.stagecategory ?? 0,
      },
      activeStageStartedOn: record.activestagestartedon,
      completedOn: record.completedon,
      stateCode: record.statecode,
      statusCode: record.statuscode,
    };
  } catch (error) {
    console.error("Fehler beim Laden des BPF-Status:", error);
    return null;
  }
}

/**
 * Holt alle Stages des BPF (für die Timeline-Visualisierung).
 * 
 * @param processId - Die GUID der BPF-Definition (optional, kann aus ENV kommen)
 * @returns Array von BpfStage oder leeres Array
 */
export async function fetchBpfStages(processId?: string): Promise<BpfStage[]> {
  // Fallback: Standard-Stages wenn API nicht erreichbar
  const defaultStages: BpfStage[] = [
    { stageName: "Initialisierung", stageCategory: 0, stageId: "stage-0" },
    { stageName: "Analyse & Bewertung", stageCategory: 1, stageId: "stage-1" },
    { stageName: "Planung", stageCategory: 2, stageId: "stage-2" },
    { stageName: "Umsetzung", stageCategory: 3, stageId: "stage-3" },
  ];

  if (!isDataverseConfigured()) {
    console.warn("Dataverse ist nicht konfiguriert. Verwende Standard-Stages.");
    return defaultStages;
  }

  // Wenn keine processId angegeben, verwende Fallback
  if (!processId) {
    console.warn("Keine BPF Process-ID konfiguriert. Verwende Standard-Stages.");
    return defaultStages;
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn("Kein Access Token verfügbar. Verwende Standard-Stages.");
      return defaultStages;
    }

    const url = `${DATAVERSE_URL}/api/data/v9.2/processstages?` +
      `$select=stagename,stagecategory,processstageid` +
      `&$filter=processid eq ${processId}` +
      `&$orderby=stagecategory asc`;

    const response = await fetch(url, {
      headers: await createHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Fehler beim Laden der BPF-Stages: ${response.status} ${response.statusText}`);
      return defaultStages;
    }

    const data = await response.json();
    
    if (!data.value || data.value.length === 0) {
      console.warn("Keine BPF-Stages gefunden. Verwende Standard-Stages.");
      return defaultStages;
    }

    return data.value.map((stage: any) => ({
      stageName: stage.stagename,
      stageCategory: stage.stagecategory,
      stageId: stage.processstageid,
    }));
  } catch (error) {
    console.error("Fehler beim Laden der BPF-Stages:", error);
    return defaultStages;
  }
}
