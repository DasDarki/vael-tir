<script setup lang="ts">
import { onMounted } from "vue";

definePage({
  meta: {
    parent: 'Varethis',
    title: '- Stadtplan',
  }
})

type PoiEl = HTMLElement & {
  dataset: {
    name?: string;
    type?: string;
    desc?: string;
  };
};

onMounted(() => {
  const tooltip = document.getElementById("tooltip");
  const poiMarkers = document.querySelectorAll(".poi-marker");
  if (!tooltip) return;

  const titleEl = tooltip.querySelector("h4");
  const typeEl = tooltip.querySelector(".type");
  const descEl = tooltip.querySelector("p");

  poiMarkers.forEach((marker) => {
    if (!(marker instanceof HTMLElement)) return;
    const el = marker as PoiEl;

    el.addEventListener("mouseenter", () => {
      const name = el.dataset.name ?? "";
      const type = el.dataset.type ?? "";
      const desc = el.dataset.desc ?? "";

      if (titleEl) titleEl.textContent = name;
      if (typeEl) typeEl.textContent = type;
      if (descEl) descEl.textContent = desc;

      tooltip.classList.add("visible");
    });

    el.addEventListener("mousemove", (e: MouseEvent) => {
      const x = e.clientX + 15;
      const y = e.clientY + 15;

      const rect = tooltip.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 20;
      const maxY = window.innerHeight - rect.height - 20;

      tooltip.style.left = Math.min(x, maxX) + "px";
      tooltip.style.top = Math.min(y, maxY) + "px";
    });

    el.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible");
    });
  });
});
</script>

