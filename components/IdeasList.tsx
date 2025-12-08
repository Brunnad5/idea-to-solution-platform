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

// Die vier BPF-Phasen in der gewünschten Reihenfolge
const BPF_PHASES = ["Initialisierung", "Analyse & Bewertung", "Planung", "Umsetzung"] as const;
type BpfPhase = (typeof BPF_PHASES)[number];

// Icons und Farben für jede Phase
const PHASE_CONFIG: Record<BpfPhase, { icon: React.ReactNode; color: string; description: string }> = {
  "Initialisierung": {
    icon: <Lightbulb className="h-5 w-5" />,
    color: "text-info",
    description: "Neue Ideen werden initial geprüft",
  },
  "Analyse & Bewertung": {
    icon: <Calendar className="h-5 w-5" />,
    color: "text-warning",
    description: "Detaillierte Analyse und Bewertung",
  },
  "Planung": {
    icon: <FolderKanban className="h-5 w-5" />,
    color: "text-primary",
    description: "Konkrete Planung und Vorbereitung",
  },
  "Umsetzung": {
    icon: <Rocket className="h-5 w-5" />,
    color: "text-success",
    description: "Aktive Umsetzung der Ideen",
  },
};

// Die drei Typen für Badges
const IDEA_TYPES = ["Idee", "Vorhaben", "Projekt"] as const;
type IdeaType = (typeof IDEA_TYPES)[number];

// Icons für jeden Typ (für Badges)
const TYPE_CONFIG: Record<IdeaType, { icon: React.ReactNode; color: string }> = {
  Idee: {
    icon: <Lightbulb className="h-4 w-4" />,
    color: "badge-warning",
  },
  Vorhaben: {
    icon: <FolderKanban className="h-4 w-4" />,
    color: "badge-info",
  },
  Projekt: {
    icon: <Rocket className="h-4 w-4" />,
    color: "badge-success",
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

// Typ-Badge (klein, für in der Karte)
function TypeBadge({ type }: { type?: string }) {
  const ideaType = type as IdeaType | undefined;
  if (!ideaType || !(ideaType in TYPE_CONFIG)) {
    return null;
  }
  
  const config = TYPE_CONFIG[ideaType];
  return (
    <span className={`badge ${config.color} badge-sm flex items-center gap-1`}>
      {config.icon}
      {ideaType}
    </span>
  );
}

// Ideen-Karte
function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link href={`/ideas/${idea.id}`} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body p-4 sm:p-6">
        {/* Typ-Badge oben rechts */}
        <div className="flex justify-end mb-1">
          <TypeBadge type={idea.type} />
        </div>
        {/* Titel */}
        <h2 className="card-title text-base sm:text-lg line-clamp-2">{idea.title}</h2>
        {/* Beschreibung */}
        <p className="text-base-content/70 text-sm line-clamp-2">{idea.description}</p>
        {/* Meta-Infos */}
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
      </div>
    </Link>
  );
}

// Phasen-Sektion
function PhaseSection({ phase, ideas }: { phase: BpfPhase; ideas: Idea[] }) {
  const config = PHASE_CONFIG[phase];
  
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className={config.color}>{config.icon}</span>
        <h2 className="text-xl font-semibold">{phase}</h2>
        <span className="badge badge-ghost">{ideas.length}</span>
      </div>
      
      {/* Phasen-Beschreibung */}
      <p className="text-base-content/60 text-sm mb-4">{config.description}</p>
      
      {ideas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-base-200/50 rounded-lg">
          <p className="text-base-content/50">Keine Ideen in dieser Phase</p>
        </div>
      )}
    </section>
  );
}

// Sektion für Ideen ohne Phase
function NoPhaseSection({ ideas }: { ideas: Idea[] }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base-content/40">
          <Calendar className="h-5 w-5" />
        </span>
        <h2 className="text-xl font-semibold text-base-content/60">Keine Phase</h2>
        <span className="badge badge-ghost">{ideas.length}</span>
      </div>
      
      <p className="text-base-content/60 text-sm mb-4">Ideen ohne zugewiesene Prozessphase</p>
      
      {ideas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-base-200/50 rounded-lg">
          <p className="text-base-content/50">Keine Ideen ohne Phase</p>
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

  // Gefilterte Ideen nach Phase gruppieren
  const groupedIdeas: Record<BpfPhase, Idea[]> = {
    "Initialisierung": [],
    "Analyse & Bewertung": [],
    "Planung": [],
    "Umsetzung": [],
  };
  
  const ideasWithoutPhase: Idea[] = [];

  for (const idea of filteredIdeas) {
    const phase = idea.bpfStatus as BpfPhase | undefined;
    if (phase && phase in groupedIdeas) {
      groupedIdeas[phase].push(idea);
    } else {
      ideasWithoutPhase.push(idea);
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
        // Gruppierte Ideen nach Phase anzeigen
        <>
          {/* Phasen in der richtigen Reihenfolge */}
          {BPF_PHASES.map((phase) => {
            const phaseIdeas = groupedIdeas[phase];
            // Nur Sektionen mit Ideen anzeigen
            if (phaseIdeas.length === 0) return null;
            return <PhaseSection key={phase} phase={phase} ideas={phaseIdeas} />;
          })}
          
          {/* Ideen ohne Phase */}
          {ideasWithoutPhase.length > 0 && (
            <NoPhaseSection ideas={ideasWithoutPhase} />
          )}
        </>
      )}
    </div>
  );
}
