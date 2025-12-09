/**
 * validators.ts
 * 
 * Zod-Schemas für die Validierung von Daten in der App.
 * Diese Schemas werden sowohl clientseitig (Formulare) als auch
 * serverseitig (API-Calls) verwendet, um konsistente Validierung zu gewährleisten.
 */

import { z } from "zod";

// ============================================
// IDEE (Digitalisierungsvorhaben)
// ============================================

/**
 * Schema für das Erstellen einer neuen Idee.
 * Nur die Felder, die der User selbst ausfüllt.
 */
export const createIdeaSchema = z.object({
  // Titel der Idee - Pflichtfeld, min. 5 Zeichen
  title: z
    .string()
    .min(5, "Der Titel muss mindestens 5 Zeichen lang sein.")
    .max(200, "Der Titel darf maximal 200 Zeichen lang sein."),

  // Beschreibung der Idee - Pflichtfeld, min. 20 Zeichen
  description: z
    .string()
    .min(20, "Die Beschreibung muss mindestens 20 Zeichen lang sein.")
    .max(4000, "Die Beschreibung darf maximal 4000 Zeichen lang sein."),
});

/**
 * Schema für das Bearbeiten einer bestehenden Idee.
 * Gemäss PRD darf nur die Beschreibung bearbeitet werden.
 */
export const editIdeaSchema = z.object({
  description: z
    .string()
    .min(20, "Die Beschreibung muss mindestens 20 Zeichen lang sein.")
    .max(4000, "Die Beschreibung darf maximal 4000 Zeichen lang sein."),
});

/**
 * Mögliche Status-Werte für eine Idee.
 * Diese entsprechen dem Lifecycle-Status in Dataverse (cr6df_lifecyclestatus).
 */
export const ideaStatusValues = [
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
] as const;

export const ideaStatusSchema = z.enum(ideaStatusValues);

/**
 * Vollständiges Schema einer Idee, wie sie aus Dataverse kommt.
 * Enthält alle Felder inkl. system-generierter.
 */
export const ideaSchema = z.object({
  // Dataverse-ID (GUID)
  id: z.string().uuid(),

  // User-Eingaben
  title: z.string(),
  description: z.string(),

  // System-generierte Felder
  submittedBy: z.string(), // Name des Einreichers (aus MS Account)
  submittedById: z.string().optional(), // Azure AD Object ID des Einreichers (für Besitzer-Prüfung)
  submittedByEmail: z.string().email().optional(), // E-Mail für Vergleiche
  type: z.string().optional(), // Typ (vom System gesetzt)
  status: ideaStatusSchema, // Aktueller Lifecycle-Status
  bpfStatus: z.string().optional(), // Business Process Flow Status
  responsiblePerson: z.string().optional(), // Verantwortliche Person
  subscriber: z.string().optional(), // Abonnent (Name) - Single-Select Lookup
  subscriberId: z.string().optional(), // Abonnent GUID (für PATCH)
  createdOn: z.string().datetime(), // Erstellungsdatum (ISO-String)
  modifiedOn: z.string().datetime().optional(), // Letztes Änderungsdatum

  // Initialprüfung (ab Status "initialgeprüft")
  initialReviewReason: z.string().optional(), // Begründung der Initialbewertung
  complexity: z.string().optional(), // Komplexität
  criticality: z.string().optional(), // Kritikalität
  initialReviewDate: z.string().optional(), // Datum der Initialprüfung (wenn vorhanden)
  
  // Detailanalyse (ab Status "in Detailanalyse")
  detailAnalysisResult: z.string().optional(), // Ergebnis der Detailanalyse
  detailAnalysisBenefit: z.string().optional(), // Nutzen der Detailanalyse
  detailAnalysisEffort: z.number().optional(), // Aufwandschätzung in Personentagen
  priority: z.string().optional(), // Priorität
  
  // ITOT-Board (ab Status "ITOT-Board vorgestellt")
  itotBoardReason: z.string().optional(), // ITOT-Board Begründung
  itotBoardMeeting: z.string().optional(), // ITOT-Board Sitzung (Lookup-Name)
  itotBoardMeetingId: z.string().optional(), // ITOT-Board Sitzung (Lookup-GUID)
  
  // Planung (ab Status "in Planung")
  plannedStart: z.string().optional(), // Geplanter Start
  plannedEnd: z.string().optional(), // Geplantes Ende
  
  // Abschluss-Datum
  completedOn: z.string().optional(), // Abgeschlossen am
  rejectedOn: z.string().optional(), // Abgelehnt am
});

// ============================================
// TypeScript-Typen aus den Schemas ableiten
// ============================================

/** Typ für das Formular zum Erstellen einer Idee */
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;

/** Typ für das Formular zum Bearbeiten einer Idee */
export type EditIdeaInput = z.infer<typeof editIdeaSchema>;

/** Typ für eine vollständige Idee aus der Datenbank */
export type Idea = z.infer<typeof ideaSchema>;

/** Typ für die möglichen Status-Werte */
export type IdeaStatus = z.infer<typeof ideaStatusSchema>;
