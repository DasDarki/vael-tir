<script setup lang="ts">
import OpenSeadragon from "openseadragon"
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

definePage({
  meta: {
    title: "Weltkarte",
  },
})

type Pt = { x: number; y: number }
type Keypoint = { id: string; img: Pt }
type ScreenKeypoint = Keypoint & { screen: Pt }
type ShareState = { v: 1; z: number; c: Pt; m: Pt }
type MeasurePoint = { img: Pt; screen: Pt }

const route = useRoute()
const router = useRouter()

const el = ref<HTMLDivElement | null>(null)

const IMAGE_WIDTH = 12000
const IMAGE_HEIGHT = 6000
const TILE_SIZE = 512
const MIN_LEVEL = 0
const MAX_LEVEL = 14

const MILES_PER_PIXEL = 0.05829414800366402

const isCalibrateMode = computed(() => route.query.devmode === "calibrate")

const mode = ref<"browse" | "measure">("browse")

const keypoints = ref<Keypoint[]>([
  { id: "berlin", img: { x: 6400, y: 1600 } },
  { id: "nyc", img: { x: 3050, y: 2100 } },
])

const shareMarker = ref<null | { img: Pt; screen: Pt }>(null)

const measure = reactive<{
  points: MeasurePoint[]
  miles: number | null
}>({
  points: [],
  miles: null,
})

const ui = reactive({
  showCopied: false,
  copiedText: "Link kopiert",
})

let viewer: OpenSeadragon.Viewer | null = null
let copiedTimer: number | null = null

let isDragging = false
let dragStart: { x: number; y: number } | null = null
const DRAG_THRESHOLD_PX = 6

type MeasureShareState = {
  v: 1
  pts: Pt[]
}

function getMeasureShareState(): MeasureShareState | null {
  if (measure.points.length < 2) return null
  return {
    v: 1,
    pts: measure.points.map(p => p.img),
  }
}

async function setMeasureStateInUrl() {
  const st = getMeasureShareState()
  if (!st) return
  const m = b64urlEncode(st)
  await router.replace({ query: { ...route.query, m } })
}

function distPx(a: Pt, b: Pt) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function polylinePx(points: Pt[]) {
  let sum = 0
  for (let i = 1; i < points.length; i++) sum += distPx(points[i - 1]!, points[i]!)
  return sum
}

function formatMiles(mi: number) {
  if (!Number.isFinite(mi)) return ""
  if (mi < 1) return `${(mi * 5280).toFixed(0)} ft`
  if (mi < 10) return `${mi.toFixed(2)} mi`
  if (mi < 100) return `${mi.toFixed(1)} mi`
  return `${mi.toFixed(0)} mi`
}

function imagePxToScreen(p: Pt): Pt {
  if (!viewer) return { x: 0, y: 0 }
  const vp = viewer.viewport.imageToViewportCoordinates(p.x, p.y)
  const px = viewer.viewport.viewportToViewerElementCoordinates(vp)
  return { x: px.x, y: px.y }
}

function viewportToImagePx(vp: OpenSeadragon.Point): Pt {
  if (!viewer) return { x: 0, y: 0 }
  const imgPoint = viewer.viewport.viewportToImageCoordinates(vp)
  return { x: imgPoint.x, y: imgPoint.y }
}

const keypointsScreen = computed<ScreenKeypoint[]>(() =>
  keypoints.value.map((kp) => ({ ...kp, screen: imagePxToScreen(kp.img) })),
)

function onKeypointClick(id: string) {
}

function setShareMarker(img: Pt) {
  shareMarker.value = { img, screen: imagePxToScreen(img) }
}

function refreshOverlay() {
  if (shareMarker.value) shareMarker.value.screen = imagePxToScreen(shareMarker.value.img)
  for (const p of measure.points) p.screen = imagePxToScreen(p.img)
}

