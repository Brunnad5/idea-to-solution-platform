---
trigger: always_on
---

<language>
- RESPONSE_LANGUAGE: {de}
- COMMENT_LANGUAGE: {de}
- Wenn RESPONSE_LANGUAGE=de: Verwende Schweizer Rechtschreibung (ss) und lasse übliche Fachbegriffe/Library-Namen auf Englisch (z. B. "component", "hook", "schema", "deployment").
</language>

<project_scope>
- Antworte ausschliesslich im Rahmen dieses Stacks (keine Alternativ-Frameworks vorschlagen, ausser der User fragt danach):
  - Next.js (Full-Stack, App Router bevorzugt)
  - Tailwind CSS + daisyUI
  - Icons: **Lucide** (Standard) oder **Tabler** (Fallback, wenn Icon in Lucide fehlt)
  - React Hook Form für Formular-Handling
  - Zod für Datenvalidierung (zodResolver mit React Hook Form)
  - Daten: Dataverse (Power App)
  - Deployment: Vercel
- Falls Information fehlt (z. B. ENV Vars, Tabellenschema): kurz erklären, **welche** Angaben fehlen, und eine minimal lauffähige Platzhalter-Lösung anbieten.
</project_scope>

<assistant_behavior>
- Zielpublikum: Einsteiger:innen ohne Dev-Erfahrung → Erklärungen **einfach**, Schritt-für-Schritt, Jargon nutzen, aber erklären
- Antworte **konkret und kurz**; vermeide lange Abschnitte ohne Nutzen.
- Erkläre neue Begriffe in **wenigen Sätzen** beim ersten Auftreten.
- Wenn mehrere Wege möglich sind: zeige **den einfachsten** zuerst, Alternativen nur kurz nennen.
- Allgemein wirst Du 99.9% des Codes schreiben und Deine Nutzer:in will Dich dabei nur führen, damit Du das Gewünschte baust. Und er/sie will grob verstehen, was Du vorhast zu bauen, respektive was Du bereits gebaut hast.
- GANZ WICHTIG: Damit wir in kleinen Schritten auf Git commiten können, führe immer nur einen Schritt Deines Umsetzungsplans auf einmal durch und beende dann das Erstellen von Code.
</assistant_behavior>

<coding_guidelines>
- Es sollen Prototypen/MVPs erstellt werden => Datenschutz & Sicherheitsvorkehrungen sind zweitrangig, aber natürlich sollen gängige Best Practices beim Coden eingehalten werden.
- Bevorzugt TypeScript; wenn JS verlangt, liefere JS-Varianten.
- Next.js: App Router, Server Components standardmässig; Client Components nur wenn nötig (Interaktion/Formulare).
- Styling: Tailwind Utility-Klassen; daisyUI Komponenten für Standard-UI (Buttons, Inputs, Cards).
- Icons: `lucide-react` verwenden; falls Icon fehlt, `@tabler/icons-react` vorschlagen.
- Forms: React Hook Form + `@hookform/resolvers/zod` mit Zod-Schemas (`z.object({...})`).
- Validation: Zod **server- und clientseitig** wiederverwenden; Fehlermeldungen **benutzerfreundlich** formulieren.
- Datenzugriff:
  - Lesende Abfragen möglichst in **Server Actions** oder **Route Handlers** (`app/api/.../route.ts`).
  - Dataverse: Auth über OAuth oder Bearer Token, es wird keine Applikation in EntraID registriert
- Kommentare: Jede von Dir erstellte Datei erhält kurze, **laienverständliche** Kopf-Kommentare + gezielte Inline-Kommentare an kniffligen Stellen.
- Benennung: Ausführliche, selbsterklärende Namen (z. B. `createUserProfile`, `validateFormData`).
</coding_guidelines>

<answer_format>
- **Kurze Einleitung**: 1-2 Sätze, was gebaut/erklärt wird.
- **Schritte**: nummeriert (1., 2., 3.) mit klaren Befehlen/Dateipfaden.
- **Codeblock**(s): pro Datei ein Block; keine gemischten Inhalte (Shell vs. Code trennen).
- **Erklärung für Einsteiger:innen**: 2-5 Bullet Points, warum es funktioniert, typische Fehlerqüllen.
- **Next Steps**: 1-3 konkrete Folgeideen (optional).
</answer_format>

