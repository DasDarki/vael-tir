<script setup lang="ts">
import {onMounted} from "vue";

definePage({
  meta: {
    parent: 'Varethis',
    title: 'Nebelviertel',
  }
})

onMounted(() => {
  const tooltip = document.getElementById('tooltip');
  const poiMarkers = document.querySelectorAll('.poi-marker');
  if (!tooltip) return;

  poiMarkers.forEach(marker => {
    if (!(marker instanceof HTMLElement)) return;

    marker.addEventListener('mouseenter', () => {
      const name = marker.dataset.name;
      const type = marker.dataset.type;
      const desc = marker.dataset.desc;

      tooltip.querySelector('h4')!.textContent = name!;
      tooltip.querySelector('.type')!.textContent = type!;
      tooltip.querySelector('p')!.textContent = desc!;
      tooltip.classList.add('visible');
    });

    marker.addEventListener('mousemove', (e) => {
      const x = e.clientX + 15;
      const y = e.clientY + 15;

      const rect = tooltip.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 20;
      const maxY = window.innerHeight - rect.height - 20;

      tooltip.style.left = Math.min(x, maxX) + 'px';
      tooltip.style.top = Math.min(y, maxY) + 'px';
    });

    marker.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });
});
</script>

<template>
  <div class="body">
    <header>
      <h1>DAS NEBELVIERTEL</h1>
      <p class="subtitle">Ein Bezirk der Flussmarken, Varethis</p>
    </header>

    <div class="map-container">
      <div class="map-frame">
        <svg class="district-map" viewBox="0 0 900 700" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="waterPattern" x="0" y="0" width="30" height="15" patternUnits="userSpaceOnUse">
              <path d="M0 7 Q7 3 15 7 T30 7" fill="none" stroke="#2a3a45" stroke-width="0.5" opacity="0.5"/>
            </pattern>

            <radialGradient id="fogGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#4a4a50;stop-opacity:0.4" />
              <stop offset="100%" style="stop-color:#3a3a40;stop-opacity:0" />
            </radialGradient>

            <radialGradient id="lightGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#d9a040;stop-opacity:0.4" />
              <stop offset="100%" style="stop-color:#c98030;stop-opacity:0" />
            </radialGradient>

            <filter id="buildingShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
            </filter>
          </defs>

          <rect x="0" y="0" width="900" height="700" fill="#0d0c0a"/>

          <path class="water" d="
                    M 0 520
                    C 100 510, 200 530, 350 525
                    C 500 520, 650 540, 800 530
                    L 900 535
                    L 900 700
                    L 0 700
                    Z
                "/>
          <path class="water-surface" d="
                    M 0 520
                    C 100 510, 200 530, 350 525
                    C 500 520, 650 540, 800 530
                    L 900 535
                    L 900 700
                    L 0 700
                    Z
                "/>

          <path class="water-edge" d="
                    M 0 520
                    C 100 510, 200 530, 350 525
                    C 500 520, 650 540, 800 530
                    L 900 535
                "/>

          <text x="450" y="620" class="label-water" text-anchor="middle">Südarm des Luminflusses</text>

          <path class="canal" d="
                    M 80 0
                    L 70 200
                    L 60 400
                    L 50 520
                " stroke-width="20"/>
          <text x="30" y="250" class="label-street" transform="rotate(-85, 30, 250)">Aschengraben</text>

          <path class="district-land" d="
                    M 80 0
                    L 850 0
                    L 850 80
                    L 870 80
                    L 870 530
                    L 800 530
                    C 650 540, 500 520, 350 525
                    C 200 530, 100 510, 50 520
                    L 60 400
                    L 70 200
                    L 80 0
                    Z
                "/>

          <path class="old-wall" d="
                    M 830 90
                    L 835 200
                    L 840 350
                    L 845 480
                "/>
          <path class="wall-ruin" d="
                    M 845 480
                    L 850 520
                "/>
          <text x="860" y="290" class="label-street" transform="rotate(88, 860, 290)">Alte Ufermauer</text>

          <rect x="120" y="30" width="150" height="80" class="building-block" rx="2"/>
          <rect x="290" y="25" width="200" height="90" class="building-block" rx="2"/>
          <rect x="510" y="30" width="140" height="75" class="building-block" rx="2"/>
          <rect x="670" y="35" width="130" height="70" class="building-block" rx="2"/>

          <rect x="100" y="150" width="120" height="100" class="building-block" rx="2"/>
          <rect x="100" y="280" width="100" height="120" class="building-block" rx="2"/>

          <rect x="280" y="160" width="100" height="80" class="building-block" rx="2"/>
          <rect x="280" y="270" width="90" height="100" class="building-block" rx="2"/>
          <rect x="400" y="150" width="130" height="90" class="building-block" rx="2"/>
          <rect x="400" y="280" width="120" height="110" class="building-block" rx="2"/>

          <rect x="560" y="155" width="110" height="85" class="building-block" rx="2"/>
          <rect x="560" y="275" width="100" height="100" class="building-block" rx="2"/>
          <rect x="700" y="150" width="100" height="120" class="building-block" rx="2"/>
          <rect x="700" y="300" width="110" height="90" class="building-block" rx="2"/>

          <rect x="120" y="430" width="140" height="70" class="building-block" rx="2"/>
          <rect x="300" y="420" width="120" height="85" class="building-block" rx="2"/>
          <rect x="460" y="415" width="100" height="90" class="building-block" rx="2"/>
          <rect x="600" y="410" width="130" height="95" class="building-block" rx="2"/>
          <rect x="760" y="400" width="60" height="110" class="building-block" rx="2"/>

          <path class="street-main" d="M 80 120 L 850 115"/>
          <text x="420" y="108" class="label-street" text-anchor="middle">Kettengasse</text>

          <path class="street-main" d="
                    M 500 120
                    C 480 180, 420 250, 380 320
                    C 340 390, 300 440, 280 510
                "/>
          <text x="450" y="350" class="label-street" transform="rotate(-50, 360, 350)">Nebelgasse</text>

          <path class="street-secondary" d="
                    M 380 320
                    L 500 380
                    L 580 450
                    L 620 520
                "/>
          <text x="470" y="420" class="label-street" transform="rotate(40, 520, 420)">Fischertreppe</text>

          <path class="street-secondary" d="M 240 120 L 260 400"/>
          <path class="street-secondary" d="M 550 120 L 570 400"/>
          <path class="street-secondary" d="M 720 120 L 740 400"/>

          <path class="street-secondary" d="M 100 250 L 800 260"/>
          <path class="street-secondary" d="M 100 400 L 780 410"/>

          <path class="street-alley" d="
                    M 230 250
                    C 250 280, 260 320, 240 360
                    C 220 400, 280 420, 320 400
                    C 360 380, 400 350, 450 380
                    C 500 410, 540 380, 580 400
                    L 700 390
                "/>
          <text x="400" y="385" class="label-street" text-anchor="middle" style="fill: #4a4035;">Schattenweg</text>

          <path class="street-alley" d="M 180 180 L 250 250"/>
          <path class="street-alley" d="M 400 260 L 450 320"/>
          <path class="street-alley" d="M 600 260 L 650 340"/>
          <path class="street-alley" d="M 300 400 L 350 480"/>

          <ellipse cx="200" cy="350" rx="100" ry="60" class="fog-patch"/>
          <ellipse cx="500" cy="200" rx="80" ry="50" class="fog-patch"/>
          <ellipse cx="700" cy="450" rx="90" ry="55" class="fog-patch"/>
          <ellipse cx="350" cy="480" rx="70" ry="40" class="fog-patch"/>

          <g class="poi-marker" data-name="Wachstube am Nebeltor" data-type="Luminare Garde" data-desc="Der lokale Posten der Garde. 1 Leutnant, 19 Gardisten. Das solideste Gebäude des Viertels.">
            <rect x="480" y="85" width="40" height="30" class="poi-guard" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="500" cy="75" r="12" fill="url(#lightGlow)"/>
            <circle cx="500" cy="75" r="3" class="light-point"/>
            <text x="500" y="130" class="label-location">Wachstube</text>
          </g>

          <g class="poi-marker" data-name="Der Nebelmarkt" data-type="Marktplatz" data-desc="Größter Markt außerhalb der Mauern. Täglich bis Mittag. Darunter der Graumarkt für weniger legale Waren." style="transform: translateX(50px)">
            <polygon points="380,290 420,280 440,310 410,340 370,330" class="poi-market" filter="url(#buildingShadow)"/>
            <circle cx="400" cy="305" r="15" fill="url(#lightGlow)"/>
            <circle cx="390" cy="300" r="2" class="light-point"/>
            <circle cx="410" cy="310" r="2" class="light-point"/>
            <circle cx="395" cy="320" r="2" class="light-point"/>
            <text x="405" y="360" class="label-location">Nebelmarkt</text>
          </g>

          <g class="poi-marker" data-name="Der Rostende Anker" data-type="Taverne" data-desc="Die älteste Taverne des Viertels. Besitzer: Aldric Kessler.">
            <rect x="355" y="300" width="35" height="45" class="poi-tavern" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="372" cy="290" r="12" fill="url(#lightGlow)"/>
            <circle cx="372" cy="290" r="3" class="light-point"/>
            <text x="372" y="360" class="label-location">Rostender Anker</text>
          </g>

          <g class="poi-marker" data-name="Kapelle der Stillen Flamme" data-type="Ferran-Orden" data-desc="Außenstelle des Ferran-Ordens. Seelsorge und Überwachung. 4 Ordensleute.">
            <polygon points="760,340 780,320 800,340 800,380 760,380" class="poi-chapel" filter="url(#buildingShadow)"/>
            <line x1="780" y1="310" x2="780" y2="295" stroke="#5a5060" stroke-width="2"/>
            <circle cx="780" cy="330" r="10" fill="url(#lightGlow)" opacity="0.5"/>
            <text x="780" y="400" class="label-location">Kapelle</text>
          </g>

          <g class="poi-marker" data-name="Korvans Esse" data-type="Schmiede" data-desc="Die beste Schmiede des Viertels. Besitzer: Darvin Korvan. Treffpunkt für alle Seiten.">
            <rect x="700" y="280" width="30" height="35" class="poi-building" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="715" cy="270" r="10" fill="#c04020" opacity="0.2"/>
            <circle cx="715" cy="270" r="8" fill="url(#lightGlow)"/>
            <text x="715" y="330" class="label-location">Korvans Esse</text>
          </g>

          <g class="poi-marker" data-name="Das Knochenloch" data-type="Spelunke / Kampfring" data-desc="Illegale Kämpfe nach Einbruch der Dunkelheit. Betreiberin: Razhka 'Mutter Knochen'.">
            <rect x="580" y="460" width="45" height="35" class="poi-danger" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="602" cy="450" r="8" fill="url(#lightGlow)" opacity="0.4"/>
            <text x="602" y="510" class="label-location">Knochenloch</text>
          </g>

          <g class="poi-marker" data-name="Die Alte Mühle" data-type="Verlassen" data-desc="Verfallen und gemieden.">
            <rect x="90" y="460" width="40" height="50" class="poi-underground" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="130" cy="510" r="15" fill="none" stroke="#3a3530" stroke-width="2"/>
            <line x1="130" y1="450" x2="130" y2="520" stroke="#3a3530" stroke-width="2"/>
            <text x="110" y="450" class="label-location">Alte Mühle</text>
          </g>

          <g class="poi-marker" data-name="Anlegestellen" data-type="Hafen" data-desc="Kleine Anlegestellen für Fischerboote. Hier beginnt die Arbeit vor Sonnenaufgang.">
            <rect x="420" y="490" width="50" height="15" fill="#2a2520" stroke="#3a3530" rx="1"/>
            <rect x="500" y="495" width="40" height="12" fill="#2a2520" stroke="#3a3530" rx="1"/>
            <rect x="320" y="492" width="35" height="12" fill="#2a2520" stroke="#3a3530" rx="1"/>
            <text x="450" y="480" class="label-location" style="font-size: 8px;">Anlegestellen</text>
          </g>

          <g class="poi-marker" data-name="Niras Nähstube" data-type="Laden" data-desc="Offiziell: Nähbedarf. Besitzerin: Nira Dunkel (Elfe).">
            <rect x="270" y="350" width="25" height="30" class="poi-underground" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="282" cy="345" r="6" fill="url(#lightGlow)" opacity="0.3"/>
            <text x="282" y="395" class="label-location" style="font-size: 8px;">Niras Laden</text>
          </g>

          <g transform="translate(820, 50)">
            <text x="0" y="0" font-family="Cinzel" font-size="10" fill="#5a5040">→ Kettengasse</text>
            <text x="0" y="14" font-family="Crimson Text" font-size="8" fill="#4a4030" font-style="italic">zum Handelsring</text>
          </g>

          <g transform="translate(30, 500)">
            <text x="0" y="0" font-family="Crimson Text" font-size="8" fill="#4a4030" font-style="italic">← Rest der</text>
            <text x="0" y="12" font-family="Crimson Text" font-size="8" fill="#4a4030" font-style="italic">Flussmarken</text>
          </g>

          <g transform="translate(60, 60)">
            <circle cx="0" cy="0" r="25" fill="none" stroke="#2a2520" stroke-width="1"/>
            <polygon points="0,-20 -4,-5 0,-10 4,-5" fill="#7a6a58"/>
            <polygon points="0,20 -4,5 0,10 4,5" fill="#3a3530"/>
            <text x="0" y="-28" text-anchor="middle" font-family="Cinzel" font-size="8" fill="#7a6a58">N</text>
          </g>

          <g transform="translate(750, 680)">
            <rect x="0" y="0" width="80" height="4" fill="#3a3530"/>
            <rect x="0" y="0" width="40" height="4" fill="#6a5a48"/>
            <text x="0" y="15" font-family="Crimson Text" font-size="7" fill="#5a5040">0</text>
            <text x="40" y="15" font-family="Crimson Text" font-size="7" fill="#5a5040">500</text>
            <text x="80" y="15" font-family="Crimson Text" font-size="7" fill="#5a5040">1000 Fuß</text>
          </g>

          <g transform="translate(95, 435)" opacity="0.4">
            <path d="M 0,-8 A 8,8 0 1,1 -5,6" fill="none" stroke="#5a5048" stroke-width="1.5"/>
          </g>

        </svg>
      </div>

      <div class="legend">
        <div class="legend-section">
          <h3>Orte</h3>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="#3a3a40" stroke="#5a5a68" rx="2"/>
            </svg>
            <span>Luminare Garde</span>
          </div>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <polygon points="8,2 14,6 14,14 2,14 2,6" fill="#3a3540" stroke="#5a5060"/>
            </svg>
            <span>Ferran-Orden</span>
          </div>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="#5a4530" stroke="#8a6a40" rx="2"/>
            </svg>
            <span>Taverne</span>
          </div>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <polygon points="4,4 12,2 14,10 8,14 2,10" fill="#4a4030" stroke="#7a6a48"/>
            </svg>
            <span>Markt</span>
          </div>
        </div>

        <div class="legend-section">
          <h3>Besondere Orte</h3>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="#4a4035" stroke="#6a5a48" rx="2"/>
            </svg>
            <span>Handwerk / Gewerbe</span>
          </div>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" fill="#4a3030" stroke="#6a4040" rx="2"/>
            </svg>
            <span>Zwielichtiger Ort</span>
          </div>
        </div>

        <div class="legend-section">
          <h3>Wege</h3>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <line x1="0" y1="8" x2="16" y2="8" stroke="#2a2620" stroke-width="4"/>
            </svg>
            <span>Hauptstraße</span>
          </div>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <line x1="0" y1="8" x2="16" y2="8" stroke="#222018" stroke-width="2.5"/>
            </svg>
            <span>Nebenstraße</span>
          </div>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <line x1="0" y1="8" x2="16" y2="8" stroke="#1a1815" stroke-width="1.5" stroke-dasharray="4 2"/>
            </svg>
            <span>Gasse / Schattenweg</span>
          </div>
        </div>

        <div class="legend-section">
          <h3>Grenzen</h3>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <rect x="2" y="6" width="12" height="4" fill="#1a2228"/>
            </svg>
            <span>Fluss / Kanal</span>
          </div>
          <div class="legend-item">
            <svg class="legend-symbol" viewBox="0 0 16 16">
              <line x1="2" y1="8" x2="14" y2="8" stroke="#3a3530" stroke-width="3"/>
            </svg>
            <span>Alte Mauer</span>
          </div>
        </div>
      </div>

      <div class="info-panel">
        <h3>Das Nebelviertel</h3>
        <p>
          Ein Bezirk der Flussmarken im Südwesten von Varethis. Der Nebel, der vom Fluss aufsteigt
          und sich bis in den Vormittag in den engen Gassen hält, gab dem Viertel seinen Namen.
          Hier leben jene, die anderswo nicht willkommen sind – und hier findet, wer sucht,
          mehr als die Ordnung erlaubt.
        </p>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">~8.500</div>
            <div class="stat-label">Einwohner</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">0,3 mi²</div>
            <div class="stat-label">Fläche</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">72%</div>
            <div class="stat-label">Menschen</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">20</div>
            <div class="stat-label">Gardisten</div>
          </div>
        </div>
      </div>
    </div>

    <div class="tooltip" id="tooltip">
      <div class="type"></div>
      <h4></h4>
      <p></p>
    </div>
  </div>