function b64urlEncode(obj: unknown) {
  const json = JSON.stringify(obj)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function b64urlDecode<T>(s: string): T {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : ""
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/")
  const json = decodeURIComponent(escape(atob(b64)))
  return JSON.parse(json) as T
}

function getShareState(markerImg: Pt): ShareState | null {
  if (!viewer) return null
  const centerImg = viewer.viewport.viewportToImageCoordinates(viewer.viewport.getCenter())
  const z = viewer.viewport.getZoom(true)
  return { v: 1, z, c: { x: centerImg.x, y: centerImg.y }, m: markerImg }
}

function applyShareState(st: ShareState) {
  if (!viewer) return
  const z = Number(st.z)
  const c = st.c
  const m = st.m
  viewer.viewport.zoomTo(z, undefined, true)
  viewer.viewport.panTo(viewer.viewport.imageToViewportCoordinates(c.x, c.y), true)
  setShareMarker({ x: m.x, y: m.y })
  refreshOverlay()
}

async function writeShareUrlToClipboard(url: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return
  }
  const ta = document.createElement("textarea")
  ta.value = url
  ta.style.position = "fixed"
  ta.style.left = "-9999px"
  ta.style.top = "-9999px"
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  document.execCommand("copy")
  document.body.removeChild(ta)
}

function flashCopied(msg = "Link kopiert") {
  ui.copiedText = msg
  ui.showCopied = true
  if (copiedTimer) window.clearTimeout(copiedTimer)
  copiedTimer = window.setTimeout(() => (ui.showCopied = false), 1200)
}

async function setUrlStateAndCopy(st: ShareState) {
  const s = b64urlEncode(st)
  await router.replace({ query: { ...route.query, s } })
  const url = window.location.href
  await writeShareUrlToClipboard(url)
  flashCopied()
}

function handleCanvasClick(evt: any) {
  if (isDragging) return
  if (!viewer) return
  const webPoint = evt.position
  const vpPoint = viewer.viewport.pointFromPixel(webPoint)
  const img = viewportToImagePx(vpPoint)

  if (mode.value === "measure") {
    addMeasurePoint(img)
    return
  }
}

async function handleCanvasDoubleClick(evt: any) {
  if (!viewer) return
  if (mode.value !== "browse") return
  const webPoint = evt.position
  const vpPoint = viewer.viewport.pointFromPixel(webPoint)
  const img = viewportToImagePx(vpPoint)
  setShareMarker(img)
  const st = getShareState(img)
  if (!st) return
  await setUrlStateAndCopy(st)
}

function tryApplyStateFromUrl() {
  const raw = route.query.s
  if (!raw || Array.isArray(raw)) return
  try {
    const st = b64urlDecode<ShareState>(raw)
    if (!st || st.v !== 1 || !st.c || !st.m || typeof st.z !== "number") return
    applyShareState(st)
  } catch {}
}

function resetMeasure() {
  measure.points = []
  measure.miles = null
  router.replace({ query: { ...route.query, m: undefined } })
}

function addMeasurePoint(img: Pt) {
  measure.points.push({ img, screen: imagePxToScreen(img) })
  if (!isCalibrateMode.value && measure.points.length >= 2) {
    const pts = measure.points.map((p) => p.img)
    const px = polylinePx(pts)
    measure.miles = px * MILES_PER_PIXEL
  } else {
    measure.miles = null
  }

  if (!isCalibrateMode.value) {
    setMeasureStateInUrl()
  }
}

function tryApplyMeasureFromUrl() {
  const raw = route.query.m
  if (!raw || Array.isArray(raw)) return
  try {
    const st = b64urlDecode<MeasureShareState>(raw)
    if (!st || st.v !== 1 || !Array.isArray(st.pts) || st.pts.length < 2) return
    resetMeasure()
    for (const img of st.pts) {
      measure.points.push({ img, screen: imagePxToScreen(img) })
    }
    const px = polylinePx(st.pts)
    measure.miles = px * MILES_PER_PIXEL
  } catch {}
}

function maybeCalibrateAfterSecondPoint() {
  if (!isCalibrateMode.value) return
  if (measure.points.length !== 2) return
  const a = measure.points[0]!.img
  const b = measure.points[1]!.img
  const px = distPx(a, b)
  const input = window.prompt("Meilen zwischen den beiden Punkten eingeben:", "1000")
  if (input == null) return
  const miles = Number(String(input).replace(",", "."))
  if (!Number.isFinite(miles) || miles <= 0 || px <= 0) return
  const mpp = miles / px
  console.log("MILES_PER_PIXEL =", mpp)
  flashCopied("Kalibrierung in Konsole")
}