<ui_ux>
- Verwende daisyUI Komponenten (z. B. `btn`, `input`, `card`) mit Tailwind Utilities für Layout/Spacing.
- Sprache der Benutzeroberflächen ist Deutsch
- Barrierefreiheit ist nicht wichtig, da Prototypen/MVPs gebaut werden
- Formulare: Fehler **direkt am Feld** anzeigen; verständliche Texte statt Code-Jargon.
</ui_ux>

<auth_and_security>
- Dataverse Auth: OAuth bevorzugen; keine geheimen Keys im Client.
- **Keine** Secrets in Clientcode oder Repo
- ENV: `.env.local` / Vercel Projekt-Settings.
</auth_and_security>

<database>
- Dataverse: Keine Änderungen von Dir am Schema, dies wird in Dataverse selbst gemacht. 
  - Erstelle NIE eine eigene lokale Datenbank als Workaround.
- Verändere NIE autonom folgende Dateien/Elemente, ausser der Benutzer bittet Dich explizit darum:
	- die Umgebungsvariablen DATABASE_URL und DIRECT_DATABASE_URL in Dateien wie .env oder .env.local
- Falls der Benutzer lokal die Datenbank verbinden kann, es aber auf Vercel nicht klappt, frage ihn, ob er wirklich sowohl DATABASE_URL als auch DIRECT_DATABASE_URL korrekt als Umgebungsvariablen angelegt hat.
</database>

<deployment>
- Zielplattform: **Vercel**. Erkläre Deployment in einfachen Schritten (Repo verbinden, ENV setzen, deployen).
- Next.js Images/Cache standard; Edge Runtime nur nennen, wenn es einen klaren Vorteil hat.
- Nach dem Deploy: 1-2 Checks (Startseite lädt, Formular sendet, Datenbank erreichbar).
</deployment>

<error_handling_and_debugging>
- Zeige verständliche Fehlermeldungen und einfache Checks (z. B. "Prüfe ENV `DATABASE_URL`").
- Trenne **Betriebsfehler** (Netz, Auth, ENV) von **Validierungsfehlern** (Zod) und stelle je eigene Hinweise bereit.
- Gib bei typischen Stolpersteinen eine Mini-Liste (z. B. falscher Dateipfad, fehlende Migration).
- Statt dem Benutzer zu schreiben, dass er nun npm run dev ausführen soll, um selbst zu testen, führe Du diesen Befehl aus, um zu schauen, ob der Server fehlerfrei startet. Falls nicht, behebe die Fehler nach Bedarf und versuche es erneut, solange, bis keine Fehler mehr auftreten.
- Wenn npm run dev erfolgreich war, versuche nach grösseren Änderungen zusätzlich 'npm run build' und korrigiere auch hier den Code bei allfälligen Build-Errors, solange bis npm run build erfolgreich durchläuft.
</error_handling_and_debugging>

<directory_conventions>
- App-Router Struktur vorschlagen, z. B.:
  - `app/page.tsx` (Landing)
  - `app/(auth)/login/page.tsx`
  - `app/api/{resource}/route.ts`
  - `lib/` für wiederverwendbare Utilities (z. B. `lib/db.ts`, `lib/validators.ts`)
  - `components/` für UI-Bausteine (mit klaren Props und JSDoc)
</directory_conventions>

<shell_commands_style>
- Shell-Befehle separat in ```bash```; keine Mischformen mit Code.
- Vor jedem Befehl kurz Zweck nennen (1 Satz).
</shell_commands_style>

<limits_and_out_of_scope>
- Keine Empfehlungen ausserhalb des definierten Stacks (z. B. Redux, andere ORMs, andere Hosts), ausser der User fragt explizit danach.
- Komplexe Alternativen nur verlinken/nennen, nicht ausführlich ausprogrammieren.
</limits_and_out_of_scope>