</template>

<style scoped lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.body {
  background: #0a0908;
  min-height: 100vh;
  font-family: 'Crimson Text', Georgia, serif;
  color: #9a9080;
  overflow-x: hidden;
}

.body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(60, 55, 50, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(50, 50, 55, 0.2) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 50%, rgba(40, 40, 45, 0.1) 0%, transparent 60%);
  pointer-events: none;
  z-index: 1000;
  animation: fogDrift 20s ease-in-out infinite;
}

@keyframes fogDrift {
  0%, 100% { opacity: 0.7; transform: translateX(0); }
  50% { opacity: 0.9; transform: translateX(10px); }
}

.body::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.04;
  pointer-events: none;
  z-index: 1001;
}

header {
  text-align: center;
  padding: 2rem 1rem;
  background: linear-gradient(180deg, #000 0%, transparent 100%);
  position: relative;
  z-index: 10;
}

header::after {
  content: '─────────────────────────────';
  display: block;
  color: #3a3530;
  letter-spacing: 0.3em;
  margin-top: 1rem;
  opacity: 0.5;
}

h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 700;
  color: #c8b898;
  text-shadow: 0 2px 10px rgba(0,0,0,0.8);
  letter-spacing: 0.15em;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-style: italic;
  color: #6a6050;
  font-size: 1rem;
  letter-spacing: 0.1em;
}

