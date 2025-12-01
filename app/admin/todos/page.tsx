/**
 * app/admin/todos/page.tsx
 * 
 * Admin-Seite mit offenen technischen TODOs und Verbesserungsvorschlägen.
 * Nur für eingeloggte User sichtbar (Link im UserMenu).
 */

import { AlertTriangle, CheckCircle, Clock, Shield, Database, Key, Users } from "lucide-react";

// Typ für ein TODO-Item
interface TodoItem {
  title: string;
  description: string;
  priority: "hoch" | "mittel" | "niedrig";
  category: string;
  details?: string[];
}

// Alle offenen TODOs
const TODOS: TodoItem[] = [
  {
    title: "Echte Besitzer-Prüfung implementieren",
    description: "Aktuell können alle angemeldeten User alle Ideen bearbeiten. Eigentlich sollte nur der Ersteller seine eigene Idee bearbeiten können.",
    priority: "mittel",
    category: "Sicherheit",
    details: [
      "Problem: Der Token enthält die Azure AD Object ID, aber Dataverse speichert eine andere ID (SystemUser ID).",
      "Lösung: Die SystemUser-Tabelle in Dataverse abfragen und dort die 'azureactivedirectoryobjectid' mit dem Token vergleichen.",
      "Aufwand: Ca. 1-2 Stunden für die Implementierung.",
    ],
  },
  {
    title: "Echte Microsoft-Anmeldung (OAuth)",
    description: "Aktuell muss der Token manuell aus Power Apps kopiert werden. Eine echte OAuth-Anmeldung wäre benutzerfreundlicher.",
    priority: "hoch",
    category: "Authentifizierung",
    details: [
      "Voraussetzung: Azure App Registration mit korrekten Redirect URIs.",
      "Vorteil: User müssen keinen Token manuell kopieren.",
      "Hinweis: Die Redirect URI muss sowohl für localhost als auch für Vercel konfiguriert werden.",
    ],
  },
  {
    title: "Token automatisch erneuern",
    description: "Der Token läuft nach ca. 1 Stunde ab. User müssen dann manuell einen neuen eingeben.",
    priority: "niedrig",
    category: "Authentifizierung",
    details: [
      "Möglichkeit 1: Refresh Token verwenden (benötigt OAuth).",
      "Möglichkeit 2: User benachrichtigen, bevor der Token abläuft.",
      "Aktuell: Timer zeigt verbleibende Zeit im UserMenu an.",
    ],
  },
  {
    title: "Rollen und Berechtigungen",
    description: "Verschiedene Rollen definieren (z.B. Admin, Reviewer, User) mit unterschiedlichen Berechtigungen.",
    priority: "niedrig",
    category: "Sicherheit",
    details: [
      "Admins: Alle Ideen bearbeiten, Status ändern.",
      "Reviewer: Ideen prüfen und kommentieren.",
      "User: Eigene Ideen einreichen und bearbeiten.",
    ],
  },
  {
    title: "Status-Änderungen protokollieren",
    description: "Wenn sich der Status einer Idee ändert, sollte dies mit Zeitstempel und User protokolliert werden.",
    priority: "niedrig",
    category: "Datenbank",
    details: [
      "Audit-Trail für Nachvollziehbarkeit.",
      "Könnte in einer separaten Dataverse-Tabelle gespeichert werden.",
    ],
  },
  {
    title: "E-Mail-Benachrichtigungen",
    description: "User benachrichtigen, wenn sich der Status ihrer Idee ändert.",
    priority: "niedrig",
    category: "Kommunikation",
    details: [
      "Benötigt E-Mail-Service (z.B. SendGrid, Resend).",
      "Oder: Power Automate Flow in Dataverse einrichten.",
    ],
  },
];

// Farben für Prioritäten
const PRIORITY_CONFIG = {
  hoch: { badge: "badge-error", icon: AlertTriangle },
  mittel: { badge: "badge-warning", icon: Clock },
  niedrig: { badge: "badge-info", icon: CheckCircle },
};

