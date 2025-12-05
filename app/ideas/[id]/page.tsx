/**
 * app/ideas/[id]/page.tsx
 * 
 * Detailansicht einer einzelnen Idee. Zeigt alle Felder read-only an.
 * Enthält eine Timeline zur Visualisierung des Prozessfortschritts.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchIdeaById, fetchBpfStatus, BpfStatus } from "@/lib/dataverse";
import { IdeaStatus } from "@/lib/validators";
import EditButton from "@/components/EditButton";
import SubscribeButton from "@/components/SubscribeButton";
import { 
  ArrowLeft, 
  Calendar, 
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock, 
  Gauge,
  Lightbulb, 
  MessageSquare,
  Shield,
  Tag, 
  User
} from "lucide-react";
import { Idea } from "@/lib/validators";

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

// BPF Stages (Phasen)
// Dataverse gibt stagecategory=-1 zurück, daher verwenden wir stagename für Zuordnung
const BPF_STAGES = [
  { name: "Initialisierung", order: 0 },
  { name: "Analyse & Bewertung", order: 1 },
  { name: "Planung", order: 2 },
  { name: "Umsetzung", order: 3 },
];

// Lifecycle-Status Mapping (für Detail-Anzeige)
const LIFECYCLE_STATUS_MAP: Record<string, { label: string; editable: boolean }> = {
  "eingereicht": { label: "Eingereicht", editable: true },
  "initialgeprüft": { label: "Idee in Qualitätsprüfung", editable: false },
  "in Überarbeitung": { label: "Idee zur Überarbeitung an Ideengebenden", editable: true },
  "in Detailanalyse": { label: "Idee in Detailanalyse", editable: false },
  "zur Genehmigung": { label: "Genehmigt", editable: false },
  "genehmigt": { label: "Genehmigt", editable: false },
  "abgelehnt": { label: "Abgelehnt", editable: false },
  "in Planung": { label: "Idee wird ITOT-Board vorgestellt", editable: false },
  "in Umsetzung": { label: "In Umsetzung", editable: false },
  "umgesetzt": { label: "Abgeschlossen", editable: false },
};

// Timeline-Komponente mit BPF-Daten
function ProcessTimeline({ bpfStatus, lifecycleStatus }: { bpfStatus: BpfStatus | null; lifecycleStatus: string }) {
  // Wenn keine BPF-Daten, zeige Hinweis
  if (!bpfStatus) {
    return (
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-4">
          Prozess-Fortschritt
        </h2>
        <div className="alert alert-info">
          <Clock className="h-5 w-5" />
          <span>Prozess-Informationen werden geladen...</span>
        </div>
      </div>
    );
  }

  // Aktuelle Stage anhand des Namens finden
  const currentStageIndex = BPF_STAGES.findIndex(s => s.name === bpfStatus.activeStage.stageName);
  const isCompleted = bpfStatus.stateCode === 1;

  // Datum formatieren
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-CH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-wide mb-4">
        Prozess-Fortschritt
      </h2>

      {/* Abgeschlossen-Hinweis */}
      {isCompleted && bpfStatus.completedOn && (
        <div className="alert alert-success mb-4">
          <Check className="h-5 w-5" />
          <span>Prozess abgeschlossen am {formatDate(bpfStatus.completedOn)}</span>
        </div>
      )}

      {/* Aktuelle Phase */}
      {!isCompleted && (
        <div className="alert alert-info mb-4">
          <Clock className="h-5 w-5" />
          <div>
            <p className="font-medium">Aktuelle Phase: {bpfStatus.activeStage.stageName}</p>
            <p className="text-xs opacity-80">Seit {formatDate(bpfStatus.activeStageStartedOn)}</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <ul className="steps steps-vertical lg:steps-horizontal w-full">
        {BPF_STAGES.map((stage, index) => {
          const isStageCompleted = currentStageIndex > index || isCompleted;
          const isCurrent = currentStageIndex === index && !isCompleted;
          
          let stepClass = "";
          if (isStageCompleted) stepClass = "step-success";
          else if (isCurrent) stepClass = "step-primary";
          
          return (
            <li 
              key={stage.order} 
              className={`step ${stepClass}`}
              data-content={isStageCompleted ? "✓" : (stage.order + 1).toString()}
            >
              <span className={`text-xs ${isCurrent ? "font-bold" : ""}`}>
                {stage.name}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Nächste Phase */}
      {!isCompleted && currentStageIndex >= 0 && currentStageIndex < BPF_STAGES.length - 1 && (
        <div className="mt-4 text-sm text-base-content/60 flex items-center gap-2">
          <Check className="h-4 w-4" />
          Nächste Phase: <span className="font-medium">{BPF_STAGES[currentStageIndex + 1].name}</span>
        </div>
      )}

      {/* Lifecycle-Status */}
      <div className="mt-4 pt-4 border-t border-base-300">
        <div className="text-sm">
          <span className="text-base-content/60">Detailstatus: </span>
          <span className="font-medium">
            {LIFECYCLE_STATUS_MAP[lifecycleStatus]?.label || lifecycleStatus}
          </span>
          {LIFECYCLE_STATUS_MAP[lifecycleStatus]?.editable && (
            <span className="ml-2 text-xs badge badge-success badge-sm">Bearbeitbar</span>
          )}
          {LIFECYCLE_STATUS_MAP[lifecycleStatus] && !LIFECYCLE_STATUS_MAP[lifecycleStatus].editable && (
            <span className="ml-2 text-xs badge badge-ghost badge-sm">Nicht bearbeitbar</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Status-Werte, die anzeigen, dass die Initialprüfung abgeschlossen ist
const INITIAL_REVIEW_COMPLETED_STATUSES: IdeaStatus[] = [
  "initialgeprüft",
  "in Überarbeitung",
  "in Detailanalyse",
  "zur Genehmigung",
  "genehmigt",
  "in Planung",
  "in Umsetzung",
  "umgesetzt",
  "abgelehnt",
];

// Einklappbarer Abschnitt - Client Component nicht nötig, da wir details/summary verwenden
function CollapsibleSection({ 
  title, 
  icon, 
  children,
  defaultOpen = false 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="collapse collapse-arrow bg-base-200 rounded-lg" open={defaultOpen}>
      <summary className="collapse-title font-medium flex items-center gap-2 cursor-pointer">
        {icon}
        {title}
      </summary>
      <div className="collapse-content">
        {children}
      </div>
    </details>
  );
}

// Initialprüfungs-Abschnitt
function InitialReviewSection({ idea }: { idea: Idea }) {
  // Prüfen ob Initialprüfung abgeschlossen
  const hasInitialReview = INITIAL_REVIEW_COMPLETED_STATUSES.includes(idea.status);
  
  if (!hasInitialReview) {
    return null;
  }

  // Datum formatieren (nur Datum, keine Zeit)
  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-CH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <CollapsibleSection 
      title="Initialprüfung" 
      icon={<ClipboardCheck className="h-5 w-5 text-info" />}
      defaultOpen={true}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Komplexität */}
        {idea.complexity && (
          <div className="flex items-center gap-3">
            <div className="bg-base-100 p-2 rounded-lg">
              <Gauge className="h-5 w-5 text-base-content/60" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Komplexität</p>
              <p className="font-medium">{idea.complexity}</p>
            </div>
          </div>
        )}

        {/* Kritikalität */}
        {idea.criticality && (
          <div className="flex items-center gap-3">
            <div className="bg-base-100 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-base-content/60" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Kritikalität</p>
              <p className="font-medium">{idea.criticality}</p>
            </div>
          </div>
        )}

        {/* Geprüft am */}
        {idea.initialReviewDate && (
          <div className="flex items-center gap-3">
            <div className="bg-base-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-base-content/60" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">Geprüft am</p>
              <p className="font-medium">{formatReviewDate(idea.initialReviewDate)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Begründung (volle Breite) */}
      {idea.initialReviewReason && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-base-content/60" />
            <p className="text-xs text-base-content/60">Begründung</p>
          </div>
          <p className="text-sm bg-base-100 p-3 rounded-lg whitespace-pre-wrap">
            {idea.initialReviewReason}
          </p>
        </div>
      )}

      {/* Fallback wenn keine Daten */}
      {!idea.complexity && !idea.criticality && !idea.initialReviewDate && !idea.initialReviewReason && (
        <p className="text-sm text-base-content/50 italic pt-2">
          Keine Details zur Initialprüfung verfügbar.
        </p>
      )}
    </CollapsibleSection>
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

  // Idee und BPF-Status parallel laden
  const [idea, bpfStatus] = await Promise.all([
    fetchIdeaById(id),
    fetchBpfStatus(id),
  ]);

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
          {/* Header: Titel */}
          <div className="flex items-start gap-3">
            <Lightbulb className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <h1 className="text-2xl font-bold">{idea.title}</h1>
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
          <ProcessTimeline bpfStatus={bpfStatus} lifecycleStatus={idea.status} />

          {/* Zusätzliche Abschnitte (einklappbar) */}
          <div className="mt-6 space-y-4">
            {/* Initialprüfung */}
            <InitialReviewSection idea={idea} />
          </div>

          {/* Divider */}
          <div className="divider"></div>

          {/* Meta-Informationen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Verantwortliche Person */}
            <div className="flex items-center gap-3">
              <div className="bg-base-200 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-base-content/60" />
              </div>
              <div>
                <p className="text-xs text-base-content/60">Verantwortliche/r</p>
                <p className="font-medium">
                  {idea.responsiblePerson || "Keine verantwortliche Person definiert"}
                </p>
              </div>
            </div>

            {/* Abonnenten */}
            <div className="sm:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-base-200 p-2 rounded-lg">
                    <User className="h-5 w-5 text-base-content/60" />
                  </div>
                  <div>
                    <p className="text-xs text-base-content/60">Abonnenten</p>
                    <p className="font-medium">
                      {idea.subscribers && idea.subscribers.length > 0
                        ? idea.subscribers.join(", ")
                        : "Keine Abonnenten"}
                    </p>
                  </div>
                </div>
                <SubscribeButton 
                  ideaId={id}
                  subscribers={idea.subscribers || []}
                  submittedBy={idea.submittedBy}
                />
              </div>
            </div>

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
            <EditButton 
              ideaId={id} 
              createdByGuid={idea.submittedById}
              isEditable={LIFECYCLE_STATUS_MAP[idea.status]?.editable ?? false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
