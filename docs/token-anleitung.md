# Anleitung: Dataverse Access Token holen

Da wir keine Azure App Registration haben, müssen wir den Access Token manuell holen.
Der Token läuft nach ca. **1 Stunde** ab und muss dann erneuert werden.

---

## Option 1: Via Postman (empfohlen)

### Schritt 1: OAuth-Request konfigurieren

1. Öffne Postman und erstelle einen neuen Request
2. Gehe zu **Authorization** → Type: **OAuth 2.0**
3. Konfiguriere folgende Werte:

| Feld | Wert |
|------|------|
| Grant Type | Authorization Code |
| Auth URL | `https://login.microsoftonline.com/common/oauth2/authorize` |
| Token URL | `https://login.microsoftonline.com/common/oauth2/token` |
| Client ID | `04b07795-8ddb-461a-bbee-02f9e1bf7b46` |
| Scope | (leer lassen) |
| Client Authentication | Send as Basic Auth Header |

4. Klicke unter **Advanced Options**:
   - Resource: `https://scepdevstud6.crm17.dynamics.com`

### Schritt 2: Token holen

1. Klicke auf **Get New Access Token**
2. Melde dich mit deinem Microsoft-Konto an
3. Nach erfolgreicher Anmeldung siehst du den Token
4. Kopiere den **Access Token**

### Schritt 3: In .env.local einfügen

```bash
DATAVERSE_ACCESS_TOKEN=eyJ0eXAiOiJKV1Q...  # Dein kopierter Token
```

---

## Option 2: Via Browser DevTools

1. Öffne Power Apps (https://make.powerapps.com) und melde dich an
2. Öffne die Browser-Entwicklertools (F12)
3. Gehe zu **Network** (Netzwerk)
4. Führe eine Aktion aus (z.B. öffne eine App)
5. Suche nach einem Request zu `dynamics.com`
6. Kopiere den `Authorization: Bearer ...` Header

---

## Token testen

Du kannst den Token mit diesem curl-Befehl testen:

```bash
curl -X GET "https://scepdevstud6.crm17.dynamics.com/api/data/v9.2/sgsw_digitalisierungsvorhabens" \
  -H "Authorization: Bearer DEIN_TOKEN_HIER" \
  -H "OData-MaxVersion: 4.0" \
  -H "OData-Version: 4.0" \
  -H "Accept: application/json"
```

Wenn du JSON-Daten zurückbekommst, funktioniert der Token!

---

## Token abgelaufen?

Wenn du diesen Fehler siehst:
```
Dataverse Fehler: 401 Unauthorized
```

Dann ist der Token abgelaufen. Hole einen neuen Token mit der Anleitung oben.

---

## Wichtige Hinweise

- **Sicherheit**: Der Token gibt Zugriff auf Dataverse mit DEINEN Berechtigungen. Teile ihn nicht!
- **Ablaufzeit**: Ca. 1 Stunde. Danach erneuern.
- **Nur für Prototyp**: Für Produktion brauchen wir eine echte App Registration.
