# Jul Run

Ein kleines Browser-Spiel: Ein rotes Männchen rennt nach rechts durch eine verschneite Stadt,
springt über Häuser und sammelt Münzen. Nach jeder Runde kaufst du dir im Menü Upgrades.
Je länger du läufst, desto schneller wird es.

## Spielen

`index.html` im Browser öffnen (Doppelklick reicht). Es gibt nichts zu installieren, alles steckt in dieser einen Datei.

Zum Teilen kannst du das Repo über **GitHub Pages** veröffentlichen
(Settings → Pages → Branch auswählen). Dann läuft das Spiel auch auf dem Handy.

## Steuerung

| Aktion | Tastatur | Handy |
| --- | --- | --- |
| Springen | `Leertaste`, `↑` oder `W` | irgendwo tippen |
| Höher springen | Taste gedrückt halten | Finger liegen lassen |
| Schneller landen | `↓` oder `S` | – |
| Pause | `P` oder `Esc` | Pause-Knopf oben rechts |
| Ton an/aus | `M` | Lautsprecher-Knopf |

## Regeln

- Läufst du gegen eine Hauswand oder ein Dach, ist die Runde vorbei.
- Auf **Flachdächern** kannst du landen und weiterlaufen.
- Die gesammelten Münzen stehen oben links. Am Ende der Runde wandern sie in dein Konto.
- Alle 15 Sekunden kommt eine neue **Stufe**: Das Tempo steigt, und es wird langsam Nacht.
- Ganz hoch hängende Münzen erreichst du nur mit gehaltenem Sprung oder dem Doppelsprung.

## Upgrades

| Upgrade | Wirkung | Preise |
| --- | --- | --- |
| Sprungkraft | +6 % Sprungkraft pro Stufe | 25 · 60 · 130 · 260 · 480 |
| Doppelsprung | zweiter Sprung in der Luft, Stufe 2: dritter | 80 · 450 |
| Münzmagnet | zieht Münzen an, 3 bis 7 m Reichweite | 35 · 80 · 170 · 330 · 600 |
| Münzwert | jede Münze zählt ×2, ×3, ×4 | 100 · 300 · 800 |
| Schutzschild | fängt pro Runde einen Zusammenstoß ab (bis zu 3) | 120 · 350 · 900 |
| Glückstaler | mehr große Taler, die zehnfach zählen | 45 · 110 · 240 · 450 · 800 |

Münzen, Rekord und Upgrades werden im Browser gespeichert (`localStorage`) und bleiben nach dem Neuladen erhalten.
