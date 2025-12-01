/**
 * Navbar.tsx
 * 
 * Die Haupt-Navigation der App. Zeigt das Logo/den App-Namen und 
 * später auch den eingeloggten User und Login/Logout-Buttons.
 * Verwendet daisyUI-Komponenten für ein konsistentes Design.
 */

import Link from "next/link";
import { Lightbulb, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 shadow-sm">
      {/* Linker Bereich: Logo & App-Name */}
      <div className="navbar-start">
        {/* Mobile Menü (Dropdown) - wird später erweitert */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <Menu className="h-5 w-5" />
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow"
          >
            <li>
              <Link href="/">Start</Link>
            </li>
            <li>
              <Link href="/ideas">Ideen-Pool</Link>
            </li>
            <li>
              <Link href="/ideas/new">Neue Idee</Link>
            </li>
          </ul>
        </div>

        {/* App-Logo und Name */}
        <Link href="/" className="btn btn-ghost text-xl gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">Idea2Solution</span>
        </Link>
      </div>

      {/* Mitte: Desktop-Navigation */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          <li>
            <Link href="/ideas">Ideen-Pool</Link>
          </li>
          <li>
            <Link href="/ideas/new">Neue Idee einreichen</Link>
          </li>
        </ul>
      </div>

      {/* Rechter Bereich: User-Info & Login (Platzhalter für später) */}
      <div className="navbar-end">
        {/* Platzhalter: Wird in Schritt 4 (Auth) mit echtem Login ersetzt */}
        <span className="text-sm text-base-content/60 mr-2 hidden sm:inline">
          Nicht angemeldet
        </span>
        <button className="btn btn-primary btn-sm">Anmelden</button>
      </div>
    </div>
  );
}
