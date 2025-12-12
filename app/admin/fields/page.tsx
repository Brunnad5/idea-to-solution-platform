/**
 * Admin-Bereich: Feld-Konfiguration
 * 
 * Zeigt an, welche Felder bei welchem Lifecycle-Status sichtbar/bearbeitbar sind.
 * Read-only Übersicht für Admins zur Dokumentation.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  Eye, 
  Info, 
  Pencil, 
  Settings2, 
  X 
} from "lucide-react";
import { ideaStatusValues, IdeaStatus } from "@/lib/validators";
import { 
  FIELD_CONFIG, 
  FIELD_DEFINITIONS, 
  SECTION_ORDER, 
  getFieldsBySection,
  FieldSection,
  FieldDefinition
} from "@/lib/fieldConfig";

// Status-Labels für die Anzeige
const STATUS_LABELS: Record<IdeaStatus, string> = {
  "eingereicht": "Eingereicht",
  "in Qualitätsprüfung": "In Qualitätsprüfung",
  "in Überarbeitung": "Zur Überarbeitung",
  "in Detailanalyse": "In Detailanalyse",
  "ITOT-Board vorgestellt": "ITOT-Board",
  "Projektportfolio aufgenommen": "Projektportfolio",
  "Quartalsplanung aufgenommen": "Quartalsplanung",
  "Wochenplanung aufgenommen": "Wochenplanung",
  "in Umsetzung": "In Umsetzung",
  "abgeschlossen": "Abgeschlossen",
  "abgelehnt": "Abgelehnt",
};

// Abschnitt-Icons
const SECTION_ICONS: Record<FieldSection, React.ReactNode> = {
  "Grunddaten": "📋",
  "Initialprüfung": "✅",
  "Detailanalyse": "🔍",
  "ITOT-Board": "👥",
  "Planung": "📅",
  "Abschluss": "🏁",
  "System": "⚙️",
};

// Einzelne Feld-Zeile
function FieldRow({ 
  field, 
  isVisible, 
  isEditable 
}: { 
  field: FieldDefinition; 
  isVisible: boolean; 
  isEditable: boolean;
}) {
  return (
    <tr className={!isVisible ? "opacity-40" : ""}>
      <td className="py-2 px-3">
        <div>
          <span className="font-medium">{field.label}</span>
          <span className="text-xs text-base-content/50 ml-2 hidden sm:inline">
            ({field.name})
          </span>
        </div>
      </td>
      <td className="py-2 px-3 text-center">
        {isVisible ? (
          <span className="badge badge-success badge-sm gap-1">
            <Eye className="h-3 w-3" />
            <span className="hidden sm:inline">Ja</span>
          </span>
        ) : (
          <span className="badge badge-ghost badge-sm gap-1">
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">Nein</span>
          </span>
        )}
      </td>
      <td className="py-2 px-3 text-center">
        {isEditable ? (
          <span className="badge badge-primary badge-sm gap-1">
            <Pencil className="h-3 w-3" />
            <span className="hidden sm:inline">Ja</span>
          </span>
        ) : (
          <span className="badge badge-ghost badge-sm gap-1">
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">Nein</span>
          </span>
        )}
      </td>
      <td className="py-2 px-3 text-xs text-base-content/50 hidden lg:table-cell font-mono">
        {field.dataverseField}
      </td>
    </tr>
  );
}

// Abschnitt-Gruppe
function SectionGroup({ 
  section, 
  fields, 
  config 
}: { 
  section: FieldSection; 
  fields: FieldDefinition[];
  config: { visible: string[]; editable: string[] };
}) {
  const visibleCount = fields.filter((f) => config.visible.includes(f.name)).length;
  const editableCount = fields.filter((f) => config.editable.includes(f.name)).length;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2 px-3">
        <span>{SECTION_ICONS[section]}</span>
        <h3 className="font-semibold">{section}</h3>
        <span className="text-xs text-base-content/50">
          ({visibleCount}/{fields.length} sichtbar, {editableCount} bearbeitbar)
        </span>
      </div>
      <table className="table table-sm w-full">
        <thead>
          <tr className="text-xs">
            <th className="py-1 px-3">Feld</th>
            <th className="py-1 px-3 text-center w-24">Sichtbar</th>
            <th className="py-1 px-3 text-center w-24">Bearbeitbar</th>
            <th className="py-1 px-3 hidden lg:table-cell">Dataverse-Feld</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <FieldRow
              key={field.name}
              field={field}
              isVisible={config.visible.includes(field.name)}
              isEditable={config.editable.includes(field.name)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Statistik-Box
function StatBox({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`stat bg-${color}/10 rounded-lg`}>
      <div className={`stat-figure text-${color}`}>
        {icon}
      </div>
      <div className="stat-title text-xs">{label}</div>
      <div className={`stat-value text-2xl text-${color}`}>{value}</div>
    </div>
  );
}

export default function AdminFieldsPage() {
  const [selectedStatus, setSelectedStatus] = useState<IdeaStatus>("eingereicht");
  
  const fieldsBySection = getFieldsBySection();
  const config = FIELD_CONFIG[selectedStatus];
  
  // Statistiken berechnen
  const totalFields = FIELD_DEFINITIONS.length;
  const visibleFields = config.visible.length;
  const editableFields = config.editable.length;

  return (
    <main className="min-h-screen bg-base-200 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/ideas" className="btn btn-ghost btn-sm gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Ideen-Pool
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-3 rounded-lg">
              <Settings2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Feld-Konfiguration</h1>
              <p className="text-base-content/60 mt-1">
                Übersicht welche Felder bei welchem Lifecycle-Status sichtbar/bearbeitbar sind
              </p>
            </div>
          </div>
        </div>

        {/* Info-Banner */}
        <div className="alert alert-info mb-6">
          <Info className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Read-Only Übersicht</h3>
            <p className="text-sm">
              Diese Ansicht zeigt die aktuelle Konfiguration. Änderungen müssen direkt in Dataverse vorgenommen werden.
            </p>
          </div>
        </div>

        {/* Status-Auswahl */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body p-4">
            <h2 className="font-semibold mb-3">Lifecycle-Status auswählen</h2>
            
            {/* Desktop: Tabs */}
            <div className="hidden lg:flex flex-wrap gap-2">
              {ideaStatusValues.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`btn btn-sm ${
                    selectedStatus === status 
                      ? "btn-primary" 
                      : "btn-ghost"
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            
            {/* Mobile: Dropdown */}
            <div className="lg:hidden">
              <div className="dropdown w-full">
                <div tabIndex={0} role="button" className="btn btn-outline w-full justify-between">
                  {STATUS_LABELS[selectedStatus]}
                  <ChevronDown className="h-4 w-4" />
                </div>
                <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-full p-2 shadow-lg mt-1">
                  {ideaStatusValues.map((status) => (
                    <li key={status}>
                      <button
                        onClick={() => setSelectedStatus(status)}
                        className={selectedStatus === status ? "active" : ""}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiken */}
        <div className="stats stats-vertical sm:stats-horizontal shadow mb-6 w-full">
          <div className="stat">
            <div className="stat-figure text-base-content/30">
              <Check className="h-8 w-8" />
            </div>
            <div className="stat-title">Gesamt</div>
            <div className="stat-value">{totalFields}</div>
            <div className="stat-desc">Felder definiert</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-success">
              <Eye className="h-8 w-8" />
            </div>
            <div className="stat-title">Sichtbar</div>
            <div className="stat-value text-success">{visibleFields}</div>
            <div className="stat-desc">{Math.round((visibleFields / totalFields) * 100)}% aller Felder</div>
          </div>
          <div className="stat">
            <div className="stat-figure text-primary">
              <Pencil className="h-8 w-8" />
            </div>
            <div className="stat-title">Bearbeitbar</div>
            <div className="stat-value text-primary">{editableFields}</div>
            <div className="stat-desc">{editableFields > 0 ? `${editableFields} Felder` : "Keine Bearbeitung"}</div>
          </div>
        </div>

        {/* Feld-Tabelle nach Abschnitten */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4 sm:p-6">
            <h2 className="card-title mb-4">
              Felder für Status: <span className="text-primary">{STATUS_LABELS[selectedStatus]}</span>
            </h2>
            
            {SECTION_ORDER.map((section) => {
              const fields = fieldsBySection[section];
              if (fields.length === 0) return null;
              
              return (
                <SectionGroup
                  key={section}
                  section={section}
                  fields={fields}
                  config={config}
                />
              );
            })}
          </div>
        </div>

        {/* Legende */}
        <div className="card bg-base-100 shadow-md mt-6">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-2">Legende</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="badge badge-success badge-sm gap-1">
                  <Eye className="h-3 w-3" /> Ja
                </span>
                <span>= Feld ist sichtbar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-primary badge-sm gap-1">
                  <Pencil className="h-3 w-3" /> Ja
                </span>
                <span>= Feld ist bearbeitbar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-ghost badge-sm gap-1">
                  <X className="h-3 w-3" /> Nein
                </span>
                <span>= Feld nicht verfügbar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
