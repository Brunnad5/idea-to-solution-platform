/**
 * DataverseDebugInfo.tsx
 * 
 * Debug-Komponente zur Anzeige von Dataverse-Verbindungsproblemen.
 * Zeigt detaillierte Informationen wenn die Verbindung fehlschlägt.
 */

import { AlertTriangle, CheckCircle, Database, Key, Server, XCircle } from "lucide-react";

interface DataverseDebugInfoProps {
  debugInfo: {
    isConfigured: boolean;
    hasUrl: boolean;
    hasToken: boolean;
    urlPreview: string;
    tokenPreview: string;
    errorDetails?: string;
  };
}

export default function DataverseDebugInfo({ debugInfo }: DataverseDebugInfoProps) {
  // Wenn alles konfiguriert ist, nichts anzeigen
  if (debugInfo.isConfigured) {
    return null;
  }

  return (
    <div className="alert alert-warning mb-6">
      <AlertTriangle className="h-6 w-6 flex-shrink-0" />
      <div className="w-full">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Database className="h-5 w-5" />
          Dataverse-Verbindung nicht aktiv
        </h3>
        <p className="text-sm mb-3">
          Es werden Mock-Daten angezeigt, da die Dataverse-Konfiguration unvollständig ist.
        </p>
        
        {/* Status-Details */}
        <div className="bg-base-100/50 rounded-lg p-3 text-sm space-y-2">
          <div className="font-semibold mb-2">Konfigurationsstatus:</div>
          
          {/* URL Status */}
          <div className="flex items-center gap-2">
            {debugInfo.hasUrl ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-error" />
            )}
            <Server className="h-4 w-4 text-base-content/60" />
            <span className="font-medium">DATAVERSE_URL:</span>
            <code className="bg-base-200 px-2 py-0.5 rounded text-xs">
              {debugInfo.urlPreview}
            </code>
          </div>
          
          {/* Token Status */}
          <div className="flex items-center gap-2">
            {debugInfo.hasToken ? (
              <CheckCircle className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-error" />
            )}
            <Key className="h-4 w-4 text-base-content/60" />
            <span className="font-medium">DATAVERSE_ACCESS_TOKEN:</span>
            <code className="bg-base-200 px-2 py-0.5 rounded text-xs">
              {debugInfo.tokenPreview}
            </code>
          </div>
          
          {/* Fehlerdetails */}
          {debugInfo.errorDetails && (
            <div className="mt-2 p-2 bg-error/10 rounded border border-error/20">
              <span className="text-error font-medium">Problem: </span>
              {debugInfo.errorDetails}
            </div>
          )}
        </div>
        
        {/* Lösungshinweise */}
        <div className="mt-3 text-sm">
          <div className="font-semibold mb-1">Mögliche Ursachen:</div>
          <ul className="list-disc list-inside space-y-1 text-base-content/80">
            {!debugInfo.hasUrl && (
              <li>
                <code className="text-xs bg-base-200 px-1 rounded">DATAVERSE_URL</code> nicht in Vercel Environment Variables gesetzt
              </li>
            )}
            {!debugInfo.hasToken && (
              <li>
                <code className="text-xs bg-base-200 px-1 rounded">DATAVERSE_ACCESS_TOKEN</code> nicht gesetzt oder abgelaufen
              </li>
            )}
            <li>Token könnte abgelaufen sein (Bearer Tokens laufen nach ~1h ab)</li>
            <li>Vercel Environment Variables nach letztem Deployment nicht aktualisiert</li>
          </ul>
        </div>
        
        {/* Aktionen */}
        <div className="mt-3 flex flex-wrap gap-2">
          <a 
            href="https://vercel.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline"
          >
            Vercel Dashboard öffnen
          </a>
          <span className="text-xs text-base-content/50 self-center">
            → Project Settings → Environment Variables
          </span>
        </div>
      </div>
    </div>
  );
}
