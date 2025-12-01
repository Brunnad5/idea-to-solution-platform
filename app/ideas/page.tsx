/**
 * app/ideas/page.tsx
 * 
 * Die Ideen-Pool Seite. Zeigt alle eingereichten Ideen nach Typ gruppiert an.
 * Enthält Volltextsuche und Filter nach Typ, Status und Person.
 * Dies ist eine Server Component – die Daten werden serverseitig geladen.
 */

import Link from "next/link";
import { fetchAllIdeas, isDataverseConfigured } from "@/lib/dataverse";
import { AlertCircle, Lightbulb } from "lucide-react";
import IdeasList from "@/components/IdeasList";

// Komponente: Hinweis wenn Dataverse nicht konfiguriert
function DataverseHint({ hasError = false }: { hasError?: boolean }) {
  let title = "Demo-Modus aktiv";
  let message = "Dataverse ist nicht konfiguriert oder kein Token vorhanden. Es werden Mock-Daten angezeigt. Klicke auf 'Verbinden' um einen Token einzugeben.";
  let alertType = "alert-info";

  if (hasError) {
    title = "Dataverse-Verbindung fehlgeschlagen";
    message = "Die Verbindung zu Dataverse ist fehlgeschlagen. Prüfe ob der Token noch gültig ist und gib ggf. einen neuen ein.";
    alertType = "alert-warning";
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
  const isConfigured = await isDataverseConfigured();

  return (
    <div>
      {/* Seitenüberschrift */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Ideen-Pool</h1>
          </div>
        </div>
        <Link href="/ideas/new" className="btn btn-primary btn-sm">
          Neue Idee
        </Link>
      </div>

      {/* Hinweis wenn Demo-Modus */}
      {!isConfigured && <DataverseHint />}

      {/* Ideen-Liste mit Filter (Client Component) */}
      {ideas.length > 0 ? (
        <IdeasList ideas={ideas} />
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