<template>
  <div class="body">
    <header>
      <h1>VARETHIS</h1>
      <p class="subtitle">Hauptstadt im Delta des Luminflusses — Kernland der Ordnung</p>
    </header>

    <div class="map-container">
      <div class="map-frame">
        <svg class="city-map" viewBox="0 0 1100 780" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- Papier / Körnung -->
            <filter id="paperNoise" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.08 0" />
            </filter>

            <pattern id="waterPattern" x="0" y="0" width="28" height="14" patternUnits="userSpaceOnUse">
              <path d="M0 7 Q7 3 14 7 T28 7" fill="none" stroke="#2a3a45" stroke-width="0.6" opacity="0.55"/>
            </pattern>

            <linearGradient id="waterGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#121a1f" stop-opacity="1"/>
              <stop offset="100%" stop-color="#0e1418" stop-opacity="1"/>
            </linearGradient>

            <radialGradient id="fogGradient" cx="50%" cy="50%" r="55%">
              <stop offset="0%" style="stop-color:#4a4a50;stop-opacity:0.38" />
              <stop offset="100%" style="stop-color:#3a3a40;stop-opacity:0" />
            </radialGradient>

            <radialGradient id="lightGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#d9a040;stop-opacity:0.45" />
              <stop offset="100%" style="stop-color:#c98030;stop-opacity:0" />
            </radialGradient>

            <filter id="buildingShadow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.55"/>
            </filter>
          </defs>

          <rect x="0" y="0" width="1100" height="780" class="bg"/>
          <rect x="0" y="0" width="1100" height="780" filter="url(#paperNoise)" opacity="0.9"/>

          <!-- Wasser: Delta-Arme -->
          <g>
            <path class="water" d="M 0 640 C 200 600, 360 660, 520 640 C 700 618, 860 655, 1100 635 L 1100 780 L 0 780 Z"/>
            <path class="water-surface" d="M 0 640 C 200 600, 360 660, 520 640 C 700 618, 860 655, 1100 635 L 1100 780 L 0 780 Z"/>
            <path class="water-edge" d="M 0 640 C 200 600, 360 660, 520 640 C 700 618, 860 655, 1100 635"/>

            <path class="river-arm" d="M 560 0 C 530 110, 560 210, 540 300 C 520 385, 470 455, 440 520 C 410 585, 380 615, 340 650" />
            <path class="river-arm" d="M 620 0 C 650 120, 625 215, 650 305 C 675 395, 740 465, 790 540 C 845 620, 880 645, 920 660" />
            <path class="river-arm" d="M 590 0 C 585 125, 600 235, 590 330 C 580 420, 585 490, 590 540 C 595 605, 600 625, 610 655" />

            <path class="river-arm-surface" d="M 560 0 C 530 110, 560 210, 540 300 C 520 385, 470 455, 440 520 C 410 585, 380 615, 340 650" />
            <path class="river-arm-surface" d="M 620 0 C 650 120, 625 215, 650 305 C 675 395, 740 465, 790 540 C 845 620, 880 645, 920 660" />
            <path class="river-arm-surface" d="M 590 0 C 585 125, 600 235, 590 330 C 580 420, 585 490, 590 540 C 595 605, 600 625, 610 655" />

            <text x="820" y="760" class="label-water" text-anchor="middle">SÜDARM DES LUMINFLUSSES</text>
          </g>

          <!-- Stadtgrund (Land) -->
          <path class="land" d="
            M 110 90
            C 280 30, 500 40, 660 55
            C 830 70, 980 140, 1030 240
            C 1080 340, 1040 470, 980 545
            C 930 605, 860 640, 760 660
            C 650 682, 520 690, 400 675
            C 275 660, 180 620, 130 540
            C 70 440, 60 320, 90 220
            C 105 165, 110 125, 110 90
            Z
          "/>

          <!-- Außenzone / Felder / Dörfer (Außenmarken) -->
          <path class="outer-land" d="
            M 70 520
            C 20 430, 10 330, 35 240
            C 70 120, 170 55, 320 20
            C 510 -20, 790 10, 950 95
            C 1090 175, 1120 320, 1080 470
            C 1040 625, 880 735, 650 760
            C 410 785, 205 740, 115 635
            C 95 612, 82 575, 70 520
            Z
          "/>

          <!-- Mauern (Hauptmauer + Vorwerke) -->
          <path class="wall-main" d="
            M 200 175
            C 330 120, 520 115, 680 130
            C 835 145, 940 220, 965 310
            C 992 410, 930 510, 830 565
            C 730 620, 575 640, 440 625
            C 300 608, 225 540, 205 460
            C 182 366, 170 240, 200 175
            Z
          "/>

          <path class="wall-gate" d="M 960 310 L 1010 312"/>
          <path class="wall-gate" d="M 200 460 L 150 495"/>
          <path class="wall-gate" d="M 525 130 L 525 85"/>

          <text x="980" y="300" class="label-street" transform="rotate(2, 980, 300)">OSTTOR</text>
          <text x="118" y="520" class="label-street" transform="rotate(-35, 118, 520)">SÜDTOR</text>
          <text x="510" y="70" class="label-street" text-anchor="middle">NORDTOR</text>

          <!-- Stadtteile: farbige Hinterlegung (innerhalb/außerhalb Mauern) -->
          <!-- Lichtring (Zentrum) -->
          <path class="zone-lichtring" d="
            M 470 235
            C 525 205, 610 205, 665 235
            C 720 265, 720 325, 665 355
            C 610 385, 525 385, 470 355
            C 415 325, 415 265, 470 235
            Z
          "/>
          <text x="570" y="300" class="district-label" text-anchor="middle">DER LICHTRING</text>

          <!-- Ordenshallen (Nordost) -->
          <path class="zone-ordenshallen" d="
            M 660 150
            C 760 155, 855 215, 885 290
            C 910 350, 885 425, 825 450
            C 745 485, 665 455, 625 405
            C 595 365, 600 300, 615 260
            C 630 220, 610 145, 660 150
            Z
          "/>
          <text x="760" y="315" class="district-label" text-anchor="middle">DIE ORDENSALLEN</text>

          <!-- Handelsring (West & Süd) -->
          <path class="zone-handelsring" d="
            M 230 260
            C 285 205, 390 170, 470 185
            C 520 195, 560 215, 585 250
            C 612 290, 602 350, 575 385
            C 545 425, 495 452, 430 470
            C 340 495, 270 470, 235 420
            C 200 370, 195 305, 230 260
            Z
          "/>
          <text x="385" y="345" class="district-label" text-anchor="middle">DER HANDELSRING</text>

          <!-- Flussmarken (entlang der Arme; auch außerhalb der Mauern) -->
          <path class="zone-flussmarken" d="
            M 360 470
            C 410 440, 465 425, 520 430
            C 575 435, 615 455, 650 490
            C 690 530, 700 575, 680 615
            C 645 685, 520 720, 405 675
            C 320 640, 295 585, 305 540
            C 315 495, 330 490, 360 470
            Z
          "/>
          <text x="510" y="600" class="district-label" text-anchor="middle">DIE FLUSSMARKEN</text>

          <!-- Nebelviertel (Teil der Flussmarken, außerhalb & an Südwest-Arm) -->
          <path class="zone-nebelviertel" d="
            M 260 560
            C 290 530, 330 520, 365 530
            C 405 542, 420 575, 410 610
            C 395 665, 320 690, 265 655
            C 230 632, 225 590, 260 560
            Z
          "/>
          <text x="315" y="625" class="district-label" text-anchor="middle" style="opacity:0.7;">NEBELVIERTEL</text>

          <!-- Außenmarken (außerhalb der Mauern) -->
          <path class="zone-aussenmarken" d="
            M 120 610
            C 70 520, 70 395, 105 275
            C 140 160, 240 80, 405 55
            C 565 32, 780 55, 930 125
            C 1045 180, 1070 320, 1035 450
            C 1000 575, 880 685, 660 710
            C 470 732, 265 708, 175 650
            C 145 630, 135 625, 120 610
            Z
          "/>
          <text x="890" y="175" class="district-label" text-anchor="middle" style="opacity:0.6;">DIE AUßENMARKEN</text>

          <!-- Straßennetz -->
          <!-- Kronwege -->
          <path class="road-crown" d="M 570 300 C 430 280, 315 250, 210 210" />
          <text x="305" y="235" class="label-street" transform="rotate(-12, 305, 235)">VARETHISCHER KRONWEG</text>

          <path class="road-crown" d="M 585 305 C 700 290, 820 300, 980 312" />
          <text x="825" y="285" class="label-street" text-anchor="middle">HELIORISCHER KRONWEG</text>

          <path class="road-crown" d="M 570 270 C 560 220, 545 170, 525 110" />
          <text x="485" y="135" class="label-street" transform="rotate(-78, 485, 135)">NORDWEG</text>

          <!-- Handelswege (zweite Ordnung) -->
          <path class="road-trade" d="M 420 360 C 360 380, 300 420, 250 480" />
          <path class="road-trade" d="M 640 365 C 690 405, 750 455, 825 520" />
          <path class="road-trade" d="M 520 445 C 520 520, 520 585, 520 655" />
          <path class="road-trade" d="M 365 300 C 300 295, 240 305, 175 330" />

          <!-- Waldwege/Trampelpfade (nur angedeutet) -->
          <path class="road-path" d="M 175 650 C 205 620, 235 600, 265 585" />
          <path class="road-path" d="M 920 125 C 900 155, 885 185, 870 220" />

          <!-- Lichtobelisken (Marken am Kronweg) -->
          <g class="obelisks">
            <g transform="translate(465, 286)">
              <rect x="-3" y="-10" width="6" height="14" class="obelisk"/>
              <circle cx="0" cy="-12" r="6" fill="url(#lightGlow)"/>
              <circle cx="0" cy="-12" r="2.2" class="light-point"/>
            </g>
            <g transform="translate(350, 260)">
              <rect x="-3" y="-10" width="6" height="14" class="obelisk"/>
              <circle cx="0" cy="-12" r="6" fill="url(#lightGlow)"/>
              <circle cx="0" cy="-12" r="2.2" class="light-point"/>
            </g>
            <g transform="translate(735, 295)">
              <rect x="-3" y="-10" width="6" height="14" class="obelisk"/>
              <circle cx="0" cy="-12" r="6" fill="url(#lightGlow)"/>
              <circle cx="0" cy="-12" r="2.2" class="light-point"/>
            </g>
          </g>

          <!-- Gebäudemassen (Blockstruktur, stilisiert) -->
          <g class="blocks" opacity="0.95">
            <!-- Handelsring -->
            <rect x="260" y="250" width="110" height="70" class="block" rx="2"/>
            <rect x="290" y="335" width="120" height="85" class="block" rx="2"/>
            <rect x="380" y="260" width="95" height="65" class="block" rx="2"/>
            <rect x="430" y="340" width="130" height="95" class="block" rx="2"/>

            <!-- Lichtring -->
            <rect x="505" y="245" width="90" height="65" class="block-important" rx="2"/>
            <rect x="610" y="255" width="75" height="55" class="block-important" rx="2"/>
            <rect x="535" y="325" width="120" height="70" class="block-important" rx="2"/>

            <!-- Ordenshallen -->
            <rect x="690" y="210" width="120" height="85" class="block" rx="2"/>
            <rect x="820" y="255" width="75" height="105" class="block" rx="2"/>
            <rect x="695" y="315" width="105" height="85" class="block" rx="2"/>

            <!-- Flussmarken -->
            <rect x="430" y="505" width="120" height="80" class="block" rx="2"/>
            <rect x="570" y="505" width="140" height="95" class="block" rx="2"/>
            <rect x="395" y="595" width="110" height="70" class="block" rx="2"/>
            <rect x="540" y="615" width="130" height="60" class="block" rx="2"/>

            <!-- Nebelviertel -->
            <rect x="245" y="570" width="105" height="75" class="block-dim" rx="2"/>
            <rect x="310" y="610" width="90" height="60" class="block-dim" rx="2"/>
          </g>

          <!-- Nebelflecken in den Flussmarken -->
          <ellipse cx="340" cy="610" rx="120" ry="65" class="fog-patch"/>
          <ellipse cx="520" cy="560" rx="110" ry="70" class="fog-patch"/>
          <ellipse cx="650" cy="585" rx="120" ry="65" class="fog-patch"/>

          <!-- POIs (hover tooltip) -->
          <!-- Lichtring: Palast, Hohe Kammer, Arkanum, Ferran-Bürokratie HQ -->
          <g class="poi-marker" data-name="Palast des Regenten" data-type="Machtzentrum" data-desc="Weißer Marmorkomplex im Herzen des Lichtrings. Zugang nur mit Genehmigung und Begleitung."
             transform="translate(550, 285)">
            <rect x="-18" y="-14" width="36" height="28" class="poi-royal" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="0" cy="-24" r="12" fill="url(#lightGlow)"/>
            <circle cx="0" cy="-24" r="3" class="light-point"/>
            <text x="0" y="28" class="label-location">PALAST</text>
          </g>

          <g class="poi-marker" data-name="Sitz der Hohen Kammer" data-type="Verwaltung" data-desc="Regierungsrat und Protokoll. Entscheidungen, die später als ‚Wahrheit‘ archiviert werden."
             transform="translate(640, 285)">
            <rect x="-16" y="-12" width="32" height="24" class="poi-admin" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="0" cy="-22" r="11" fill="url(#lightGlow)"/>
            <circle cx="0" cy="-22" r="3" class="light-point"/>
            <text x="0" y="26" class="label-location">KAMMER</text>
          </g>

          <g class="poi-marker" data-name="Das Arkanum" data-type="Arkanum" data-desc="Registratur, Genehmigungen und Kontrolle magischer Praxis. Viele Türen, wenige Antworten."
             transform="translate(585, 350)">
            <polygon points="-18,10 0,-14 18,10 18,24 -18,24" class="poi-arcane" filter="url(#buildingShadow)"/>
            <circle cx="0" cy="-24" r="11" fill="url(#lightGlow)"/>
            <circle cx="0" cy="-24" r="3" class="light-point"/>
            <text x="0" y="38" class="label-location">ARKANUM</text>
          </g>

          <g class="poi-marker" data-name="Bürokratisches Hauptquartier des Ferran-Ordens" data-type="Ferran-Orden" data-desc="Formulare, Siegel, Überwachung. Offiziell ‚Sachverwaltung‘ — tatsächlich das ruhige Herz der Härte."
             transform="translate(525, 350)">
            <rect x="-16" y="-12" width="32" height="24" class="poi-ferran" filter="url(#buildingShadow)" rx="2"/>
            <line x1="-10" y1="-16" x2="-10" y2="-28" stroke="#5a5060" stroke-width="2"/>
            <circle cx="-10" cy="-30" r="8" fill="url(#lightGlow)" opacity="0.45"/>
            <text x="0" y="38" class="label-location">FERRAN</text>
          </g>

          <!-- Ordenshallen: Graue Türme (Verhörzentrum), Garde HQ -->
          <g class="poi-marker" data-name="Hauptquartier der Luminaren Garde" data-type="Luminare Garde" data-desc="Kasernen, Archive, Ausbildung. Hier lernen Offiziere, wie man Ordnung liest und schreibt."
             transform="translate(760, 270)">
            <rect x="-18" y="-14" width="36" height="28" class="poi-guard" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="0" cy="-24" r="12" fill="url(#lightGlow)"/>
            <circle cx="0" cy="-24" r="3" class="light-point"/>
            <text x="0" y="28" class="label-location">GARDE</text>
          </g>

          <g class="poi-marker" data-name="Die Grauen Türme" data-type="Verhörzentrum" data-desc="Gefürchtet. Wer hier hinein geht, verlässt den Ort selten als derselbe Mensch."
             transform="translate(840, 320)">
            <rect x="-10" y="-30" width="10" height="50" class="poi-tower" filter="url(#buildingShadow)" rx="1"/>
            <rect x="2" y="-36" width="10" height="56" class="poi-tower" filter="url(#buildingShadow)" rx="1"/>
            <circle cx="0" cy="-45" r="12" fill="url(#lightGlow)" opacity="0.35"/>
            <text x="0" y="34" class="label-location">GRAUE TÜRME</text>
          </g>

          <!-- Handelsring: Markt der Gilden, Archiv der Wahrheit, Verbrannte Bibliothek -->
          <g class="poi-marker" data-name="Markt der Gilden" data-type="Marktplatz" data-desc="Größter Handelsplatz der Stadt. Preise steigen, Gerüchte fallen — und alles wird beobachtet."
             transform="translate(405, 360)">
            <polygon points="-22,0 0,-16 22,0 10,24 -10,24" class="poi-market" filter="url(#buildingShadow)"/>
            <circle cx="0" cy="-28" r="12" fill="url(#lightGlow)"/>
            <circle cx="-7" cy="-29" r="2.2" class="light-point"/>
            <circle cx="7" cy="-27" r="2.2" class="light-point"/>
            <text x="0" y="40" class="label-location">GILDENMARKT</text>
          </g>

          <g class="poi-marker" data-name="Archiv der Wahrheit" data-type="Archiv" data-desc="Hier liegen Protokolle, Urteile und ‚bereinigte‘ Chroniken. Papier ist die leiseste Waffe."
             transform="translate(340, 300)">
            <rect x="-18" y="-14" width="36" height="28" class="poi-archive" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="0" cy="-24" r="11" fill="url(#lightGlow)" opacity="0.35"/>
            <text x="0" y="28" class="label-location">ARCHIV</text>
          </g>

          <g class="poi-marker" data-name="Die Verbrannte Bibliothek" data-type="Ruine" data-desc="Mahnmal gegen ‚ketzerisches Wissen‘. Im Osten des Handelsrings — geschwärzte Steine, stille Luft."
             transform="translate(560, 430)">
            <rect x="-18" y="-12" width="36" height="24" class="poi-ruin" filter="url(#buildingShadow)" rx="2"/>
            <path d="M -18 12 L 18 12" stroke="#3a3530" stroke-width="2" opacity="0.8"/>
            <text x="0" y="34" class="label-location">BIBLIOTHEK</text>
          </g>

          <!-- Flussmarken: Nebelviertel (POI), Anlegestellen -->
          <g class="poi-marker" data-name="Das Nebelviertel" data-type="Flussmarken" data-desc="Südwestlich am trägen Arm. Morgennebel, enge Gassen, Arbeiter und Außenseiter — und Dinge, die nicht registriert werden."
             transform="translate(300, 610)">
            <rect x="-18" y="-14" width="36" height="28" class="poi-underground" filter="url(#buildingShadow)" rx="2"/>
            <circle cx="0" cy="-24" r="12" fill="url(#lightGlow)" opacity="0.28"/>
            <circle cx="0" cy="-24" r="2.6" class="light-point" opacity="0.55"/>
            <text x="0" y="30" class="label-location">NEBELVIERTEL</text>
          </g>

          <g class="poi-marker" data-name="Anlegestellen der Flussmarken" data-type="Hafen / Arbeit" data-desc="Kleine Stege für Fischerboote und Lastkähne. Hier beginnt der Tag vor dem ersten Glockenschlag."
             transform="translate(620, 640)">
            <rect x="-28" y="-6" width="56" height="12" class="poi-dock" rx="2"/>
            <rect x="-10" y="-18" width="20" height="8" class="poi-dock" rx="2" opacity="0.9"/>
            <text x="0" y="26" class="label-location">ANLEGESTELLEN</text>
          </g>

          <!-- Außenmarken: Signalturm, Bauernhof -->
          <g class="poi-marker" data-name="Signalturm von Horathen" data-type="Außenmarken" data-desc="Ein Turm, der mehr sieht als er sagt. Feuerzeichen bei Nacht — und Augen bei Tag."
             transform="translate(220, 665)">
            <rect x="-8" y="-26" width="16" height="44" class="poi-tower" filter="url(#buildingShadow)" rx="1"/>
            <circle cx="0" cy="-36" r="10" fill="url(#lightGlow)" opacity="0.25"/>
            <text x="0" y="28" class="label-location">SIGNALTURM</text>
          </g>

          <g class="poi-marker" data-name="Außenhof der Versorgung" data-type="Außenmarken" data-desc="Ställe, Korn und Wagen. Alles, was die Stadt nährt — und alles, was kontrolliert werden kann."
             transform="translate(920, 560)">
            <rect x="-18" y="-12" width="36" height="24" class="poi-farm" filter="url(#buildingShadow)" rx="2"/>
            <text x="0" y="30" class="label-location">VERSORGUNG</text>
          </g>

          <!-- Kompass / Maßstab -->
          <g transform="translate(85, 95)">
            <circle cx="0" cy="0" r="28" fill="none" stroke="#2a2520" stroke-width="1"/>
            <polygon points="0,-22 -5,-6 0,-12 5,-6" fill="#7a6a58"/>
            <polygon points="0,22 -5,6 0,12 5,6" fill="#3a3530"/>
            <text x="0" y="-34" text-anchor="middle" font-family="Cinzel" font-size="10" fill="#7a6a58">N</text>
          </g>

          <g transform="translate(910, 740)">
            <rect x="0" y="0" width="140" height="5" fill="#2a2520"/>
            <rect x="0" y="0" width="70" height="5" fill="#6a5a48"/>
            <text x="0" y="18" class="scale-text">0</text>
            <text x="70" y="18" class="scale-text">500</text>
            <text x="140" y="18" class="scale-text">1000 SCHRITTE</text>
          </g>

          <!-- Kartentitel im Bild -->
          <text x="550" y="48" class="map-title" text-anchor="middle">STADTPLAN VON VARETHIS</text>
        </svg>
      </div>

      <div class="legend">
        <div class="legend-section">
          <h3>Stadtteile</h3>
          <div class="legend-item"><span class="chip lichtring"></span><span>Lichtring (Palast, Hohe Kammer, Arkanum, Ferran-Bürokratie)</span></div>
          <div class="legend-item"><span class="chip ordenshallen"></span><span>Ordenshallen (Garde, Kasernen, Graue Türme)</span></div>
          <div class="legend-item"><span class="chip handelsring"></span><span>Handelsring (Gilden, Kontore, Märkte)</span></div>
          <div class="legend-item"><span class="chip flussmarken"></span><span>Flussmarken (entlang der Arme, auch außerhalb der Mauern)</span></div>
          <div class="legend-item"><span class="chip nebelviertel"></span><span>Nebelviertel (Teil der Flussmarken)</span></div>
          <div class="legend-item"><span class="chip aussenmarken"></span><span>Außenmarken (Höfe, Siedlungen, Versorgung)</span></div>
        </div>

        <div class="legend-section">
          <h3>Wege</h3>
          <div class="legend-item"><span class="line crown"></span><span>Kronweg</span></div>
          <div class="legend-item"><span class="line trade"></span><span>Handelsweg</span></div>
          <div class="legend-item"><span class="line path"></span><span>Trampelpfad</span></div>
          <div class="legend-item"><span class="dot"></span><span>Lichtobelisk</span></div>
        </div>

        <div class="legend-section">
          <h3>Orte</h3>
          <div class="legend-item"><span class="poi-swatch royal"></span><span>Machtzentrum</span></div>
          <div class="legend-item"><span class="poi-swatch guard"></span><span>Luminare Garde HQ</span></div>
          <div class="legend-item"><span class="poi-swatch ferran"></span><span>Ferran-Orden HQ</span></div>
          <div class="legend-item"><span class="poi-swatch market"></span><span>Markt / Gilden</span></div>
          <div class="legend-item"><span class="poi-swatch arcane"></span><span>Arkanum</span></div>
        </div>
      </div>

      <div class="info-panel">
        <h3>Varethis: Ordnung im Delta</h3>
        <p>
          Die Stadt liegt auf und zwischen den Armen des Luminflusses. Die Mauern sind massiv, die Brücken
          strategisch, und jedes Viertel hat seine Rolle: Glanz im Zentrum, Ketten aus Papier in den Ämtern,
          Stahl in den Ordenshallen — und Nebel in den Flussmarken.
        </p>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">3</div>
            <div class="stat-label">Flussarme</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">3</div>
            <div class="stat-label">Große Brücken</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">5</div>
            <div class="stat-label">Hauptzonen</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">●</div>
            <div class="stat-label">Lichtobelisken</div>
          </div>
        </div>
      </div>

      <div class="tooltip" id="tooltip">
        <div class="type"></div>
        <h4></h4>
        <p></p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* =========
   RESET / BASE
   ========= */
