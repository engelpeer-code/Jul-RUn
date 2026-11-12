# Jul Run

Ein kleines Browser-Spiel: Ein rotes Männchen rennt nach rechts durch eine verschneite Winterwelt,
springt über Häuser, rutscht unter Lichterketten durch und sammelt Münzen. Nach jeder Runde
kaufst du dir im Menü Upgrades und neues Aussehen. Je länger du läufst, desto schneller wird es.

## Spielen

`index.html` im Browser öffnen (Doppelklick reicht). Es muss nichts installiert werden.
Die Dateien in `js/` und `style.css` müssen neben `index.html` liegen.

Zum Teilen kannst du das Repo über **GitHub Pages** veröffentlichen
(Settings → Pages → Branch auswählen). Dann läuft das Spiel auch auf dem Handy.

## Steuerung

| Aktion | Tastatur | Handy | Gamepad |
| --- | --- | --- | --- |
| Springen | `Leertaste`, `↑`, `W` | irgendwo tippen | `A` oder Steuerkreuz hoch |
| Höher springen / Fallschirm | Taste halten | Finger liegen lassen | `A` halten |
| Rutschen (am Boden) | `↓`, `S` halten | Rutsch-Knopf unten rechts | `B` oder Steuerkreuz runter |
| Schneller landen (in der Luft) | `↓`, `S` | Rutsch-Knopf | `B` |
| Pause | `P`, `Esc` | Pause-Knopf | `Start` |
| Ton an/aus | `M` | Lautsprecher-Knopf | – |

## Die Welt

Die Strecke führt durch vier Gegenden mit eigenen Hindernissen:

| Gegend | ab | Hindernisse |
| --- | --- | --- |
| Altstadt | 0 m | Häuser, Flachdächer, Lichterketten, Schneemänner, Hochhäuser* |
| Weihnachtsmarkt | 600 m | Marktbuden, Stadttore, Lichterketten |
| Winterwald | 1.300 m | Tannen, Holzhütten, Schneemänner, Eislöcher |
| Berge | 2.200 m | Felsen, Hütten, Eislöcher, Tannen |

\* Hochhäuser tauchen erst auf, wenn du den Doppelsprung hast.

- Auf **Flachdächern, Hochhäusern, Felsen und Stadttoren** kannst du landen.
- Unter **Lichterketten** und **Stadttoren** rutschst du durch.
- Ins **Eisloch** zu fallen beendet die Runde.
- Alle 15 Sekunden kommt eine neue **Stufe**: Das Tempo steigt, und es wird langsam Nacht.
- Eine **Rekord-Fahne** zeigt, wo dein bisher bester Lauf endete.

## Münzen, Combo und Power-ups

- **Combo:** Sammelst du Münzen ohne eine zu verpassen, steigt der Multiplikator
  (ab 10 Münzen ×2, ab 25 ×3, ab 45 ×4, ab 70 ×5). Eine verpasste Münze setzt ihn zurück.
- **Glückstaler** zählen zehnfach.
- **Der Schlitten** fliegt ab und zu über die Stadt und wirft Geschenke ab (je 8 Münzen).
- **Power-ups** zum Einsammeln:
  - Raketenstiefel: ein paar Sekunden über alles hinwegfliegen
  - Zuckerstange: kurz unverwundbar, Hindernisse zerplatzen
  - Münzregen: alle Münzen in Sicht werden Glückstaler
  - Schneeflocke: Zeitlupe
- **Wiederbeleben:** Einmal pro Runde kannst du nach einem Zusammenstoß für Münzen weiterlaufen.

## Upgrades

| Upgrade | Wirkung | Preise |
| --- | --- | --- |
| Sprungkraft | +6 % Sprungkraft pro Stufe | 25 · 60 · 130 · 260 · 480 |
| Doppelsprung | zweiter Sprung in der Luft, Stufe 2: dritter | 80 · 450 |
| Münzmagnet | zieht Münzen an, 3 bis 7 m Reichweite | 35 · 80 · 170 · 330 · 600 |
| Münzwert | jede Münze zählt ×2, ×3, ×4 | 100 · 300 · 800 |
| Schutzschild | fängt pro Runde einen Zusammenstoß ab (bis zu 3) | 120 · 350 · 900 |
| Glückstaler | mehr große Taler, die zehnfach zählen | 45 · 110 · 240 · 450 · 800 |
| Startrakete | Raketenflug über die ersten 100 / 200 / 300 m | 150 · 400 · 900 |
| Fallschirm | Sprung halten bremst den Fall | 90 · 220 · 450 |
| Power-up-Profi | Power-ups öfter und 25 % länger pro Stufe | 70 · 180 · 380 · 700 |

## Menü

- **Aussehen:** Bommelmütze, Rentiergeweih, Krone, Schals, Winterstiefel, goldene Schuhe (nur Optik).
- **Aufgaben:** immer drei aktive Aufgaben, jede bringt Münzen und wird durch eine schwerere ersetzt.
- **Abzeichen:** 14 Meilensteine, zum Beispiel 1.000 m, Combo ×5 oder alle Gegenden.
- **Bestenliste:** deine fünf besten Läufe. Läuft das Spiel als geteilte Seite in Claude,
  gibt es zusätzlich eine gemeinsame Liste mit allen, die mitspielen.
- **Einstellungen:** Musik, Soundeffekte und ein Leicht-Modus (langsamer, ein Schild extra) für Kinder.

Spielstand, Upgrades, Aussehen, Aufgaben und Abzeichen werden im Browser gespeichert (`localStorage`).

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Seite, HUD und Menüs |
| `style.css` | Gestaltung |
| `js/data.js` | Spielwerte, Upgrades, Aussehen, Aufgaben, Abzeichen, Gegenden, Spielstand |
| `js/audio.js` | Soundeffekte und Musik |
| `js/world.js` | Hindernisse, Münzen, Power-ups, Schlitten, Kollision |
| `js/draw-scene.js` | Himmel, Hintergründe, Boden, Hindernisse zeichnen |
| `js/draw-actors.js` | Männchen, Münzen, Effekte, Gesamtbild |
| `js/menu.js` | Menü-Reiter, Laden, Bestenliste, Wiederbeleben |
| `js/game.js` | Physik, Eingaben, HUD, Hauptschleife |
