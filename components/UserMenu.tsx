/**
 * UserMenu.tsx
 * 
 * Zeigt Login-Button oder User-Info mit Logout-Option.
 * Verwendet Token-basierte Authentifizierung.
 */

"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { Key, LogOut, User, Clock, ClipboardList } from "lucide-react";

export default function UserMenu() {
  const { 
    user, 
    clearToken, 
    isLoading, 
    isAuthenticated, 
    tokenTimeRemaining,
    setShowTokenModal 
  } = useAuth();

  // Loading-Zustand
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="loading loading-spinner loading-sm"></span>
      </div>
    );
  }

  // Nicht angemeldet → Login-Button
  if (!isAuthenticated || !user) {
    return (
      <button 
        onClick={() => setShowTokenModal(true)} 
        className="btn btn-primary btn-sm gap-2"
      >
        <Key className="h-4 w-4" />
        <span className="hidden sm:inline">Verbinden</span>
      </button>
    );
  }

  // Angemeldet → User-Info mit Dropdown
  return (
    <div className="dropdown dropdown-end">
      <div 
        tabIndex={0} 
        role="button" 
        className="btn btn-ghost btn-sm gap-2"
      >
        <User className="h-4 w-4 text-success" />
        <span className="hidden sm:inline max-w-32 truncate">
          {user.name}
        </span>
      </div>
      <ul 
        tabIndex={0} 
        className="dropdown-content menu bg-base-100 rounded-box z-10 w-64 p-2 shadow mt-2"
      >
        {/* User-Info */}
        <li className="menu-title px-2 py-1">
          <span className="text-xs text-base-content/60">Verbunden als</span>
          <span className="font-medium truncate">{user.email}</span>
        </li>
        
        {/* Token-Status */}
        {tokenTimeRemaining && (
          <li className="px-2 py-1">
            <div className="flex items-center gap-2 text-xs text-base-content/60">
              <Clock className="h-3 w-3" />
              <span>Token gültig: {tokenTimeRemaining}</span>
            </div>
          </li>
        )}
        
        <div className="divider my-1"></div>
        
        {/* Neuen Token eingeben */}
        <li>
          <button onClick={() => setShowTokenModal(true)}>
            <Key className="h-4 w-4" />
            Neuen Token eingeben
          </button>
        </li>
        
        {/* Logout */}
        <li>
          <button onClick={clearToken} className="text-error">
            <LogOut className="h-4 w-4" />
            Verbindung trennen
          </button>
        </li>
        
        <div className="divider my-1"></div>
        
        {/* Admin TODOs */}
        <li>
          <Link href="/admin/todos" className="text-base-content/70">
            <ClipboardList className="h-4 w-4" />
            Admin TODOs
          </Link>
        </li>
      </ul>
    </div>
  );
}
