/**
 * IdeaFilters.tsx
 * 
 * Filter-Komponente für die Ideen-Pool-Seite.
 * Enthält Volltextsuche, Typ-Filter, Status-Filter und Personen-Filter.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, X, User, ChevronDown } from "lucide-react";
import { Idea, IdeaStatus } from "@/lib/validators";

// BPF Status-Werte (4 Phasen)
const BPF_STATUSES = [
  "Initialisierung",
  "Analyse & Bewertung",
  "Planung",
  "Umsetzung",
] as const;

// Typ-Optionen
const TYPE_OPTIONS = ["Idee", "Vorhaben", "Projekt"] as const;

interface IdeaFiltersProps {
  ideas: Idea[];
  onFilteredIdeasChange: (filtered: Idea[]) => void;
}

export default function IdeaFilters({ ideas, onFilteredIdeasChange }: IdeaFiltersProps) {
  
  // Filter-State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBpfStatuses, setSelectedBpfStatuses] = useState<string[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>("");

  // Alle eindeutigen Personen aus den Ideen extrahieren
  const allPersons = useMemo(() => {
    const persons = new Set<string>();
    ideas.forEach((idea) => {
      if (idea.submittedBy) {
        persons.add(idea.submittedBy);
      }
    });
    return Array.from(persons).sort();
  }, [ideas]);

  // Filterlogik
  const filteredIdeas = useMemo(() => {
    let filtered = [...ideas];

    // Textsuche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (idea) =>
          idea.title.toLowerCase().includes(query) ||
          idea.description.toLowerCase().includes(query) ||
          idea.submittedBy.toLowerCase().includes(query)
      );
    }

    // Typ-Filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((idea) => idea.type && selectedTypes.includes(idea.type));
    }

    // BPF-Status-Filter
    if (selectedBpfStatuses.length > 0) {
      filtered = filtered.filter((idea) => idea.bpfStatus && selectedBpfStatuses.includes(idea.bpfStatus));
    }

    // Personen-Filter
    if (selectedPerson) {
      filtered = filtered.filter((idea) => idea.submittedBy === selectedPerson);
    }

    return filtered;
  }, [searchQuery, selectedTypes, selectedBpfStatuses, selectedPerson, ideas]);

  // Gefilterte Ideen an Parent übergeben
  useEffect(() => {
    onFilteredIdeasChange(filteredIdeas);
  }, [filteredIdeas, onFilteredIdeasChange]);

  // Typ-Toggle
  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // BPF-Status-Toggle
  const toggleBpfStatus = (status: string) => {
    setSelectedBpfStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Alle Filter zurücksetzen
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedBpfStatuses([]);
    setSelectedPerson("");
  };

  // Anzahl aktiver Filter
  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedTypes.length +
    selectedBpfStatuses.length +
    (selectedPerson ? 1 : 0);

  return (
    <div className="space-y-4 mb-6">
      {/* Suchleiste */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filter-Zeile */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Typ-Filter */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-sm btn-outline gap-1">
            <Filter className="h-3 w-3" />
            Typ
            {selectedTypes.length > 0 && (
              <span className="badge badge-primary badge-xs">{selectedTypes.length}</span>
            )}
            <ChevronDown className="h-3 w-3" />
          </div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-48 p-2 shadow mt-1">
            {TYPE_OPTIONS.map((type) => (
              <li key={type}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  {type}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* BPF-Status-Filter */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-sm btn-outline gap-1">
            <Filter className="h-3 w-3" />
            Phase
            {selectedBpfStatuses.length > 0 && (
              <span className="badge badge-primary badge-xs">{selectedBpfStatuses.length}</span>
            )}
            <ChevronDown className="h-3 w-3" />
          </div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-60 p-2 shadow mt-1">
            {BPF_STATUSES.map((status) => (
              <li key={status}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBpfStatuses.includes(status)}
                    onChange={() => toggleBpfStatus(status)}
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  {status}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Person-Filter */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-sm btn-outline gap-1">
            <User className="h-3 w-3" />
            Person
            {selectedPerson && (
              <span className="badge badge-primary badge-xs">1</span>
            )}
            <ChevronDown className="h-3 w-3" />
          </div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-56 p-2 shadow mt-1 max-h-64 overflow-y-auto">
            <li>
              <button
                onClick={() => setSelectedPerson("")}
                className={!selectedPerson ? "active" : ""}
              >
                Alle Personen
              </button>
            </li>
            <div className="divider my-1"></div>
            {allPersons.map((person) => (
              <li key={person}>
                <button
                  onClick={() => setSelectedPerson(person)}
                  className={selectedPerson === person ? "active" : ""}
                >
                  {person}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Filter zurücksetzen */}
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} className="btn btn-sm btn-ghost text-error gap-1">
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">Filter zurücksetzen</span>
            <span className="sm:hidden">Zurücksetzen</span>
          </button>
        )}
      </div>

      {/* Ergebnis-Anzeige */}
      <div className="text-sm text-base-content/60">
        {filteredIdeas.length === ideas.length ? (
          <span>{ideas.length} Einträge</span>
        ) : (
          <span>
            {filteredIdeas.length} von {ideas.length} Einträgen
            {activeFilterCount > 0 && ` (${activeFilterCount} Filter aktiv)`}
          </span>
        )}
      </div>
    </div>
  );
}