.map-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  position: relative;
  z-index: 10;
}

.map-frame {
  background: linear-gradient(135deg, #1a1815 0%, #0f0e0c 50%, #1a1815 100%);
  border: 2px solid #2a2520;
  border-radius: 4px;
  padding: 0.5rem;
  box-shadow:
    inset 0 0 50px rgba(0,0,0,0.8),
    0 10px 40px rgba(0,0,0,0.9);
  position: relative;
}

.map-frame::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  border: 1px solid #252018;
  border-radius: 2px;
  pointer-events: none;
}

svg.district-map {
  width: 100%;
  height: auto;
  display: block;
  filter: saturate(0.8);
}

.water {
  fill: #1a2228;
}

.water-surface {
  fill: url(#waterPattern);
  opacity: 0.4;
}

.water-edge {
  fill: none;
  stroke: #2a3a40;
  stroke-width: 2;
}

.district-land {
  fill: #1c1a17;
}

.street-main {
  fill: none;
  stroke: #2a2620;
  stroke-width: 8;
  stroke-linecap: round;
}

.street-secondary {
  fill: none;
  stroke: #222018;
  stroke-width: 5;
  stroke-linecap: round;
}

.street-alley {
  fill: none;
  stroke: #1a1815;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 8 3;
}

.street-shadow {
  fill: none;
  stroke: #252220;
  stroke-width: 4;
  stroke-linecap: round;
  opacity: 0.5;
}

/* Buildings */
.building-block {
  fill: #151310;
  stroke: #252220;
  stroke-width: 1;
}

.building-important {
  fill: #1a1815;
  stroke: #3a3530;
  stroke-width: 1.5;
}

.poi-marker {
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.poi-marker:hover {
  filter: brightness(1.3);
}

.poi-building {
  fill: #4a4035;
  stroke: #6a5a48;
  stroke-width: 1.5;
}

.poi-tavern {
  fill: #5a4530;
  stroke: #8a6a40;
  stroke-width: 1.5;
}

.poi-chapel {
  fill: #3a3540;
  stroke: #5a5060;
  stroke-width: 1.5;
}

.poi-guard {
  fill: #3a3a40;
  stroke: #5a5a68;
  stroke-width: 1.5;
}

.poi-market {
  fill: #4a4030;
  stroke: #7a6a48;
  stroke-width: 1.5;
}

.poi-underground {
  fill: #2a2828;
  stroke: #4a4540;
  stroke-width: 1.5;
  opacity: 0.8;
}

.poi-danger {
  fill: #4a3030;
  stroke: #6a4040;
  stroke-width: 1.5;
}

.light-glow {
  fill: #c9a050;
  opacity: 0.15;
  filter: blur(8px);
}

.light-point {
  fill: #e8b860;
  opacity: 0.8;
}

.label-location {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 600;
  fill: #a89878;
  text-anchor: middle;
  pointer-events: none;
}

.label-street {
  font-family: 'Crimson Text', serif;
  font-size: 1.2rem;
  fill: #5a5040;
  font-style: italic;
  user-select: none;
}

.label-water {
  font-family: 'Crimson Text', serif;
  font-size: 11px;
  fill: #3a4a55;
  font-style: italic;
  letter-spacing: 0.2em;
}

.label-district {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  font-weight: 400;
  fill: #3a3530;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0.6;
}

.canal {
  fill: #152025;
  stroke: #1a2a30;
  stroke-width: 1;
}

.old-wall {
  fill: none;
  stroke: #3a3530;
  stroke-width: 4;
  stroke-linecap: square;
}

.wall-ruin {
  fill: none;
  stroke: #2a2520;
  stroke-width: 3;
  stroke-dasharray: 12 6;
}

.fog-patch {
  fill: url(#fogGradient);
  opacity: 0.3;
  pointer-events: none;
}

.tooltip {
  position: fixed;
  background: linear-gradient(135deg, #1a1815 0%, #0f0e0c 100%);
  border: 1px solid #3a3530;
  padding: 0.75rem 1rem;
  border-radius: 3px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 2000;
  max-width: 280px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.8);
}

.tooltip.visible {
  opacity: 1;
}

.tooltip h4 {
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  color: #c8b898;
  margin-bottom: 0.25rem;
}

.tooltip .type {
  font-size: 0.7rem;
  color: #5a5040;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.25rem;
}

.tooltip p {
  font-size: 0.8rem;
  color: #8a8070;
  line-height: 1.4;
}

.legend {
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #151310 0%, #0f0e0c 100%);
  border: 1px solid #252018;
  border-radius: 3px;
}

.legend-section h3 {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  color: #9a8a70;
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
  border-bottom: 1px solid #252018;
  padding-bottom: 0.3rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
  color: #7a7060;
}

.legend-symbol {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.info-panel {
  margin-top: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #151310 0%, #0f0e0c 100%);
  border: 1px solid #252018;
  border-radius: 3px;
}

.info-panel h3 {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  color: #a89878;
  margin-bottom: 0.75rem;
  letter-spacing: 0.1em;
}

.info-panel p {
  font-size: 0.85rem;
  line-height: 1.6;
  color: #7a7060;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.stat-item {
  text-align: center;
  padding: 0.5rem;
  background: rgba(0,0,0,0.3);
  border-radius: 2px;
}

.stat-value {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  color: #b8a888;
}

.stat-label {
  font-size: 0.7rem;
  color: #5a5040;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

footer {
  text-align: center;
  padding: 1.5rem;
  color: #4a4030;
  font-style: italic;
  font-size: 0.85rem;
}

footer::before {
  content: '─────────────────────────────';
  display: block;
  color: #252018;
  letter-spacing: 0.3em;
  margin-bottom: 1rem;
  opacity: 0.5;
}
</style>