# Prozessdiagramm-Editor - Vollständige Version

## 🎯 Features

✅ **ALLE 12 Prozesse** aus dem PDF enthalten
✅ **Vollständig editierbar** - Texte, Positionen, Swimlanes
✅ **Neue Prozesse** erstellen
✅ **Swimlanes hinzufügen/löschen**
✅ **6 Box-Typen** (Aktion, Entscheidung, Dokument, Start/Ende, Teilprozess, Software)
✅ **Verbindungen** zwischen Boxen mit Labels
✅ **Master-Konfiguration** für Firmenname, Logo, Ersteller etc.
✅ **Zeichenerklärung** integriert
✅ **Export als HTML** und **Drucken**
✅ **Automatisches Speichern** im Browser

## 📦 Enthaltene Prozesse

### Führungsprozesse:
1. Managementbewertung
2. Risiken und Chancen
3. Internes Audit
4. Maßnahmenabwicklung
5. Schulungen und Kompetenzen

### Wertschöpfungsprozesse:
6. Einkauf und Wareneingang
7. Wareneingang

### Unterstützungsprozesse:
8. Kundenzufriedenheit
9. Kundenreklamationen
10. Lieferantenbewertung
11. Wartung der Maschinen
12. Prüfmittelüberwachung

## 🚀 Deployment auf Netlify

### Option 1: Drag & Drop (Am einfachsten!)