* { margin: 0; padding: 0; box-sizing: border-box; }

.body {
  background: #0a0908;
  min-height: 100vh;
  font-family: 'Crimson Text', Georgia, serif;
  color: #9a9080;
  overflow-x: hidden;
  position: relative;
}

/* atmosphärische Körnung + Nebeldrift wie beim Nebelviertel */
.body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 25% 20%, rgba(60, 55, 50, 0.16) 0%, transparent 55%),
    radial-gradient(ellipse at 75% 75%, rgba(50, 50, 55, 0.22) 0%, transparent 48%),
    radial-gradient(ellipse at 55% 45%, rgba(40, 40, 45, 0.14) 0%, transparent 62%);
  pointer-events: none;
  z-index: 0;
  animation: fogDrift 18s ease-in-out infinite;
}

@keyframes fogDrift {
  0%, 100% { opacity: 0.72; transform: translateX(0px); }
  50% { opacity: 0.92; transform: translateX(12px); }
}

.body::after {
  content: '';
  position: fixed;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.045;
  pointer-events: none;
  z-index: 0;
}

/* =========
   HEADER
   ========= */
header {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 2rem 1rem 1.25rem;
  background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 65%, transparent 100%);
}

header::after {
  content: '────────────────────────────────────────';
  display: block;
  margin-top: 1rem;
  color: #3a3530;
  letter-spacing: 0.25em;
  opacity: 0.55;
}

