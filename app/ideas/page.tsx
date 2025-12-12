/**
 * app/ideas/page.tsx
 * 
 * Die Ideen-Pool Seite. Zeigt alle eingereichten Ideen nach Typ gruppiert an.
 * Enthält Volltextsuche und Filter nach Typ, Status und Person.
 * Dies ist eine Server Component – die Daten werden serverseitig geladen.
 */

import Link from "next/link";
import { fetchAllIdeas, getDataverseDebugInfo } from "@/lib/dataverse";
import { Edit3, Lightbulb } from "lucide-react";
import IdeasList from "@/components/IdeasList";
import DataverseDebugInfo from "@/components/DataverseDebugInfo";

// Hauptkomponente: Die Seite
export default async function IdeasPage() {
  // Ideen laden (aus Dataverse oder Mock-Daten)
  const ideas = await fetchAllIdeas();
  const debugInfo = await getDataverseDebugInfo();
  
  // Anzahl Ideen zur Überarbeitung zählen
  const revisionCount = ideas.filter((idea) => idea.status === "in Überarbeitung").length;

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
        <div className="flex gap-2">
          <Link href="/ideas/revision" className="btn btn-warning btn-sm btn-outline gap-1 relative">
            <Edit3 className="h-4 w-4" />
            Überarbeitung
            {revisionCount > 0 && (
              <span className="badge badge-error badge-xs absolute -top-2 -right-2 min-w-[1.25rem] h-5">
                {revisionCount}
              </span>
            )}
          </Link>
          <Link href="/ideas/new" className="btn btn-primary btn-sm">
            Neue Idee
          </Link>
        </div>
      </div>

      {/* Debug-Info wenn Dataverse nicht konfiguriert */}
      <DataverseDebugInfo debugInfo={debugInfo} />

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
