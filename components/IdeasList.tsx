/**
 * IdeasList.tsx
 * 
 * Client Component, die die Ideen-Liste mit Filtern anzeigt.
 * Wird von der Ideen-Pool-Seite verwendet.
 */

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Calendar, FolderKanban, Lightbulb, Rocket, User } from "lucide-react";
import { Idea } from "@/lib/validators";
import IdeaFilters from "./IdeaFilters";

// Die drei Typen in der gewünschten Reihenfolge
const IDEA_TYPES = ["Idee", "Vorhaben", "Projekt"] as const;
type IdeaType = (typeof IDEA_TYPES)[number];

// Icons und Farben für jeden Typ
const TYPE_CONFIG: Record<IdeaType, { icon: React.ReactNode; color: string; description: string }> = {
  Idee: {
    icon: <Lightbulb className="h-5 w-5" />,
    color: "text-warning",
    description: "Neue Ideen und Vorschläge",
  },
  Vorhaben: {
    icon: <FolderKanban className="h-5 w-5" />,
    color: "text-info",
    description: "Geplante Vorhaben",
  },
  Projekt: {
    icon: <Rocket className="h-5 w-5" />,
    color: "text-success",
    description: "Aktive Projekte",
  },
};

// Hilfsfunktion: Datum formatieren
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Status-Badge
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
  return <span className={`badge ${colorClass}`}>{status}</span>;
}

// Ideen-Karte
function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link href={`/ideas/${idea.id}`} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between gap-2">
          <h2 className="card-title text-lg">{idea.title}</h2>
          <StatusBadge status={idea.status} />
        </div>
        <p className="text-base-content/70 line-clamp-2">{idea.description}</p>
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

// Typ-Sektion
function TypeSection({ type, ideas }: { type: IdeaType; ideas: Idea[] }) {
  const config = TYPE_CONFIG[type];
  
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className={config.color}>{config.icon}</span>
        <h2 className="text-xl font-semibold">{type}</h2>
        <span className="badge badge-ghost">{ideas.length}</span>
      </div>
      
      {ideas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-base-200/50 rounded-lg">
          <p className="text-base-content/50">Keine {type === "Idee" ? "Ideen" : type} gefunden</p>
        </div>
      )}
    </section>
  );
}

interface IdeasListProps {
  ideas: Idea[];
}

export default function IdeasList({ ideas }: IdeasListProps) {
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>(ideas);

  // Callback für gefilterte Ideen
  const handleFilteredIdeasChange = useCallback((filtered: Idea[]) => {
    setFilteredIdeas(filtered);
  }, []);

  // Gefilterte Ideen nach Typ gruppieren
  const groupedIdeas: Record<IdeaType, Idea[]> = {
    Idee: [],
    Vorhaben: [],
    Projekt: [],
  };

  for (const idea of filteredIdeas) {
    const type = idea.type as IdeaType | undefined;
    if (type && type in groupedIdeas) {
      groupedIdeas[type].push(idea);
    } else {
      groupedIdeas.Idee.push(idea);
    }
  }

  return (
    <div>
      {/* Filter */}
      <IdeaFilters ideas={ideas} onFilteredIdeasChange={handleFilteredIdeasChange} />

      {/* Keine Ergebnisse */}
      {filteredIdeas.length === 0 ? (
        <div className="text-center py-12 bg-base-200/50 rounded-lg">
          <p className="text-base-content/60 text-lg">Keine Einträge gefunden</p>
          <p className="text-base-content/40 text-sm mt-1">Passe deine Filter an oder setze sie zurück</p>
        </div>
      ) : (
        // Gruppierte Ideen anzeigen
        IDEA_TYPES.map((type) => {
          const typeIdeas = groupedIdeas[type];
          // Nur Sektionen mit Ideen anzeigen
          if (typeIdeas.length === 0) return null;
          return <TypeSection key={type} type={type} ideas={typeIdeas} />;
        })
      )}
    </div>
  );
}