h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.8rem, 3.8vw, 2.9rem);
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #c8b898;
  text-shadow: 0 2px 10px rgba(0,0,0,0.85);
}

.subtitle {
  margin-top: 0.5rem;
  font-style: italic;
  color: #6a6050;
  letter-spacing: 0.08em;
  line-height: 1.3;
}

/* =========
   LAYOUT WRAPPER
   ========= */
.map-container {
  position: relative;
  z-index: 2;
  max-width: 1300px;
  margin: 0 auto;
  padding: 1rem;
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 980px) {
  .map-container { grid-template-columns: 1fr; }
}

/* =========
   MAP FRAME
   ========= */
.map-frame {
  position: relative;
  background: linear-gradient(135deg, #1a1815 0%, #0f0e0c 52%, #1a1815 100%);
  border: 2px solid #2a2520;
  border-radius: 6px;
  padding: 0.65rem;
  box-shadow:
    inset 0 0 55px rgba(0,0,0,0.78),
    0 12px 45px rgba(0,0,0,0.92);
}

.map-frame::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid #252018;
  border-radius: 4px;
  pointer-events: none;
}

/* SVG */
svg.city-map {
  width: 100%;
  height: auto;
  display: block;
  filter: saturate(0.85) contrast(1.05);
  border-radius: 4px;
}

