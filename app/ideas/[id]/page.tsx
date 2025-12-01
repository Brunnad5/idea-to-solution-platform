/**
 * app/ideas/[id]/page.tsx
 * 
 * Detailansicht einer einzelnen Idee. Zeigt alle Felder read-only an.
 * Die ID wird aus der URL gelesen (dynamische Route).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchIdeaById } from "@/lib/dataverse";
import { getCurrentUser, isIdeaOwner } from "@/lib/auth";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit, 
  Lightbulb, 
  Tag, 
  User 
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

// Hilfsfunktion: Status-Badge mit passender Farbe
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Eingereicht: "badge-info",
    "In Prüfung": "badge-warning",
    Genehmigt: "badge-success",
    "In Umsetzung": "badge-primary",
    Abgeschlossen: "badge-neutral",
    Abgelehnt: "badge-error",
  };
  const colorClass = colorMap[status] || "badge-ghost";
  return <span className={`badge badge-lg ${colorClass}`}>{status}</span>;
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

  // Prüfen ob aktueller User der Besitzer ist (für Edit-Button)
  const currentUser = getCurrentUser();
  const canEdit = isIdeaOwner(idea.submittedBy);

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

          {/* Aktionen (nur für Besitzer) */}
          {canEdit && (
            <>
              <div className="divider"></div>
              <div className="flex justify-end">
                <Link 
                  href={`/ideas/${id}/edit`}
                  className="btn btn-primary gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Beschreibung bearbeiten
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Debug-Info für Entwicklung (nur wenn User nicht Besitzer ist) */}
      {!canEdit && (
        <div className="mt-4 text-sm text-base-content/50 text-center">
          Eingeloggt als: {currentUser.name} · 
          Nur der Einreicher kann diese Idee bearbeiten.
        </div>
      )}
    </div>
  );
}
