/**
 * TokenModal.tsx
 * 
 * Modal zur Eingabe des Dataverse Bearer Tokens.
 * Enthält Anleitungen, wie der Token beschafft werden kann.
 */

"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { X, Key, ExternalLink, AlertCircle, CheckCircle, Info } from "lucide-react";

export default function TokenModal() {
  const { showTokenModal, setShowTokenModal, setToken } = useAuth();
  const [tokenInput, setTokenInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Modal nicht rendern wenn nicht sichtbar
  if (!showTokenModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await setToken(tokenInput);

    if (!result.success) {
      setError(result.error || "Unbekannter Fehler");
    } else {
      // Erfolgreich - Modal schliesst sich automatisch
      setTokenInput("");
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setShowTokenModal(false);
    setTokenInput("");
    setError(null);
  };

  // Power Apps URL (kann später aus env kommen)
  const powerAppsUrl = "https://make.powerapps.com";

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Mit Dataverse verbinden
          </h3>
          <button 
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info-Box */}
        <div className="alert alert-info mb-4">
          <Info className="h-5 w-5" />
          <div>
            <p className="text-sm">
              Um auf Dataverse zuzugreifen, benötigst du einen Bearer Token aus deiner 
              Power Apps Session. Der Token ist ca. 1 Stunde gültig.
            </p>
          </div>
        </div>

        {/* Formular */}
        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">Bearer Token</span>
            </label>
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Füge hier deinen Token ein (mit oder ohne 'Bearer ' Präfix)..."
              className="textarea textarea-bordered h-24 font-mono text-xs"
              disabled={isSubmitting}
            />
          </div>

          {/* Fehler-Anzeige */}
          {error && (
            <div className="alert alert-error mb-4">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={handleClose}
              className="btn btn-ghost"
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!tokenInput.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Verbinden
            </button>
          </div>
        </form>

        {/* Anleitung Toggle */}
        <div className="divider"></div>
        
        <button
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          {showInstructions ? "▼" : "▶"} Anleitung: So holst du den Token
        </button>

        {/* Anleitung */}
        {showInstructions && (
          <div className="mt-4 space-y-4 text-sm">
            {/* Methode 1 */}
            <div className="p-4 bg-base-200 rounded-lg">
              <h4 className="font-semibold mb-2">Methode 1: Aus den Browser DevTools</h4>
              <ol className="list-decimal list-inside space-y-1 text-base-content/80">
                <li>
                  Öffne{" "}
                  <a 
                    href={powerAppsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link link-primary inline-flex items-center gap-1"
                  >
                    Power Apps <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}und melde dich an
                </li>
                <li>Drücke <kbd className="kbd kbd-sm">F12</kbd> um die DevTools zu öffnen</li>
                <li>Gehe zum <strong>Network</strong> Tab</li>
                <li>Klicke auf irgendeinen API-Request (z.B. zu <code>dynamics.com</code>)</li>
                <li>Suche in den <strong>Request Headers</strong> nach <code>Authorization</code></li>
                <li>Kopiere den Wert (alles nach &quot;Bearer &quot;)</li>
              </ol>
            </div>

            {/* Methode 2 */}
            <div className="p-4 bg-base-200 rounded-lg">
              <h4 className="font-semibold mb-2">Methode 2: Aus der Browser-Konsole</h4>
              <ol className="list-decimal list-inside space-y-1 text-base-content/80">
                <li>Öffne Power Apps und melde dich an</li>
                <li>Drücke <kbd className="kbd kbd-sm">F12</kbd> → <strong>Console</strong> Tab</li>
                <li>Führe diesen Befehl aus:</li>
              </ol>
              <pre className="mt-2 p-2 bg-base-300 rounded text-xs overflow-x-auto">
{`// Im Browser-Console ausführen:
Object.entries(sessionStorage)
  .filter(([k]) => k.includes('accesstoken'))
  .forEach(([k, v]) => {
    const data = JSON.parse(v);
    console.log('TOKEN:', data.secret);
  });`}
              </pre>
            </div>

            {/* Hinweis */}
            <div className="alert alert-warning">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Wichtig:</p>
                <p>Der Token läuft nach ca. 1 Stunde ab. Du musst dann einen neuen holen.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={handleClose}>
        <button>close</button>
      </div>
    </div>
  );
}