/* =========
   SVG COLORS / STYLES
   ========= */

/* Hintergrund */
.bg { fill: #0d0c0a; }

/* Wasser */
.water { fill: url(#waterGradient); }
.water-surface { fill: url(#waterPattern); opacity: 0.45; }
.water-edge { fill: none; stroke: #2a3a40; stroke-width: 2.2; opacity: 0.9; }

.river-arm {
  fill: none;
  stroke: #141e24;
  stroke-width: 26;
  stroke-linecap: round;
  opacity: 0.95;
}
.river-arm-surface {
  fill: none;
  stroke: #24343e;
  stroke-width: 18;
  stroke-linecap: round;
  opacity: 0.35;
}

/* Land */
.land {
  fill: #1c1a17;
  stroke: #252220;
  stroke-width: 1.2;
  opacity: 0.95;
}
.outer-land {
  fill: #141210;
  stroke: #1f1c18;
  stroke-width: 1;
  opacity: 0.85;
}

/* Mauern */
.wall-main {
  fill: none;
  stroke: #3a3530;
  stroke-width: 5.2;
  stroke-linecap: square;
  opacity: 0.95;
  filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.55));
}
.wall-gate {
  fill: none;
  stroke: #6a5a48;
  stroke-width: 4;
  stroke-linecap: round;
  opacity: 0.85;
}

/* Brücken */
.bridge {
  fill: none;
  stroke: #6a5a48;
  stroke-width: 6;
  stroke-linecap: round;
  opacity: 0.8;
}
.bridges .label-location {
  fill: #b0a080;
  opacity: 0.85;
}

/* Straßen */
.road-crown {
  fill: none;
  stroke: #2b2822;
  stroke-width: 9;
  stroke-linecap: round;
  opacity: 0.95;
}
.road-trade {
  fill: none;
  stroke: #232019;
  stroke-width: 6;
  stroke-linecap: round;
  opacity: 0.9;
}
.road-path {
  fill: none;
  stroke: #1a1815;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-dasharray: 8 4;
  opacity: 0.85;
}

/* Obelisken */
.obelisk {
  fill: #2a2520;
  stroke: #3a3530;
  stroke-width: 1;
  opacity: 0.95;
}

/* Blöcke */
.block {
  fill: none;
}
.block-important {
  fill: none;
}
.block-dim {
  fill: none;
}

/* Nebel */
.fog-patch {
  fill: url(#fogGradient);
  opacity: 0.28;
  pointer-events: none;
}

/* Zonen (deine farbigen Hinterlegungen) */
.zone-lichtring { fill: #c8b898; opacity: 0.12; }
.zone-ordenshallen { fill: #8aa0b5; opacity: 0.12; }
.zone-handelsring { fill: #b79a68; opacity: 0.12; }
.zone-flussmarken { fill: #7f8e6d; opacity: 0.12; }
.zone-aussenmarken { fill: #8a6f63; opacity: 0.10; }
.zone-nebelviertel { fill: #6f6a86; opacity: 0.16; }

/* Labels / Typo im SVG */
.map-title {
  font-family: 'Cinzel', serif;
  font-size: 20px;
  letter-spacing: 0.22em;
  fill: #c8b898;
  opacity: 0.9;
  text-shadow: 0 2px 8px rgba(0,0,0,0.7);
}
.map-subtitle {
  font-family: 'Crimson Text', serif;
  font-size: 11px;
  letter-spacing: 0.28em;
  fill: #6a6050;
  opacity: 0.9;
  font-style: italic;
}

.district-label {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  letter-spacing: 0.22em;
  fill: #3a3530;
  opacity: 0.75;
  text-transform: uppercase;
  pointer-events: none;
}

.label-location {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  fill: #a89878;
  text-anchor: middle;
  pointer-events: none;
}

.label-street {
  font-family: 'Crimson Text', serif;
  font-size: 10px;
  fill: #5a5040;
  font-style: italic;
  letter-spacing: 0.12em;
  user-select: none;
  opacity: 0.9;
}

.label-water {
  font-family: 'Crimson Text', serif;
  font-size: 11px;
  fill: #3a4a55;
  font-style: italic;
  letter-spacing: 0.22em;
  opacity: 0.9;
  user-select: none;
}

.scale-text {
  font-family: 'Crimson Text', serif;
  font-size: 9px;
  fill: #5a5040;
  letter-spacing: 0.12em;
}

/* =========
   POIs
   ========= */
.poi-marker {
  cursor: pointer;
  transition: transform 0.16s ease, filter 0.16s ease, opacity 0.16s ease;
  transform-origin: center;
}

.poi-marker:hover {
  filter: brightness(1.18);
}

/* POI-Farben (Swatches + SVG Klassen) */
.poi-royal { fill: #3a2f22; stroke: #8a6a40; stroke-width: 1.6; }
.poi-admin { fill: #2e2a24; stroke: #6a5a48; stroke-width: 1.5; }
.poi-arcane { fill: #2a2230; stroke: #6a5a88; stroke-width: 1.5; }
.poi-ferran { fill: #2b2b32; stroke: #5a5060; stroke-width: 1.5; }
.poi-guard { fill: #2a2a30; stroke: #5a5a68; stroke-width: 1.5; }
.poi-tower { fill: #2a2520; stroke: #4a4540; stroke-width: 1.5; opacity: 0.95; }
.poi-market { fill: #4a4030; stroke: #7a6a48; stroke-width: 1.5; }
.poi-archive { fill: #26231f; stroke: #5a5040; stroke-width: 1.5; }
.poi-ruin { fill: #221f1c; stroke: #3a3530; stroke-width: 1.5; opacity: 0.9; }
.poi-underground { fill: #2a2828; stroke: #4a4540; stroke-width: 1.5; opacity: 0.85; }
.poi-dock { fill: #2a2520; stroke: #3a3530; stroke-width: 1.2; opacity: 0.9; }
.poi-farm { fill: #2f251c; stroke: #6a5a48; stroke-width: 1.5; }

/* Lichtpunkte */
.light-point { fill: #e8b860; opacity: 0.85; }

/* =========
   LEGEND + INFO
   ========= */
.legend,
.info-panel {
  background: linear-gradient(135deg, #151310 0%, #0f0e0c 100%);
  border: 1px solid #252018;
  border-radius: 6px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.55);
}

.legend {
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.legend-section h3,
.info-panel h3 {
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  color: #9a8a70;
  margin-bottom: 0.6rem;
  letter-spacing: 0.12em;
  border-bottom: 1px solid #252018;
  padding-bottom: 0.35rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0.42rem 0;
  font-size: 0.8rem;
  color: #7a7060;
  line-height: 1.2;
}

/* Legend chips */
.chip {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.35);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
  flex: 0 0 auto;
}
.chip.lichtring { background: rgba(200,184,152,0.28); }
.chip.ordenshallen { background: rgba(138,160,181,0.28); }
.chip.handelsring { background: rgba(183,154,104,0.28); }
.chip.flussmarken { background: rgba(127,142,109,0.28); }
.chip.nebelviertel { background: rgba(111,106,134,0.34); }
.chip.aussenmarken { background: rgba(138,111,99,0.26); }

/* Legend lines */
.line {
  width: 28px;
  height: 0;
  border-top: 4px solid #2b2822;
  border-radius: 4px;
  flex: 0 0 auto;
  opacity: 0.95;
}
.line.crown { border-top-width: 5px; border-top-color: #2b2822; }
.line.trade { border-top-width: 4px; border-top-color: #232019; opacity: 0.9; }
.line.path { border-top-width: 3px; border-top-color: #1a1815; border-top-style: dashed; }

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(217,160,64,0.35);
  border: 1px solid rgba(217,160,64,0.55);
  box-shadow: 0 0 12px rgba(217,160,64,0.25);
}

.poi-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0,0,0,0.35);
}
.poi-swatch.royal { background: #3a2f22; border-color: #8a6a40; }
.poi-swatch.guard { background: #2a2a30; border-color: #5a5a68; }
.poi-swatch.ferran { background: #2b2b32; border-color: #5a5060; }
.poi-swatch.market { background: #4a4030; border-color: #7a6a48; }
.poi-swatch.arcane { background: #2a2230; border-color: #6a5a88; }

.info-panel { padding: 1rem; }
.info-panel p {
  font-size: 0.9rem;
  line-height: 1.65;
  color: #7a7060;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.9rem;
}
@media (max-width: 980px) {
  .stats-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.stat-item {
  text-align: center;
  padding: 0.6rem 0.5rem;
  background: rgba(0,0,0,0.28);
  border: 1px solid rgba(255,255,255,0.03);
  border-radius: 6px;
}
.stat-value {
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  color: #b8a888;
  letter-spacing: 0.08em;
}
.stat-label {
  margin-top: 0.25rem;
  font-size: 0.72rem;
  color: #5a5040;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;

  background: linear-gradient(135deg, #1a1815 0%, #0f0e0c 100%);
  border: 1px solid #3a3530;
  border-radius: 6px;
  padding: 0.8rem 0.95rem;
  max-width: 320px;

  box-shadow: 0 10px 35px rgba(0,0,0,0.85);
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}

.tooltip .type {
  font-size: 0.72rem;
  color: #5a5040;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 0.3rem;
}

.tooltip h4 {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  color: #c8b898;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
}

.tooltip p {
  font-size: 0.85rem;
  color: #8a8070;
  line-height: 1.45;
}

@media (prefers-reduced-motion: reduce) {
  .body::before { animation: none; }
  .poi-marker { transition: none; }
  .tooltip { transition: none; }
}
</style>
