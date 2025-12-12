/**
 * fieldConfig.ts
 * 
 * Konfiguration welche Felder bei welchem Lifecycle-Status sichtbar/bearbeitbar sind.
 * Basiert auf den Dataverse-Definitionen (Screenshots vom User).
 */

import { IdeaStatus } from "./validators";

/**
 * Definition eines Feldes mit Metadaten
 */
export interface FieldDefinition {
  name: string;           // Interner Feldname
  label: string;          // Anzeigename
  section: FieldSection;  // Abschnitt/Kategorie
  dataverseField: string; // Dataverse-Feldname
}

/**
 * Abschnitte für die Gruppierung der Felder
 */
export type FieldSection = 
  | "Grunddaten"
  | "Initialprüfung"
  | "Detailanalyse"
  | "ITOT-Board"
  | "Planung"
  | "Abschluss"
  | "System";

/**
 * Alle verfügbaren Felder mit Metadaten
 */
export const FIELD_DEFINITIONS: FieldDefinition[] = [
  // Grunddaten
  { name: "title", label: "Titel", section: "Grunddaten", dataverseField: "cr6df_name" },
  { name: "description", label: "Beschreibung", section: "Grunddaten", dataverseField: "cr6df_beschreibung" },
  { name: "type", label: "Typ", section: "Grunddaten", dataverseField: "cr6df_typ" },
  { name: "status", label: "Lifecycle-Status", section: "Grunddaten", dataverseField: "cr6df_lifecyclestatus" },
  { name: "bpfStatus", label: "Phase (BPF)", section: "Grunddaten", dataverseField: "stageid" },
  { name: "submittedBy", label: "Eingereicht von", section: "Grunddaten", dataverseField: "_cr6df_ideengeber_value" },
  { name: "responsiblePerson", label: "Verantwortliche Person", section: "Grunddaten", dataverseField: "_cr6df_verantwortlicher_value" },
  
  // Initialprüfung
  { name: "initialReviewReason", label: "Initialprüfung Begründung", section: "Initialprüfung", dataverseField: "cr6df_initalbewertung_begruendung" },
  { name: "initialReviewDate", label: "Initialgeprüft am", section: "Initialprüfung", dataverseField: "cr6df_initialgeprueft_am" },
  
  // Detailanalyse
  { name: "complexity", label: "Komplexität", section: "Detailanalyse", dataverseField: "cr6df_komplexitaet" },
  { name: "criticality", label: "Kritikalität", section: "Detailanalyse", dataverseField: "cr6df_kritikalitaet" },
  { name: "priority", label: "Priorität", section: "Detailanalyse", dataverseField: "cr6df_prioritat" },
  { name: "detailAnalysisResult", label: "Detailanalyse Ergebnis", section: "Detailanalyse", dataverseField: "cr6df_detailanalyse_ergebnis" },
  { name: "detailAnalysisBenefit", label: "Detailanalyse Nutzen", section: "Detailanalyse", dataverseField: "cr6df_detailanalyse_nutzen" },
  { name: "detailAnalysisEffort", label: "Aufwandschätzung", section: "Detailanalyse", dataverseField: "cr6df_detailanalyse_personentage" },
  
  // ITOT-Board
  { name: "itotBoardReason", label: "ITOT-Board Begründung", section: "ITOT-Board", dataverseField: "cr6df_itotboard_begruendung" },
  { name: "itotBoardMeeting", label: "ITOT-Board Sitzung", section: "ITOT-Board", dataverseField: "_cr6df_itotboardsitzung_value" },
  
  // Planung
  { name: "plannedStart", label: "Geplanter Start", section: "Planung", dataverseField: "cr6df_planung_geplanterstart" },
  { name: "plannedEnd", label: "Geplantes Ende", section: "Planung", dataverseField: "cr6df_planung_geplantesende" },
  
  // Abschluss
  { name: "completedOn", label: "Abgeschlossen am", section: "Abschluss", dataverseField: "cr6df_abgeschlossen_am" },
  { name: "rejectedOn", label: "Abgelehnt am", section: "Abschluss", dataverseField: "cr6df_abgelehnt_am" },
  
  // System
  { name: "createdOn", label: "Eingereicht am", section: "System", dataverseField: "createdon" },
  { name: "modifiedOn", label: "Zuletzt bearbeitet", section: "System", dataverseField: "modifiedon" },
];

/**
 * Konfiguration pro Lifecycle-Status: welche Felder sichtbar/bearbeitbar sind
 */
export interface StatusFieldConfig {
  visible: string[];    // Sichtbare Feldnamen
  editable: string[];   // Bearbeitbare Feldnamen
}

/**
 * Feld-Konfiguration pro Lifecycle-Status
 * Basiert auf den Screenshots der Dataverse-Konfiguration
 */
