/**
 * Überarbeitungs-Seite
 * 
 * Zeigt alle Ideen an, die den Lifecycle-Status "in Überarbeitung" haben.
 * Diese Ideen wurden zur Überarbeitung an die Ideengebenden zurückgesendet.
 */

import Link from "next/link";
import { ArrowLeft, Calendar, Edit3, Lightbulb, User } from "lucide-react";
import { fetchAllIdeas } from "@/lib/dataverse";
import { Idea } from "@/lib/validators";
import { stripHtmlTags } from "@/lib/htmlUtils";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RevisionIdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link 
      href={`/ideas/${idea.id}`} 
      className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow border-l-4 border-warning"
    >
      <div className="card-body p-4 sm:p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="badge badge-warning badge-sm">Zur Überarbeitung</span>
          <span className="text-xs text-base-content/50">{idea.type}</span>
        </div>
        <h2 className="card-title text-base sm:text-lg line-clamp-2">{idea.title}</h2>
        <p className="text-base-content/70 text-sm line-clamp-2">
          {stripHtmlTags(idea.description)}
        </p>
        <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-base-content/60">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate max-w-[100px] sm:max-w-none">{idea.submittedBy}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            {formatDate(idea.createdOn)}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-base-300">
          <div className="flex items-center gap-2 text-warning text-sm">
            <Edit3 className="h-4 w-4" />
            <span>Klicken zum Bearbeiten</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function RevisionPage() {
  const allIdeas = await fetchAllIdeas();
  const revisionIdeas = allIdeas.filter((idea) => idea.status === "in Überarbeitung");

  return (
    <main className="min-h-screen bg-base-200 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <Link href="/ideas" className="btn btn-ghost btn-sm gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Ideen-Pool
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-warning/20 p-3 rounded-lg">
              <Edit3 className="h-8 w-8 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Ideen zur Überarbeitung</h1>
              <p className="text-base-content/60 mt-1">
                Diese Ideen wurden zur Überarbeitung an die Ideengebenden zurückgesendet
              </p>
            </div>
          </div>
        </div>

        <div className="stats shadow mb-8 w-full sm:w-auto">
          <div className="stat">
            <div className="stat-figure text-warning">
              <Lightbulb className="h-8 w-8" />
            </div>
            <div className="stat-title">Offene Überarbeitungen</div>
            <div className="stat-value text-warning">{revisionIdeas.length}</div>
            <div className="stat-desc">Ideen benötigen Ihre Aufmerksamkeit</div>
          </div>
        </div>

        {revisionIdeas.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {revisionIdeas.map((idea) => (
              <RevisionIdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body items-center text-center py-12">
              <div className="bg-success/20 p-4 rounded-full mb-4">
                <Edit3 className="h-12 w-12 text-success" />
              </div>
              <h2 className="card-title text-xl">Keine Ideen zur Überarbeitung</h2>
              <p className="text-base-content/60 max-w-md">
                Aktuell gibt es keine Ideen, die überarbeitet werden müssen.
              </p>
              <Link href="/ideas" className="btn btn-primary mt-4">
                Zum Ideen-Pool
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
