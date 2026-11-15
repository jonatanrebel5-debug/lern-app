# Lern-App online stellen (Vercel + Upstash Redis)

## 1. Umgebungsvariablen bei Vercel

Vercel → dein Projekt → **Settings → Environment Variables** (Umgebung: *Production*):

| Name | Wert | Wofür |
|---|---|---|
| `ACCESS_CODE` | dein eigener Code, mind. 8 Zeichen | öffnet die komplette Lern-App (nur für dich) |
| `TRAINER_CODE` | anderer Code, mind. 8 Zeichen | öffnet nur die schreibgeschützte Ausbilder-Ansicht `/ausbilder` |
| `AUTH_SECRET` | **neuer** Zufallswert, mind. 32 Zeichen | signiert das Freischalt-Cookie |

`AUTH_SECRET` erzeugen (im Projektordner, Ergebnis kopieren):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Nimm online **andere** Werte als in `.env.local`. Die Redis-Werte trägst du **nicht** selbst ein, die setzt Schritt 2 automatisch.

## 2. Upstash Redis verbinden (ein paar Klicks)

1. Vercel → dein Projekt → Reiter **Storage** → **Create Database** (bzw. über den **Marketplace**).
2. **Upstash** → **Redis** auswählen.
3. Region möglichst nah wählen, z. B. **Frankfurt (eu-central-1)**. Den kostenlosen Tarif nehmen.
4. Mit dem Projekt **verbinden** (Connect). Vercel trägt die Zugangsdaten dann selbst als Umgebungsvariablen ein.
   - Je nach Integration heißen sie `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` oder `KV_REST_API_URL`/`KV_REST_API_TOKEN`. Die App versteht beide.
5. Prüfen: Unter **Settings → Environment Variables** sollte jetzt eins dieser Paare stehen.

## 3. Neu deployen

Geänderte Umgebungsvariablen gelten erst nach einem neuen Deployment:
Reiter **Deployments** → beim neuesten Eintrag **⋯ → Redeploy**.

## 4. Testen

1. Die Vercel-Adresse auf dem iPhone in **Safari** öffnen und den eigenen `ACCESS_CODE` eingeben.
2. **Teilen → „Zum Home-Bildschirm“**, die App öffnen und den Code dort **einmal erneut** eingeben. Die Home-Bildschirm-App hat einen eigenen Cookie-Speicher.
3. Eine Lern-Sitzung abschließen. In der Zusammenfassung sollte „☁️ Lernstand für deinen Ausbilder aktualisiert“ stehen.
4. Auf der Startseite **„Ausbilder-Ansicht“** öffnen. Dort erscheint dein Lernstand.
5. Dem Ausbilder die Adresse und den `TRAINER_CODE` geben. Er landet direkt auf `/ausbilder` und kann nichts verändern.

## Gut zu wissen

- **Jemanden aussperren:** Den jeweiligen Code bei Vercel ändern und neu deployen. Alle Geräte dieser Rolle müssen den neuen Code eingeben. Ändert man `AUTH_SECRET`, werden alle Geräte gesperrt.
- **Hochgeladen wird nur eine Zusammenfassung** (Fortschritt pro Fach, Tagesziel, Lern-Tagebuch der letzten 60 Tage), **keine Karteninhalte**.
- **Ein Lern-Gerät:** Lernst du auf iPhone *und* Mac, gewinnt in der Ausbilder-Ansicht der zuletzt hochgeladene Stand. Ein echter Abgleich zwischen Geräten ist ein späterer Schritt.
- **Ohne Redis** läuft die App ganz normal. Der Upload wird übersprungen, und `/ausbilder` zeigt einen Hinweis.