const measurePolylinePoints = computed(() =>
  measure.points.map((p) => `${p.screen.x},${p.screen.y}`).join(" "),
)

const measureLabel = computed(() => {
  if (isCalibrateMode.value) {
    if (measure.points.length < 2) return "Kalibrieren: 2 Punkte setzen"
    return "Kalibrieren: Prompt ausfüllen"
  }
  if (measure.points.length < 2) return "Messung: Punkte setzen"
  if (measure.miles == null) return ""
  return formatMiles(measure.miles)
})

const measureLabelPos = computed(() => {
  const last = measure.points[measure.points.length - 1]
  if (!last) return null
  return { x: last.screen.x + 12, y: last.screen.y - 12 }
})

const scale = reactive({
  barPx: 180,
  miles: 0,
  label: "",
})

function niceStepMiles(targetMiles: number) {
  if (!(targetMiles > 0)) return 0
  const pow = Math.pow(10, Math.floor(Math.log10(targetMiles)))
  const n = targetMiles / pow
  const step = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10
  return step * pow
}

function updateScaleBar() {
  if (!viewer || !el.value) return
  const rect = el.value.getBoundingClientRect()
  const pxWidth = rect.width
  const imgZoom = viewer.viewport.getZoom(true)
  if (!(imgZoom > 0)) return
  const imgPxPerScreenPx = 1 / imgZoom
  const milesPerScreenPx = imgPxPerScreenPx * MILES_PER_PIXEL
  const desiredMiles = (scale.barPx * milesPerScreenPx) || 0
  const niceMiles = niceStepMiles(desiredMiles) || 0
  const niceBarPx = niceMiles > 0 ? niceMiles / milesPerScreenPx : scale.barPx
  scale.miles = niceMiles
  scale.barPx = Math.max(60, Math.min(pxWidth * 0.5, niceBarPx))
  scale.label = niceMiles > 0 ? formatMiles(niceMiles) : ""
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") resetMeasure()
}

watch(mode, () => resetMeasure())

onMounted(() => {
  if (!el.value) return

  viewer = OpenSeadragon({
    element: el.value,
    showNavigationControl: false,
    gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: false },
    gestureSettingsTouch: { dblTapToZoom: true } as any,
    maxZoomPixelRatio: 2,
    visibilityRatio: 1,
    constrainDuringPan: true,
    tileSources: {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      tileSize: TILE_SIZE,
      minLevel: MIN_LEVEL,
      maxLevel: MAX_LEVEL,
      getTileUrl: (level: number, x: number, y: number) => `/map_tiles/${level}/${x}_${y}.jpg`,
    } as any,
  })

  viewer.addHandler("canvas-click", handleCanvasClick)
  viewer.addHandler("canvas-double-click", handleCanvasDoubleClick)

  viewer.addHandler("animation", () => {
    refreshOverlay()
    updateScaleBar()
  })
  viewer.addHandler("animation-finish", () => {
    refreshOverlay()
    updateScaleBar()
  })

  viewer.addHandler("open", () => {
    refreshOverlay()
    updateScaleBar()
    tryApplyStateFromUrl()
    tryApplyMeasureFromUrl()
  })

  viewer.addHandler("canvas-drag", (evt: any) => {
    if (!dragStart) dragStart = { x: evt.position.x, y: evt.position.y }
    const dx = evt.position.x - dragStart.x
    const dy = evt.position.y - dragStart.y
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) isDragging = true
  })

  viewer.addHandler("canvas-drag-end", () => {
    dragStart = null
    window.setTimeout(() => {
      isDragging = false
    }, 0)
  })

  window.addEventListener("keydown", onKeyDown, { passive: true })
})

watch(
  () => measure.points.length,
  () => {
    maybeCalibrateAfterSecondPoint()
  },
)

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown as any)
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
  if (copiedTimer) window.clearTimeout(copiedTimer)
})
</script>

