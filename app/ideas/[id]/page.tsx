/**
 * app/ideas/[id]/page.tsx
 * 
 * Detailansicht einer einzelnen Idee. Zeigt alle Felder read-only an.
 * Enthält eine Timeline zur Visualisierung des Prozessfortschritts.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchIdeaById } from "@/lib/dataverse";
import { IdeaStatus } from "@/lib/validators";
import EditButton from "@/components/EditButton";
import { 
  ArrowLeft, 
  Calendar, 
  Check,
  Clock, 
  Lightbulb, 
  Tag, 
  User,
  XCircle
} from "lucide-react";

// Hilfsfunktion: Datum formatieren
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Der "Happy Path" - normale Prozess-Reihenfolge
const PROCESS_STEPS: { status: IdeaStatus; label: string }[] = [
  { status: "eingereicht", label: "Eingereicht" },
  { status: "initialgeprüft", label: "Initialprüfung" },
  { status: "zur Genehmigung", label: "Zur Genehmigung" },
  { status: "genehmigt", label: "Genehmigt" },
  { status: "in Planung", label: "In Planung" },
  { status: "in Umsetzung", label: "In Umsetzung" },
  { status: "umgesetzt", label: "Umgesetzt" },
];

// Status die nicht im Happy Path sind (werden separat behandelt)
const SPECIAL_STATUS: Record<IdeaStatus, string> = {
  "in Überarbeitung": "Überarbeitung erforderlich",
  "in Detailanalyse": "Detailanalyse läuft",
  "abgelehnt": "Abgelehnt",
} as Record<IdeaStatus, string>;

// Hilfsfunktion: Status-Badge mit passender Farbe
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    "eingereicht": "badge-info",
    "initialgeprüft": "badge-info",
    "in Überarbeitung": "badge-warning",
    "in Detailanalyse": "badge-warning",
    "zur Genehmigung": "badge-warning",
    "genehmigt": "badge-success",
    "in Planung": "badge-primary",
    "in Umsetzung": "badge-primary",
    "umgesetzt": "badge-neutral",
    "abgelehnt": "badge-error",
  };
  const colorClass = colorMap[status] || "badge-ghost";
  return <span className={`badge badge-lg ${colorClass}`}>{status}</span>;
}

// Timeline-Komponente
function ProcessTimeline({ currentStatus }: { currentStatus: IdeaStatus }) {
  // Finde Position im Happy Path
  const currentIndex = PROCESS_STEPS.findIndex(s => s.status === currentStatus);
  const isRejected = currentStatus === "abgelehnt";
  const isSpecialStatus = currentStatus in SPECIAL_STATUS;

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-4">
        Prozess-Fortschritt
      </h2>

      {/* Abgelehnt-Hinweis */}
      {isRejected && (
        <div className="alert alert-error mb-4">
          <XCircle className="h-5 w-5" />
          <span>Diese Idee wurde abgelehnt.</span>
        </div>
      )}

      {/* Sonderstatus-Hinweis */}
      {isSpecialStatus && !isRejected && (
        <div className="alert alert-warning mb-4">
          <Clock className="h-5 w-5" />
          <span>Status: {SPECIAL_STATUS[currentStatus]}</span>
        </div>
      )}

      {/* Timeline */}
      <ul className="steps steps-vertical lg:steps-horizontal w-full">
        {PROCESS_STEPS.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = step.status === currentStatus;
          
          let stepClass = "";
          if (isCompleted) stepClass = "step-success";
          else if (isCurrent) stepClass = "step-primary";
          
          return (
            <li 
              key={step.status} 
              className={`step ${stepClass}`}
              data-content={isCompleted ? "✓" : (index + 1).toString()}
            >
              <span className={`text-xs ${isCurrent ? "font-bold" : ""}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Nächster Schritt (wenn nicht abgelehnt/umgesetzt) */}
      {currentIndex >= 0 && currentIndex < PROCESS_STEPS.length - 1 && !isRejected && (
        <div className="mt-4 text-sm text-base-content/60 flex items-center gap-2">
          <Check className="h-4 w-4" />
          Nächster Schritt: <span className="font-medium">{PROCESS_STEPS[currentIndex + 1].label}</span>
        </div>
      )}

      {currentStatus === "umgesetzt" && (
        <div className="mt-4 text-sm text-success flex items-center gap-2">
          <Check className="h-4 w-4" />
          Erfolgreich umgesetzt!
        </div>
      )}
    </div>
  );
}

// Props für die Seite (Next.js App Router)
type PageProps = {
  params: Promise<{ id: string }>;
};

// Hauptkomponente
export default async function IdeaDetailPage({ params }: PageProps) {
  // ID aus URL-Parametern holen
  const { id } = await params;

  // Idee aus Dataverse laden
  const idea = await fetchIdeaById(id);

  // 404 wenn Idee nicht gefunden
  if (!idea) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Zurück-Link */}
      <Link 
        href="/ideas" 
        className="btn btn-ghost btn-sm gap-2 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Ideen-Pool
      </Link>

      {/* Haupt-Card */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          {/* Header: Titel und Status */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <h1 className="text-2xl font-bold">{idea.title}</h1>
            </div>
            <StatusBadge status={idea.status} />
          </div>

          {/* Beschreibung */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-2">
              Beschreibung
            </h2>
            <p className="text-base-content whitespace-pre-wrap">
              {idea.description}
            </p>
          </div>

          {/* Timeline */}
          <ProcessTimeline currentStatus={idea.status} />

          {/* Divider */}
          <div className="divider"></div>

          {/* Meta-Informationen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Eingereicht von */}
            <div className="flex items-center gap-3">
              <div className="bg-base-200 p-2 rounded-lg">
                <User className="h-5 w-5 text-base-content/60" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Eingereicht von</p>
                <p className="font-medium">{idea.submittedBy}</p>
              </div>
            </div>

            {/* Eingereicht am */}
            <div className="flex items-center gap-3">
              <div className="bg-base-200 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-base-content/60" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Eingereicht am</p>
                <p className="font-medium">{formatDate(idea.createdOn)}</p>
              </div>
            </div>

            {/* Typ (falls vorhanden) */}
            {idea.type && (
              <div className="flex items-center gap-3">
                <div className="bg-base-200 p-2 rounded-lg">
                  <Tag className="h-5 w-5 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Typ</p>
                  <p className="font-medium">{idea.type}</p>
                </div>
              </div>
            )}

            {/* Zuletzt bearbeitet (falls vorhanden) */}
            {idea.modifiedOn && (
              <div className="flex items-center gap-3">
                <div className="bg-base-200 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-base-content/60" />
                </div>
                <div>
                  <p className="text-xs text-base-content/60">Zuletzt bearbeitet</p>
                  <p className="font-medium">{formatDate(idea.modifiedOn)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Aktionen */}
          <div className="divider"></div>
          <div className="flex justify-end">
            <EditButton ideaId={id} createdByGuid={idea.submittedById} />
          </div>
        </div>
      </div>
    </div>
  );
}