// Icons für Kategorien
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Sicherheit: <Shield className="h-4 w-4" />,
  Authentifizierung: <Key className="h-4 w-4" />,
  Datenbank: <Database className="h-4 w-4" />,
  Kommunikation: <Users className="h-4 w-4" />,
};

export default function AdminTodosPage() {
  // Nach Priorität gruppieren
  const highPriority = TODOS.filter((t) => t.priority === "hoch");
  const mediumPriority = TODOS.filter((t) => t.priority === "mittel");
  const lowPriority = TODOS.filter((t) => t.priority === "niedrig");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Admin TODOs</h1>
        <p className="text-base-content/70">
          Offene technische Aufgaben und Verbesserungsvorschläge für die Weiterentwicklung der Plattform.
        </p>
      </div>

      {/* Info-Box */}
      <div className="alert alert-info mb-6">
        <AlertTriangle className="h-5 w-5" />
        <div>
          <p className="font-medium">Prototyp-Hinweis</p>
          <p className="text-sm">
            Diese App ist ein Prototyp/MVP. Einige Funktionen sind vereinfacht oder noch nicht implementiert.
            Die folgenden TODOs zeigen, was für eine Produktionsversion noch umgesetzt werden müsste.
          </p>
        </div>
      </div>

      {/* Hohe Priorität */}
      {highPriority.length > 0 && (
        <TodoSection title="Hohe Priorität" items={highPriority} priority="hoch" />
      )}

      {/* Mittlere Priorität */}
      {mediumPriority.length > 0 && (
        <TodoSection title="Mittlere Priorität" items={mediumPriority} priority="mittel" />
      )}

      {/* Niedrige Priorität */}
      {lowPriority.length > 0 && (
        <TodoSection title="Niedrige Priorität" items={lowPriority} priority="niedrig" />
      )}

      {/* Aktueller Stand */}
      <div className="mt-8 p-4 bg-base-200 rounded-lg">
        <h2 className="font-bold mb-2">Was bereits funktioniert</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-base-content/80">
          <li>Ideen aus Dataverse laden und anzeigen</li>
          <li>Neue Ideen erstellen (wird in Dataverse gespeichert)</li>
          <li>Ideen bearbeiten (Beschreibung ändern)</li>
          <li>Token-basierte Authentifizierung mit User-Erkennung</li>
          <li>Anzeige von Token-Ablaufzeit</li>
          <li>Funktioniert lokal und auf Vercel</li>
        </ul>
      </div>
    </div>
  );
}

// Komponente für eine TODO-Sektion
function TodoSection({ 
  title, 
  items, 
  priority 
}: { 
  title: string; 
  items: TodoItem[]; 
  priority: "hoch" | "mittel" | "niedrig";
}) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {title}
      </h2>
      <div className="space-y-4">
        {items.map((item, index) => (
          <TodoCard key={index} item={item} />
        ))}
      </div>
    </div>
  );
}

// Komponente für eine TODO-Karte
function TodoCard({ item }: { item: TodoItem }) {
  const config = PRIORITY_CONFIG[item.priority];
  const categoryIcon = CATEGORY_ICONS[item.category] || null;

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body py-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title text-base">{item.title}</h3>
          <div className="flex gap-2">
            <span className={`badge ${config.badge}`}>{item.priority}</span>
            {categoryIcon && (
              <span className="badge badge-ghost gap-1">
                {categoryIcon}
                {item.category}
              </span>
            )}
          </div>
        </div>

        {/* Beschreibung */}
        <p className="text-base-content/70 text-sm">{item.description}</p>

        {/* Details */}
        {item.details && item.details.length > 0 && (
          <div className="mt-2 p-3 bg-base-200 rounded-lg">
            <p className="text-xs font-medium mb-1 text-base-content/60">Details:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-base-content/70">
              {item.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