1. Auf [netlify.com](https://netlify.com) anmelden
2. "Add new site" → "Deploy manually"
3. **Gesamten Ordner** in den Upload-Bereich ziehen
4. Fertig! ✅

### Option 2: GitHub + Netlify

1. GitHub Repository erstellen
2. Alle Dateien hochladen:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/IHR-USERNAME/prozess-editor.git
   git push -u origin main
   ```
3. Auf Netlify: "Import from Git"
4. Build settings:
   - Build command: (leer lassen)
   - Publish directory: `.`

### Option 3: Netlify CLI

```bash
# Netlify CLI installieren
npm install -g netlify-cli

# In Projektverzeichnis wechseln
cd prozess-editor-netlify

# Bei Netlify anmelden
netlify login

# Deployen
netlify deploy --prod
```

## ⚙️ Verwendung

### 1. Master-Einstellungen konfigurieren

Auf der Startseite (index.html):
- **Firmenname:** z.B. "Nest OG"
- **Ersteller:** z.B. "QMB"
- **Prüfung:** z.B. "Prozessverantwortlicher"
- **Freigabe:** z.B. "GF"
- **Dokument-Prefix:** z.B. "QM-DOC-"
- **Version:** z.B. "v1.0"

**Wichtig:** "Einstellungen speichern" klicken!

### 2. Prozess bearbeiten

1. Prozess aus der Liste auswählen
2. Im Editor öffnet sich der Prozess
3. **Bearbeitungsmöglichkeiten:**
   - Texte: Doppelklick → bearbeiten
   - Boxen verschieben: Ziehen mit der Maus
   - Boxen hinzufügen: Toolbar-Buttons
   - Swimlanes hinzufügen: "Swimlane hinzufügen" Button
   - Verbindungen: "Verbindung erstellen" → Startbox → Zielbox
   - Löschen: X-Button auf Box oder Swimlane

### 3. Verbindungen erstellen

1. "🔗 Verbindung erstellen" klicken
2. Auf Startbox klicken (wird blau markiert)
3. Auf Zielbox klicken
4. Label eingeben (z.B. "Ja", "Nein") → optional
5. Fertig!

### 4. Speichern

- **Im Browser speichern:** "💾 Speichern" Button
- **Als HTML exportieren:** "📥 Als HTML exportieren"
- **Drucken:** "🖨️ Drucken" (dann als PDF speichern)

### 5. Neuen Prozess erstellen

1. Auf Startseite: "➕ Neuen Prozess erstellen"
2. Titel bearbeiten
3. Swimlanes hinzufügen
4. Boxen platzieren
5. Verbindungen erstellen
6. Speichern

## 📐 Zeichenerklärung

Die Zeichenerklärung ist auf der Startseite sichtbar:

- **Gelbe Rechtecke:** Aktionen/Prozessschritte
- **Orange Rauten:** Entscheidungen (Ja/Nein)
- **Grüne abgerundete Rechtecke:** Dokumente
- **Blaue Ovale:** Start/Ende-Punkte
- **Weiße Rechtecke:** Teilprozesse
- **Lila Kreise:** Software-Unterstützung

## 🔧 Projektstruktur

```
prozess-editor-netlify/
├── index.html          # Startseite mit Master-Config
├── editor.html         # Editor-Seite
├── styles.css          # Alle Styles
├── data/
│   ├── processes.json   # Alle Prozesse (zentral, versionierbar)
│   └── empty-process.json # Template für neue Prozesse
├── process-data.js     # Fallback-Daten + EMPTY_PROCESS (für Offline/File-Mode)
├── editor.js           # Editor-Logik
├── netlify/
│   └── functions/
│       └── publish-process.js # "Veröffentlichen" → Commit ins Repo
├── netlify.toml        # Netlify-Konfiguration
└── README.md           # Diese Datei
```

## 💾 Datenspeicherung

- **Master-Config:** Im Browser localStorage
- **Prozess-Änderungen (Entwurf):** Im Browser localStorage (pro Gerät)
- **Prozess-Änderungen (zentral):** Button "🌍 Veröffentlichen" → Commit nach `data/processes.json` (GitHub) → Netlify deployt neu
- **Jeder Nutzer:** Hat seine eigenen Einstellungen
- **Export:** Als eigenständige HTML-Datei

### Netlify (für "Veröffentlichen")

In Netlify → Site settings → Environment variables:

- `GITHUB_OWNER` (z.B. `holgergrosser-hub`)
- `GITHUB_REPO` (z.B. `prozess`)
- `GITHUB_BRANCH` (optional, Default `main`)
- `GITHUB_DATA_PATH` (optional, Default `data/processes.json`)
- `GITHUB_TOKEN` (Fine-grained PAT mit **Contents: Read/Write** nur für dieses Repo)

Außerdem: Netlify → Identity aktivieren (Kunden-Login).

## 🌐 Nach dem Deployment

1. **URL öffnen** (z.B. `https://ihr-projekt.netlify.app`)
2. **Master-Einstellungen** konfigurieren
3. **Prozesse bearbeiten** nach Bedarf
4. **Neue Prozesse** erstellen
5. **Exportieren** und weitergeben

## 🎨 Anpassungen

### Firmenlogo ändern

In `index.html` und beim ersten Besuch in Master-Einstellungen.

### Prozess-Farben ändern

In `styles.css`:
```css
.box-action { background: #FFF9C4; }  /* Aktion - gelb */
.box-decision { background: #FFCC80; } /* Entscheidung - orange */
.box-document { background: #C8E6C9; } /* Dokument - grün */
```

### Eigene Domain

1. In Netlify: "Domain settings"
2. "Add custom domain"
3. z.B. `prozesse.nest-og.de`
4. DNS-Einträge anpassen

## ✅ Vorteile

- **Kostenlos hosten** auf Netlify
- **Keine Datenbank** nötig
- **Schnell** - statische Dateien
- **Überall erreichbar** via URL
- **Offline-fähig** nach einmaligem Laden
- **Alle Prozesse** aus PDF vorhanden
- **Voll editierbar** ohne Programmierkenntnisse

## 📞 Support

Bei Fragen einfach melden!

## 🔐 Datenschutz

- Entwürfe bleiben im Browser (localStorage)
- Beim „🌍 Veröffentlichen“ werden Prozessdaten zentral im GitHub-Repo als JSON gespeichert (Commit) und über Netlify ausgeliefert
- Kein Tracking
- HTTPS durch Netlify