<template>
  <div class="map-wrap">
    <div ref="el" class="osd"></div>

    <svg class="overlay">
      <defs>
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.35" />
        </filter>
        <linearGradient id="measureGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#7dd3fc" stop-opacity="0.95" />
          <stop offset="1" stop-color="#a78bfa" stop-opacity="0.95" />
        </linearGradient>
      </defs>

      <polyline
        v-if="measure.points.length >= 2"
        :points="measurePolylinePoints"
        class="measure-line"
      />
      <circle
        v-for="(p, idx) in measure.points"
        :key="idx"
        :cx="p.screen.x"
        :cy="p.screen.y"
        r="7"
        class="measure-point"
      />
      <circle
        v-for="(p, idx) in measure.points"
        :key="'h' + idx"
        :cx="p.screen.x"
        :cy="p.screen.y"
        r="14"
        class="measure-hit"
      />

      <g v-if="measureLabelPos && (measure.points.length >= 1)">
        <rect
          :x="measureLabelPos.x - 8"
          :y="measureLabelPos.y - 18"
          :width="Math.max(140, (measureLabel.length * 7) + 26)"
          height="28"
          rx="10"
          class="measure-chip"
        />
        <text :x="measureLabelPos.x + 6" :y="measureLabelPos.y + 2" class="measure-text">
          {{ measureLabel }}
        </text>
      </g>

      <circle
        v-for="kp in keypointsScreen"
        :key="kp.id"
        :cx="kp.screen.x"
        :cy="kp.screen.y"
        r="8"
        class="kp"
        @click.stop="onKeypointClick(kp.id)"
      />
      <circle v-if="shareMarker" :cx="shareMarker.screen.x" :cy="shareMarker.screen.y" r="10" class="share" />
    </svg>

    <div class="hud">
      <button class="btn" @click="mode = mode === 'measure' ? 'browse' : 'measure'">
        Mode: {{ mode }}
      </button>
      <button v-if="mode === 'measure' && measure.points.length" class="btn ghost" @click="resetMeasure()">
        Reset
      </button>
      <div v-if="!isCalibrateMode && measure.miles !== null" class="stat">Gesamt: {{ formatMiles(measure.miles) }}</div>
      <div v-if="isCalibrateMode" class="stat dev">devmode=calibrate</div>
    </div>

<!--    <div class="scale">
      <div class="scale-bar" :style="{ width: scale.barPx + 'px' }"></div>
      <div class="scale-label">{{ scale.label }}</div>
    </div>-->

    <div v-if="ui.showCopied" class="toast">{{ ui.copiedText }}</div>
  </div>
</template>

<style scoped lang="scss">
.map-wrap {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 70vh;
  font-family: 'Inter', sans-serif;
}

.osd {
  width: 100%;
  height: 100vh;
  background: #111;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
}

.overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.kp {
  pointer-events: auto;
  cursor: pointer;
  fill: rgba(255, 255, 255, 0.7);
  filter: url(#softShadow);
}

.measure-line {
  fill: none;
  stroke: url(#measureGrad);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: url(#softShadow);
}

.measure-point {
  fill: rgba(255, 255, 255, 0.95);
  stroke: rgba(0, 0, 0, 0.35);
  stroke-width: 2;
  filter: url(#softShadow);
}

.measure-hit {
  fill: transparent;
}

.measure-chip {
  fill: rgba(0, 0, 0, 0.55);
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 1;
  filter: url(#softShadow);
}

.measure-text {
  fill: white;
  font-size: 13px;
  font-weight: 600;
}

.hud {
  position: absolute;
  left: 12px;
  top: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 10px;
  border-radius: 10px;
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 8px;
}

.btn {
  border: 0;
  border-radius: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.14);
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.08);
}

.stat {
  font-size: 13px;
  opacity: 0.95;
  padding-left: 6px;
  white-space: nowrap;
}

.stat.dev {
  color: rgba(255, 255, 255, 0.85);
}

.share {
  pointer-events: none;
  fill: rgba(255, 0, 0, 0.8);
  filter: url(#softShadow);
}

.scale {
  position: absolute;
  left: 12px;
  bottom: 12px;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  padding: 10px 12px;
  border-radius: 12px;
  display: grid;
  gap: 6px;
  min-width: 140px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
}

.scale-bar {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(125, 211, 252, 0.95), rgba(167, 139, 250, 0.95));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}

.scale-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.toast {
  position: absolute;
  right: 12px;
  top: 12px;
  background: rgba(0, 0, 0, 0.78);
  color: white;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-weight: 700;
}
</style>