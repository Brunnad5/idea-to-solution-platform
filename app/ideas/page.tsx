/**
 * app/ideas/page.tsx
 * 
 * Die Ideen-Pool Seite. Zeigt alle eingereichten Ideen als Karten an.
 * Dies ist eine Server Component – die Daten werden serverseitig geladen.
 */

import Link from "next/link";
import { fetchAllIdeas, isDataverseConfigured, isTokenMissing } from "@/lib/dataverse";
import { Idea } from "@/lib/validators";
import { AlertCircle, Calendar, Lightbulb, User } from "lucide-react";

// Hilfsfunktion: Datum formatieren (z.B. "15. Nov 2024")
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Hilfsfunktion: Status-Badge mit passender Farbe
function StatusBadge({ status }: { status: string }) {
  // Farben je nach Status
  const colorMap: Record<string, string> = {
    Eingereicht: "badge-info",
    "In Prüfung": "badge-warning",
    Genehmigt: "badge-success",
    "In Umsetzung": "badge-primary",
    Abgeschlossen: "badge-neutral",
    Abgelehnt: "badge-error",
  };

  const colorClass = colorMap[status] || "badge-ghost";

  return <span className={`badge ${colorClass}`}>{status}</span>;
}

// Komponente: Eine einzelne Ideen-Karte
function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link href={`/ideas/${idea.id}`} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body">
        {/* Titel und Status */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="card-title text-lg">{idea.title}</h2>
          <StatusBadge status={idea.status} />
        </div>

        {/* Beschreibung (gekürzt) */}
        <p className="text-base-content/70 line-clamp-2">
          {idea.description}
        </p>

        {/* Meta-Infos */}
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-base-content/60">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {idea.submittedBy}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(idea.createdOn)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Komponente: Hinweis wenn Dataverse nicht konfiguriert oder Fehler auftraten
function DataverseHint({ hasError = false }: { hasError?: boolean }) {
  const tokenMissing = isTokenMissing();

  // Unterschiedliche Meldungen je nach Situation
  let title = "Demo-Modus aktiv";
  let message = "Dataverse ist nicht konfiguriert. Es werden Mock-Daten angezeigt.";
  let alertType = "alert-info";

  if (hasError) {
    title = "Dataverse-Verbindung fehlgeschlagen";
    message = "Die Verbindung zu Dataverse ist fehlgeschlagen (404: Tabelle nicht gefunden oder Token-Problem). Es werden Mock-Daten angezeigt. Prüfe die Server-Konsole für Details.";
    alertType = "alert-warning";
  } else if (tokenMissing) {
    message = "Dataverse-URL ist konfiguriert, aber der Access Token fehlt. Es werden Mock-Daten angezeigt.";
  }

  return (
    <div className={`alert ${alertType} mb-6`}>
      <AlertCircle className="h-5 w-5" />
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}

// Hauptkomponente: Die Seite
export default async function IdeasPage() {
  // Ideen laden (aus Dataverse oder Mock-Daten)
  const ideas = await fetchAllIdeas();
  const isConfigured = isDataverseConfigured();

  return (
    <div>
      {/* Seitenüberschrift */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Ideen-Pool</h1>
        </div>
        <Link href="/ideas/new" className="btn btn-primary btn-sm">
          Neue Idee
        </Link>
      </div>

      {/* Hinweis wenn Demo-Modus */}
      {!isConfigured && <DataverseHint />}

      {/* Ideen als Karten-Grid */}
      {ideas.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : (
        // Leerer Zustand
        <div className="text-center py-12">
          <Lightbulb className="h-16 w-16 mx-auto text-base-content/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Noch keine Ideen vorhanden</h2>
          <p className="text-base-content/60 mb-4">
            Sei der Erste und reiche eine Digitalisierungsidee ein!
          </p>
          <Link href="/ideas/new" className="btn btn-primary">
            Erste Idee einreichen
          </Link>
        </div>
      )}
    </div>
  );
}
