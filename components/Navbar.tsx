/**
 * Navbar.tsx
 * 
 * Die Haupt-Navigation der App. Zeigt das Logo, Navigation und User-Info.
 * Verwendet daisyUI-Komponenten und markiert den aktiven Link.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightbulb, Menu, Plus } from "lucide-react";
import UserMenu from "./UserMenu";

export default function Navbar() {
  const pathname = usePathname();

  // Prüft ob ein Link aktiv ist (exakt oder als Prefix)
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  // CSS-Klasse für aktive Links
  const linkClass = (path: string) =>
    isActive(path) ? "active font-semibold" : "";

  return (
    <div className="navbar bg-base-100 shadow-sm">
      {/* Linker Bereich: Logo & App-Name */}
      <div className="navbar-start">
        {/* Mobile Menü (Dropdown) */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <Menu className="h-5 w-5" />
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow"
          >
            <li>
              <Link href="/" className={linkClass("/")}>
                Start
              </Link>
            </li>
            <li>
              <Link href="/ideas" className={linkClass("/ideas")}>
                Ideen-Pool
              </Link>
            </li>
            <li>
              <Link href="/ideas/new" className={linkClass("/ideas/new")}>
                Neue Idee
              </Link>
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
            <Link href="/ideas" className={linkClass("/ideas")}>
              Ideen-Pool
            </Link>
          </li>
          <li>
            <Link
              href="/ideas/new"
              className={`gap-1 ${linkClass("/ideas/new")}`}
            >
              <Plus className="h-4 w-4" />
              Neue Idee
            </Link>
          </li>
        </ul>
      </div>

      {/* Rechter Bereich: User-Info */}
      <div className="navbar-end">
        <div className="flex items-center gap-2">
          <UserMenu />
          <div className="badge badge-ghost badge-sm hidden md:flex">
            Prototyp
          </div>
        </div>
      </div>
    </div>
  );
}