export const FIELD_CONFIG: Record<IdeaStatus, StatusFieldConfig> = {
  // 562520000 - Eingereicht
  "eingereicht": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "createdOn", "modifiedOn"],
    editable: ["title", "description"],
  },
  
  // 562520001 - In Qualitätsprüfung
  "in Qualitätsprüfung": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "initialReviewReason", "initialReviewDate", "createdOn", "modifiedOn"],
    editable: [],
  },
  
  // 562520002 - In Überarbeitung
  "in Überarbeitung": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "initialReviewReason", "initialReviewDate", "createdOn", "modifiedOn"],
    editable: ["description"],
  },
  
  // 562520003 - In Detailanalyse
  "in Detailanalyse": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "initialReviewReason", "initialReviewDate", "complexity", "criticality", "priority", "detailAnalysisResult", "detailAnalysisBenefit", "detailAnalysisEffort", "createdOn", "modifiedOn"],
    editable: [],
  },
  
  // 562520005 - ITOT-Board vorgestellt
  "ITOT-Board vorgestellt": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "initialReviewReason", "initialReviewDate", "complexity", "criticality", "priority", "detailAnalysisResult", "detailAnalysisBenefit", "detailAnalysisEffort", "itotBoardReason", "itotBoardMeeting", "createdOn", "modifiedOn"],
    editable: [],
  },
  
  // 562520006 - Projektportfolio aufgenommen
  "Projektportfolio aufgenommen": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "initialReviewReason", "initialReviewDate", "complexity", "criticality", "priority", "detailAnalysisResult", "detailAnalysisBenefit", "detailAnalysisEffort", "itotBoardReason", "itotBoardMeeting", "plannedStart", "plannedEnd", "createdOn", "modifiedOn"],
    editable: [],
  },
  
  // 562520007 - Quartalsplanung aufgenommen
  "Quartalsplanung aufgenommen": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "initialReviewReason", "initialReviewDate", "complexity", "criticality", "priority", "detailAnalysisResult", "detailAnalysisBenefit", "detailAnalysisEffort", "itotBoardReason", "itotBoardMeeting", "plannedStart", "plannedEnd", "createdOn", "modifiedOn"],
    editable: [],
  },
  
  // 562520008 - Wochenplanung aufgenommen
  "Wochenplanung aufgenommen": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "initialReviewReason", "initialReviewDate", "complexity", "criticality", "priority", "detailAnalysisResult", "detailAnalysisBenefit", "detailAnalysisEffort", "itotBoardReason", "itotBoardMeeting", "plannedStart", "plannedEnd", "createdOn", "modifiedOn"],
    editable: [],
  },
  
  // 562520010 - In Umsetzung
  "in Umsetzung": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "initialReviewReason", "initialReviewDate", "complexity", "criticality", "priority", "detailAnalysisResult", "detailAnalysisBenefit", "detailAnalysisEffort", "itotBoardReason", "itotBoardMeeting", "plannedStart", "plannedEnd", "createdOn", "modifiedOn"],
    editable: [],
  },
  
  // 562520011 - Abgeschlossen
  "abgeschlossen": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "initialReviewReason", "initialReviewDate", "complexity", "criticality", "priority", "detailAnalysisResult", "detailAnalysisBenefit", "detailAnalysisEffort", "itotBoardReason", "itotBoardMeeting", "plannedStart", "plannedEnd", "completedOn", "createdOn", "modifiedOn"],
    editable: [],
  },
  
  // 562520004 - Abgelehnt
  "abgelehnt": {
    visible: ["title", "description", "type", "status", "bpfStatus", "submittedBy", "responsiblePerson", "initialReviewReason", "initialReviewDate", "complexity", "criticality", "priority", "detailAnalysisResult", "detailAnalysisBenefit", "detailAnalysisEffort", "itotBoardReason", "itotBoardMeeting", "plannedStart", "plannedEnd", "rejectedOn", "createdOn", "modifiedOn"],
    editable: [],
  },
};

/**
 * Hilfsfunktion: Gibt die Feld-Definition für einen Feldnamen zurück
 */
export function getFieldDefinition(fieldName: string): FieldDefinition | undefined {
  return FIELD_DEFINITIONS.find((f) => f.name === fieldName);
}

/**
 * Hilfsfunktion: Gruppiert Felder nach Abschnitt
 */
export function getFieldsBySection(): Record<FieldSection, FieldDefinition[]> {
  const result: Record<FieldSection, FieldDefinition[]> = {
    "Grunddaten": [],
    "Initialprüfung": [],
    "Detailanalyse": [],
    "ITOT-Board": [],
    "Planung": [],
    "Abschluss": [],
    "System": [],
  };
  
  for (const field of FIELD_DEFINITIONS) {
    result[field.section].push(field);
  }
  
  return result;
}

/**
 * Alle Abschnitte in der gewünschten Reihenfolge
 */
export const SECTION_ORDER: FieldSection[] = [
  "Grunddaten",
  "Initialprüfung",
  "Detailanalyse",
  "ITOT-Board",
  "Planung",
  "Abschluss",
  "System",
];
