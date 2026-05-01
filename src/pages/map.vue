<script setup lang="ts">
import OpenSeadragon from "openseadragon"
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import placesJson from "@/data/places.json"
import regionsJson from "@/data/regions.json"
import regionColorsJson from "@/data/region-colors.json"

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

type Place = { id: string; name: string; img: Pt; screen: Pt }
type RegionVertex = { img: Pt; screen: Pt }
type Region = { id: string; name: string; points: RegionVertex[] }

type StaticPlace = { id: string; name: string; img: Pt; screen: Pt }
type StaticRegion = { id: string; name: string; color: string; points: RegionVertex[] }

const PLACES_STORAGE_KEY = "vael-tir:dm-places"
const REGIONS_STORAGE_KEY = "vael-tir:dm-regions"
const REGION_VISIBILITY_KEY = "vael-tir:region-visibility"
const SNAP_DISTANCE_PX = 14
const DEFAULT_REGION_COLOR = "#94a3b8"

const regionColors = regionColorsJson as Record<string, string>

function colorForRegion(name: string): string {
  return regionColors[name] ?? DEFAULT_REGION_COLOR
}

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
const isDmDevMode = computed(() => route.query.__mode__ === "dm-dev")

type Mode = "browse" | "measure" | "places" | "regions"
const mode = ref<Mode>(route.query.__mode__ === "dm-dev" ? "places" : "browse")

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

const places = ref<Place[]>([])
const regions = ref<Region[]>([])

const drawing = reactive<{
  active: boolean
  points: RegionVertex[]
  cursorScreen: Pt | null
}>({ active: false, points: [], cursorScreen: null })

const selectedRegionId = ref<string | null>(null)
const draggingVertex = ref<{ regionId: string; index: number; pointerId: number } | null>(null)

const staticPlaces = ref<StaticPlace[]>(
  (placesJson as Array<{ name: string; x: number; y: number }>).map((p, i) => ({
    id: `sp-${i}`,
    name: p.name,
    img: { x: p.x, y: p.y },
    screen: { x: 0, y: 0 },
  })),
)

const staticRegions = ref<StaticRegion[]>(
  (regionsJson as Array<{ name: string; points: Pt[] }>).map((r, i) => ({
    id: `sr-${i}`,
    name: r.name,
    color: colorForRegion(r.name),
    points: r.points.map(pt => ({ img: { x: pt.x, y: pt.y }, screen: { x: 0, y: 0 } })),
  })),
)

const regionVisibility = reactive<Record<string, boolean>>(
  Object.fromEntries(staticRegions.value.map(r => [r.name, true])),
)

const regionsPanelOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref("")
const searchActiveIndex = ref(0)
const searchInputEl = ref<HTMLInputElement | null>(null)

const highlightedPlace = ref<{ name: string; img: Pt; screen: Pt } | null>(null)
let highlightTimer: number | null = null

const selectedPlaceName = ref<string | null>(null)
const selectedStaticRegionName = ref<string | null>(null)

let viewer: OpenSeadragon.Viewer | null = null
let copiedTimer: number | null = null

let isDragging = false
let dragStart: { x: number; y: number } | null = null
const DRAG_THRESHOLD_PX = 6

let suppressNextCanvasClick = false

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

function clientToImagePx(clientX: number, clientY: number): Pt | null {
  if (!viewer || !el.value) return null
  const rect = el.value.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top
  const vp = viewer.viewport.viewerElementToViewportCoordinates(new OpenSeadragon.Point(x, y))
  return viewportToImagePx(vp)
}

const keypointsScreen = computed<ScreenKeypoint[]>(() =>
  keypoints.value.map((kp) => ({ ...kp, screen: imagePxToScreen(kp.img) })),
)

function onKeypointClick(_id: string) {
}

function setShareMarker(img: Pt) {
  shareMarker.value = { img, screen: imagePxToScreen(img) }
}

function refreshOverlay() {
  if (shareMarker.value) shareMarker.value.screen = imagePxToScreen(shareMarker.value.img)
  for (const p of measure.points) p.screen = imagePxToScreen(p.img)
  for (const place of places.value) place.screen = imagePxToScreen(place.img)
  for (const region of regions.value) {
    for (const pt of region.points) pt.screen = imagePxToScreen(pt.img)
  }
  for (const pt of drawing.points) pt.screen = imagePxToScreen(pt.img)
  for (const place of staticPlaces.value) place.screen = imagePxToScreen(place.img)
  for (const region of staticRegions.value) {
    for (const pt of region.points) pt.screen = imagePxToScreen(pt.img)
  }
  if (highlightedPlace.value) {
    highlightedPlace.value.screen = imagePxToScreen(highlightedPlace.value.img)
  }
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
  copiedTimer = window.setTimeout(() => (ui.showCopied = false), 1400)
}

async function setUrlStateAndCopy(st: ShareState) {
  const s = b64urlEncode(st)
  await router.replace({ query: { ...route.query, s } })
  const url = window.location.href
  await writeShareUrlToClipboard(url)
  flashCopied()
}

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function loadPlacesFromStorage() {
  try {
    const raw = localStorage.getItem(PLACES_STORAGE_KEY)
    if (!raw) return
    const arr = JSON.parse(raw) as Array<{ id?: string; name: string; x: number; y: number }>
    if (!Array.isArray(arr)) return
    places.value = arr
      .filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y))
      .map(p => ({
        id: p.id ?? genId(),
        name: String(p.name ?? ""),
        img: { x: Number(p.x), y: Number(p.y) },
        screen: { x: 0, y: 0 },
      }))
  } catch {}
}

function savePlacesToStorage() {
  const data = places.value.map(p => ({ id: p.id, name: p.name, x: p.img.x, y: p.img.y }))
  localStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(data))
}

function loadRegionsFromStorage() {
  try {
    const raw = localStorage.getItem(REGIONS_STORAGE_KEY)
    if (!raw) return
    const arr = JSON.parse(raw) as Array<{ id?: string; name: string; points: Pt[] }>
    if (!Array.isArray(arr)) return
    regions.value = arr
      .filter(r => r && Array.isArray(r.points) && r.points.length >= 3)
      .map(r => ({
        id: r.id ?? genId(),
        name: String(r.name ?? ""),
        points: r.points.map(pt => ({
          img: { x: Number(pt.x), y: Number(pt.y) },
          screen: { x: 0, y: 0 },
        })),
      }))
  } catch {}
}

function saveRegionsToStorage() {
  const data = regions.value.map(r => ({
    id: r.id,
    name: r.name,
    points: r.points.map(pt => ({ x: pt.img.x, y: pt.img.y })),
  }))
  localStorage.setItem(REGIONS_STORAGE_KEY, JSON.stringify(data))
}

function downloadJson(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadPlaces() {
  const data = places.value.map(p => ({ name: p.name, x: Math.round(p.img.x), y: Math.round(p.img.y) }))
  downloadJson("places.json", data)
  flashCopied(`places.json (${data.length})`)
}

function downloadRegions() {
  const data = regions.value.map(r => ({
    name: r.name,
    points: r.points.map(pt => ({ x: Math.round(pt.img.x), y: Math.round(pt.img.y) })),
  }))
  downloadJson("regions.json", data)
  flashCopied(`regions.json (${data.length})`)
}

function addPlace(img: Pt) {
  const name = window.prompt("Name des Ortes:", "")
  if (name == null) return
  const trimmed = name.trim()
  if (!trimmed) return
  places.value.push({
    id: genId(),
    name: trimmed,
    img,
    screen: imagePxToScreen(img),
  })
  savePlacesToStorage()
}

function removePlace(id: string) {
  const place = places.value.find(p => p.id === id)
  if (!place) return
  if (!window.confirm(`Ort "${place.name}" löschen?`)) return
  places.value = places.value.filter(p => p.id !== id)
  savePlacesToStorage()
}

function renamePlace(id: string) {
  const place = places.value.find(p => p.id === id)
  if (!place) return
  const name = window.prompt("Ort umbenennen:", place.name)
  if (name == null) return
  const trimmed = name.trim()
  if (!trimmed) return
  place.name = trimmed
  savePlacesToStorage()
}

function centerOnImg(img: Pt) {
  if (!viewer) return
  viewer.viewport.panTo(viewer.viewport.imageToViewportCoordinates(img.x, img.y), false)
}

function loadRegionVisibility() {
  try {
    const raw = localStorage.getItem(REGION_VISIBILITY_KEY)
    if (!raw) return
    const obj = JSON.parse(raw) as Record<string, boolean>
    if (!obj || typeof obj !== "object") return
    for (const k of Object.keys(regionVisibility)) {
      if (k in obj) regionVisibility[k] = !!obj[k]
    }
  } catch {}
}

function saveRegionVisibility() {
  localStorage.setItem(REGION_VISIBILITY_KEY, JSON.stringify(regionVisibility))
}

function toggleRegion(name: string) {
  regionVisibility[name] = !regionVisibility[name]
  saveRegionVisibility()
  if (!regionVisibility[name] && selectedStaticRegionName.value === name) {
    selectedStaticRegionName.value = null
    updateSelectionUrl()
  }
}

function setAllRegions(value: boolean) {
  for (const k of Object.keys(regionVisibility)) regionVisibility[k] = value
  saveRegionVisibility()
}

function staticRegionImgCenter(region: StaticRegion): Pt {
  let sx = 0
  let sy = 0
  for (const p of region.points) {
    sx += p.img.x
    sy += p.img.y
  }
  const n = Math.max(1, region.points.length)
  return { x: sx / n, y: sy / n }
}

function staticRegionScreenCenter(region: StaticRegion): Pt {
  let sx = 0
  let sy = 0
  for (const p of region.points) {
    sx += p.screen.x
    sy += p.screen.y
  }
  const n = Math.max(1, region.points.length)
  return { x: sx / n, y: sy / n }
}

function staticRegionPolygonString(points: RegionVertex[]) {
  return points.map(p => `${p.screen.x},${p.screen.y}`).join(" ")
}

const searchablePlaces = computed<Array<{ id: string; name: string; img: Pt }>>(() => {
  if (isDmDevMode.value) return places.value
  return staticPlaces.value
})

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const list = searchablePlaces.value
  const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name, "de"))
  if (!q) return sorted.slice(0, 80)
  return sorted.filter(p => p.name.toLowerCase().includes(q)).slice(0, 80)
})

function openSearch() {
  searchOpen.value = true
  searchActiveIndex.value = 0
  nextTick(() => {
    searchInputEl.value?.focus()
    searchInputEl.value?.select()
  })
}

function closeSearch() {
  searchOpen.value = false
}

function flashHighlight(name: string, img: Pt, persistent = false) {
  highlightedPlace.value = { name, img: { ...img }, screen: imagePxToScreen(img) }
  if (highlightTimer) {
    window.clearTimeout(highlightTimer)
    highlightTimer = null
  }
  if (!persistent) {
    highlightTimer = window.setTimeout(() => {
      highlightedPlace.value = null
      highlightTimer = null
    }, 2800)
  }
}

function clearHighlight() {
  highlightedPlace.value = null
  if (highlightTimer) {
    window.clearTimeout(highlightTimer)
    highlightTimer = null
  }
}

function staticRegionBbox(region: StaticRegion) {
  if (region.points.length === 0) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of region.points) {
    if (p.img.x < minX) minX = p.img.x
    if (p.img.x > maxX) maxX = p.img.x
    if (p.img.y < minY) minY = p.img.y
    if (p.img.y > maxY) maxY = p.img.y
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

function fitToStaticRegion(region: StaticRegion, immediate = false) {
  if (!viewer) return
  const b = staticRegionBbox(region)
  if (!b) return
  const padX = Math.max(b.w * 0.12, 40)
  const padY = Math.max(b.h * 0.12, 40)
  const vp = viewer.viewport.imageToViewportRectangle(
    b.x - padX,
    b.y - padY,
    b.w + padX * 2,
    b.h + padY * 2,
  )
  viewer.viewport.fitBounds(vp, immediate)
}

function updateSelectionUrl() {
  const q: Record<string, any> = { ...route.query }
  if (selectedPlaceName.value) q.p = selectedPlaceName.value
  else delete q.p
  if (selectedStaticRegionName.value) q.r = selectedStaticRegionName.value
  else delete q.r
  router.replace({ query: q })
}

function selectStaticPlace(name: string, opts?: { immediate?: boolean; closeSearchAfter?: boolean }) {
  if (selectedPlaceName.value === name && !opts?.immediate) {
    clearStaticSelection()
    return
  }
  const place = staticPlaces.value.find(p => p.name === name)
  if (!place || !viewer) return
  selectedPlaceName.value = name
  selectedStaticRegionName.value = null
  flashHighlight(place.name, place.img, true)
  const targetVp = viewer.viewport.imageToViewportCoordinates(place.img.x, place.img.y)
  const currentZoom = viewer.viewport.getZoom(true)
  const targetZoom = Math.max(currentZoom, 4)
  viewer.viewport.zoomTo(targetZoom, targetVp, opts?.immediate ?? false)
  viewer.viewport.panTo(targetVp, opts?.immediate ?? false)
  updateSelectionUrl()
  if (opts?.closeSearchAfter) closeSearch()
}

function selectStaticRegion(name: string, opts?: { immediate?: boolean }) {
  if (selectedStaticRegionName.value === name && !opts?.immediate) {
    clearStaticSelection()
    return
  }
  const region = staticRegions.value.find(r => r.name === name)
  if (!region) return
  selectedStaticRegionName.value = name
  selectedPlaceName.value = null
  if (regionVisibility[name] === false) {
    regionVisibility[name] = true
    saveRegionVisibility()
  }
  fitToStaticRegion(region, opts?.immediate ?? false)
  clearHighlight()
  updateSelectionUrl()
}

function clearStaticSelection() {
  if (!selectedPlaceName.value && !selectedStaticRegionName.value) return
  selectedPlaceName.value = null
  selectedStaticRegionName.value = null
  clearHighlight()
  updateSelectionUrl()
}

function tryApplySelectionFromUrl() {
  const p = route.query.p
  const r = route.query.r
  if (typeof p === "string" && p) {
    selectStaticPlace(p, { immediate: true })
    return
  }
  if (typeof r === "string" && r) {
    selectStaticRegion(r, { immediate: true })
  }
}

function flyToPlace(p: { name: string; img: Pt }, opts?: { zoom?: number; closeAfter?: boolean }) {
  if (!viewer) return
  if (!isDmDevMode.value) {
    selectStaticPlace(p.name, { closeSearchAfter: opts?.closeAfter })
    return
  }
  const targetVp = viewer.viewport.imageToViewportCoordinates(p.img.x, p.img.y)
  if (opts?.zoom != null) {
    viewer.viewport.zoomTo(opts.zoom, targetVp, false)
  }
  viewer.viewport.panTo(targetVp, false)
  flashHighlight(p.name, p.img)
  if (opts?.closeAfter) closeSearch()
}

function onSearchInputKey(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault()
    e.stopPropagation()
    closeSearch()
    return
  }
  if (e.key === "ArrowDown") {
    e.preventDefault()
    searchActiveIndex.value = Math.min(searchActiveIndex.value + 1, Math.max(0, searchResults.value.length - 1))
    return
  }
  if (e.key === "ArrowUp") {
    e.preventDefault()
    searchActiveIndex.value = Math.max(searchActiveIndex.value - 1, 0)
    return
  }
  if (e.key === "Enter") {
    e.preventDefault()
    const r = searchResults.value[searchActiveIndex.value]
    if (r) flyToPlace(r, { zoom: 4, closeAfter: true })
    return
  }
}

watch(searchQuery, () => {
  searchActiveIndex.value = 0
})

function startDrawing(firstPoint: Pt) {
  drawing.active = true
  drawing.points = [{ img: firstPoint, screen: imagePxToScreen(firstPoint) }]
  drawing.cursorScreen = null
  selectedRegionId.value = null
}

function addDrawingVertex(img: Pt) {
  const screen = imagePxToScreen(img)
  const last = drawing.points[drawing.points.length - 1]
  if (last && Math.hypot(last.screen.x - screen.x, last.screen.y - screen.y) < 4) return
  drawing.points.push({ img, screen })
}

function cancelDrawing() {
  drawing.active = false
  drawing.points = []
  drawing.cursorScreen = null
}

function finalizeDrawing() {
  if (drawing.points.length < 3) {
    cancelDrawing()
    return
  }
  const name = window.prompt("Name der Region:", "")
  if (name == null) {
    cancelDrawing()
    return
  }
  const trimmed = name.trim()
  if (!trimmed) {
    cancelDrawing()
    return
  }
  regions.value.push({
    id: genId(),
    name: trimmed,
    points: drawing.points.slice(),
  })
  cancelDrawing()
  saveRegionsToStorage()
}

function selectRegion(id: string) {
  if (drawing.active) return
  selectedRegionId.value = selectedRegionId.value === id ? null : id
}

function deleteRegion(id: string) {
  const region = regions.value.find(r => r.id === id)
  if (!region) return
  if (!window.confirm(`Region "${region.name}" löschen?`)) return
  regions.value = regions.value.filter(r => r.id !== id)
  if (selectedRegionId.value === id) selectedRegionId.value = null
  saveRegionsToStorage()
}

function renameRegion(id: string) {
  const region = regions.value.find(r => r.id === id)
  if (!region) return
  const name = window.prompt("Region umbenennen:", region.name)
  if (name == null) return
  const trimmed = name.trim()
  if (!trimmed) return
  region.name = trimmed
  saveRegionsToStorage()
}

function insertVertex(regionId: string, afterIndex: number) {
  const region = regions.value.find(r => r.id === regionId)
  if (!region) return
  const a = region.points[afterIndex]
  const b = region.points[(afterIndex + 1) % region.points.length]
  if (!a || !b) return
  const mid: Pt = { x: (a.img.x + b.img.x) / 2, y: (a.img.y + b.img.y) / 2 }
  region.points.splice(afterIndex + 1, 0, { img: mid, screen: imagePxToScreen(mid) })
  saveRegionsToStorage()
}

function deleteVertex(regionId: string, index: number) {
  const region = regions.value.find(r => r.id === regionId)
  if (!region) return
  if (region.points.length <= 3) return
  region.points.splice(index, 1)
  saveRegionsToStorage()
}

function onVertexPointerDown(e: PointerEvent, regionId: string, index: number) {
  e.preventDefault()
  e.stopPropagation()
  if (e.shiftKey) {
    deleteVertex(regionId, index)
    return
  }
  if (e.button !== 0) return
  draggingVertex.value = { regionId, index, pointerId: e.pointerId }
  try {
    (e.currentTarget as Element).setPointerCapture(e.pointerId)
  } catch {}
}

function onVertexPointerMove(e: PointerEvent) {
  const drag = draggingVertex.value
  if (!drag || drag.pointerId !== e.pointerId) return
  e.preventDefault()
  e.stopPropagation()
  const region = regions.value.find(r => r.id === drag.regionId)
  if (!region) return
  const vertex = region.points[drag.index]
  if (!vertex) return
  const img = clientToImagePx(e.clientX, e.clientY)
  if (!img) return
  vertex.img = img
  vertex.screen = imagePxToScreen(img)
}

function onVertexPointerUp(e: PointerEvent) {
  const drag = draggingVertex.value
  if (!drag || drag.pointerId !== e.pointerId) return
  e.preventDefault()
  e.stopPropagation()
  draggingVertex.value = null
  saveRegionsToStorage()
  try {
    (e.currentTarget as Element).releasePointerCapture(e.pointerId)
  } catch {}
}

function onSvgInteractiveDown(e: PointerEvent) {
  e.stopPropagation()
  suppressNextCanvasClick = true
}

function regionCenter(region: Region): Pt {
  let sx = 0
  let sy = 0
  for (const p of region.points) {
    sx += p.screen.x
    sy += p.screen.y
  }
  const n = Math.max(1, region.points.length)
  return { x: sx / n, y: sy / n }
}

function regionImgCenter(region: Region): Pt {
  let sx = 0
  let sy = 0
  for (const p of region.points) {
    sx += p.img.x
    sy += p.img.y
  }
  const n = Math.max(1, region.points.length)
  return { x: sx / n, y: sy / n }
}

function regionPolygonString(points: RegionVertex[]) {
  return points.map(p => `${p.screen.x},${p.screen.y}`).join(" ")
}

function midpointOf(region: Region, i: number): Pt {
  const a = region.points[i]
  const b = region.points[(i + 1) % region.points.length]
  if (!a || !b) return { x: 0, y: 0 }
  return { x: (a.screen.x + b.screen.x) / 2, y: (a.screen.y + b.screen.y) / 2 }
}

function handleCanvasClick(evt: any) {
  if (suppressNextCanvasClick) {
    suppressNextCanvasClick = false
    return
  }
  if (isDragging) return
  if (!viewer) return
  const webPoint = evt.position
  const vpPoint = viewer.viewport.pointFromPixel(webPoint)
  const img = viewportToImagePx(vpPoint)

  if (mode.value === "measure") {
    addMeasurePoint(img)
    return
  }

  if (mode.value === "browse" && !isDmDevMode.value) {
    if (selectedPlaceName.value || selectedStaticRegionName.value) {
      clearStaticSelection()
    }
    return
  }

  if (mode.value === "places") {
    addPlace(img)
    return
  }

  if (mode.value === "regions") {
    if (drawing.active) {
      const first = drawing.points[0]
      if (first && drawing.points.length >= 3) {
        const dx = (webPoint?.x ?? 0) - first.screen.x
        const dy = (webPoint?.y ?? 0) - first.screen.y
        if (Math.hypot(dx, dy) <= SNAP_DISTANCE_PX) {
          finalizeDrawing()
          return
        }
      }
      addDrawingVertex(img)
      return
    }
    if (selectedRegionId.value) {
      selectedRegionId.value = null
      return
    }
    startDrawing(img)
    return
  }
}

async function handleCanvasDoubleClick(evt: any) {
  if (!viewer) return

  if (mode.value === "regions" && drawing.active) {
    finalizeDrawing()
    return
  }

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

const draftPolylinePoints = computed(() =>
  drawing.points.map(p => `${p.screen.x},${p.screen.y}`).join(" "),
)

const draftPreviewLine = computed(() => {
  if (!drawing.active || !drawing.cursorScreen || drawing.points.length === 0) return null
  const last = drawing.points[drawing.points.length - 1]!
  return { x1: last.screen.x, y1: last.screen.y, x2: drawing.cursorScreen.x, y2: drawing.cursorScreen.y }
})

const devHint = computed(() => {
  if (mode.value === "places") return "Klick: Ort setzen · Klick auf Ort: löschen · Strg+S: JSON laden"
  if (mode.value === "regions") {
    if (drawing.active) return "Klick: Punkt · Doppelklick / Klick auf Start: schließen · Esc: abbrechen"
    if (selectedRegionId.value) return "Vertex ziehen · Shift-Klick: Punkt löschen · + zwischen Punkten: einfügen"
    return "Klick: neue Region zeichnen · Klick auf Region: bearbeiten · Strg+S: JSON laden"
  }
  return ""
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
  if (e.key === "Escape") {
    if (searchOpen.value) {
      closeSearch()
      return
    }
    if (regionsPanelOpen.value) {
      regionsPanelOpen.value = false
      return
    }
    if (mode.value === "regions" && drawing.active) {
      cancelDrawing()
      return
    }
    if (mode.value === "regions" && selectedRegionId.value) {
      selectedRegionId.value = null
      return
    }
    if (mode.value === "measure") resetMeasure()
    if (!isDmDevMode.value && (selectedPlaceName.value || selectedStaticRegionName.value)) {
      clearStaticSelection()
    }
    return
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
    e.preventDefault()
    if (searchOpen.value) closeSearch()
    else openSearch()
    return
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
    if (!isDmDevMode.value) return
    e.preventDefault()
    if (mode.value === "places") downloadPlaces()
    else if (mode.value === "regions") downloadRegions()
  }
}

function onCanvasMouseMove(e: MouseEvent) {
  if (mode.value !== "regions" || !drawing.active || !el.value) return
  const rect = el.value.getBoundingClientRect()
  drawing.cursorScreen = { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

watch(mode, (newMode, oldMode) => {
  if (oldMode === "measure") resetMeasure()
  if (oldMode === "regions") {
    cancelDrawing()
    selectedRegionId.value = null
  }
})

watch(isDmDevMode, (val) => {
  if (val) {
    if (mode.value !== "places" && mode.value !== "regions") mode.value = "places"
  } else {
    if (mode.value === "places" || mode.value === "regions") {
      cancelDrawing()
      selectedRegionId.value = null
      mode.value = "browse"
    }
  }
})

onMounted(() => {
  if (!el.value) return

  loadPlacesFromStorage()
  loadRegionsFromStorage()
  loadRegionVisibility()

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
    tryApplySelectionFromUrl()
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

  window.addEventListener("keydown", onKeyDown)
  el.value.addEventListener("mousemove", onCanvasMouseMove)
})

watch(
  () => measure.points.length,
  () => {
    maybeCalibrateAfterSecondPoint()
  },
)

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown)
  if (el.value) el.value.removeEventListener("mousemove", onCanvasMouseMove)
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
  if (copiedTimer) window.clearTimeout(copiedTimer)
  if (highlightTimer) window.clearTimeout(highlightTimer)
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
        <linearGradient id="regionGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fbbf24" stop-opacity="0.55" />
          <stop offset="1" stop-color="#f97316" stop-opacity="0.55" />
        </linearGradient>
        <linearGradient id="regionGradSel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#34d399" stop-opacity="0.65" />
          <stop offset="1" stop-color="#06b6d4" stop-opacity="0.65" />
        </linearGradient>
      </defs>

      <polyline
        v-if="measure.points.length >= 2"
        :points="measurePolylinePoints"
        class="measure-line"
      />
      <circle
        v-for="(p, idx) in measure.points"
        :key="'mp' + idx"
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

      <template v-if="isDmDevMode">
        <g v-for="region in regions" :key="region.id">
          <polygon
            :points="regionPolygonString(region.points)"
            class="region"
            :class="{ selected: selectedRegionId === region.id }"
            @pointerdown="onSvgInteractiveDown($event)"
            @click.stop="selectRegion(region.id)"
          />
          <g v-if="region.points.length > 0" class="region-label-group" :class="{ selected: selectedRegionId === region.id }" pointer-events="none">
            <rect
              :x="regionCenter(region).x - (region.name.length * 4 + 12)"
              :y="regionCenter(region).y - 12"
              :width="region.name.length * 8 + 24"
              height="22"
              rx="6"
              class="region-label-bg"
            />
            <text
              :x="regionCenter(region).x"
              :y="regionCenter(region).y + 4"
              class="region-label"
              text-anchor="middle"
            >{{ region.name }}</text>
          </g>

          <template v-if="selectedRegionId === region.id">
            <circle
              v-for="(pt, i) in region.points"
              :key="'mid-' + region.id + '-' + i"
              :cx="midpointOf(region, i).x"
              :cy="midpointOf(region, i).y"
              r="5"
              class="region-mid"
              @pointerdown="onSvgInteractiveDown($event)"
              @click.stop="insertVertex(region.id, i)"
            />
            <circle
              v-for="(pt, i) in region.points"
              :key="'v-' + region.id + '-' + i"
              :cx="pt.screen.x"
              :cy="pt.screen.y"
              r="8"
              class="region-vertex"
              @pointerdown="onVertexPointerDown($event, region.id, i)"
              @pointermove="onVertexPointerMove($event)"
              @pointerup="onVertexPointerUp($event)"
              @pointercancel="onVertexPointerUp($event)"
            />
          </template>
        </g>

        <template v-if="drawing.active && drawing.points.length > 0">
          <polygon
            v-if="drawing.points.length >= 3"
            :points="draftPolylinePoints"
            class="region-draft-fill"
          />
          <polyline
            v-if="drawing.points.length >= 2"
            :points="draftPolylinePoints"
            class="region-draft-line"
          />
          <line
            v-if="draftPreviewLine"
            :x1="draftPreviewLine.x1"
            :y1="draftPreviewLine.y1"
            :x2="draftPreviewLine.x2"
            :y2="draftPreviewLine.y2"
            class="region-draft-preview"
          />
          <circle
            v-for="(pt, i) in drawing.points"
            :key="'draft-' + i"
            :cx="pt.screen.x"
            :cy="pt.screen.y"
            :r="i === 0 ? 8 : 5"
            class="region-draft-vertex"
            :class="{ first: i === 0 }"
          />
        </template>

        <g v-for="place in places" :key="place.id" class="place-group">
          <circle
            :cx="place.screen.x"
            :cy="place.screen.y + 1"
            r="9"
            class="place-shadow"
            pointer-events="none"
          />
          <circle
            :cx="place.screen.x"
            :cy="place.screen.y"
            r="7"
            class="place-dot"
            @pointerdown="onSvgInteractiveDown($event)"
            @click.stop="removePlace(place.id)"
          />
          <circle
            :cx="place.screen.x"
            :cy="place.screen.y"
            r="3"
            class="place-dot-inner"
            pointer-events="none"
          />
          <g pointer-events="none">
            <rect
              :x="place.screen.x + 10"
              :y="place.screen.y - 18"
              :width="place.name.length * 7 + 14"
              height="20"
              rx="5"
              class="place-label-bg"
            />
            <text :x="place.screen.x + 17" :y="place.screen.y - 4" class="place-label">{{ place.name }}</text>
          </g>
        </g>
      </template>

      <template v-if="!isDmDevMode">
        <g
          v-for="region in staticRegions"
          v-show="regionVisibility[region.name]"
          :key="region.id"
          class="static-region-group"
        >
          <polygon
            :points="staticRegionPolygonString(region.points)"
            class="static-region"
            :class="{ interactive: mode === 'browse', selected: selectedStaticRegionName === region.name }"
            :style="{ fill: region.color, stroke: region.color }"
            @pointerdown="onSvgInteractiveDown($event)"
            @click.stop="mode === 'browse' && selectStaticRegion(region.name)"
          />
          <g class="static-region-label-group" pointer-events="none">
            <rect
              :x="staticRegionScreenCenter(region).x - (region.name.length * 4 + 14)"
              :y="staticRegionScreenCenter(region).y - 13"
              :width="region.name.length * 8 + 28"
              height="24"
              rx="6"
              class="static-region-label-bg"
              :class="{ selected: selectedStaticRegionName === region.name }"
              :style="{ fill: region.color }"
            />
            <text
              :x="staticRegionScreenCenter(region).x"
              :y="staticRegionScreenCenter(region).y + 4"
              class="static-region-label"
              text-anchor="middle"
            >{{ region.name }}</text>
          </g>
        </g>

        <g v-for="place in staticPlaces" :key="place.id" class="static-place-group">
          <circle :cx="place.screen.x" :cy="place.screen.y + 1" r="6" class="static-place-shadow" pointer-events="none" />
          <circle
            :cx="place.screen.x"
            :cy="place.screen.y"
            r="4.5"
            class="static-place-dot"
            :class="{ interactive: mode === 'browse', selected: selectedPlaceName === place.name }"
            @pointerdown="onSvgInteractiveDown($event)"
            @click.stop="mode === 'browse' && selectStaticPlace(place.name)"
          />
          <circle :cx="place.screen.x" :cy="place.screen.y" r="1.8" class="static-place-dot-inner" pointer-events="none" />
          <text :x="place.screen.x + 8" :y="place.screen.y + 4" class="static-place-label-stroke" pointer-events="none">{{ place.name }}</text>
          <text :x="place.screen.x + 8" :y="place.screen.y + 4" class="static-place-label" pointer-events="none">{{ place.name }}</text>
        </g>

      </template>

      <g v-if="highlightedPlace" pointer-events="none" class="highlight-group">
        <circle :cx="highlightedPlace.screen.x" :cy="highlightedPlace.screen.y" r="22" class="highlight-pulse" />
        <circle :cx="highlightedPlace.screen.x" :cy="highlightedPlace.screen.y" r="13" class="highlight-pulse-2" />
        <circle :cx="highlightedPlace.screen.x" :cy="highlightedPlace.screen.y" r="6" class="highlight-core" />
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
      <template v-if="!isDmDevMode">
        <button class="btn" @click="mode = mode === 'measure' ? 'browse' : 'measure'">
          Mode: {{ mode }}
        </button>
        <button v-if="mode === 'measure' && measure.points.length" class="btn ghost" @click="resetMeasure()">
          Reset
        </button>
        <div v-if="!isCalibrateMode && measure.miles !== null" class="stat">Gesamt: {{ formatMiles(measure.miles) }}</div>
        <div v-if="isCalibrateMode" class="stat dev">devmode=calibrate</div>
      </template>

      <template v-else>
        <div class="dev-badge">DM-DEV</div>
        <button class="btn" :class="{ active: mode === 'places' }" @click="mode = 'places'">
          Orte <span class="count">{{ places.length }}</span>
        </button>
        <button class="btn" :class="{ active: mode === 'regions' }" @click="mode = 'regions'">
          Regionen <span class="count">{{ regions.length }}</span>
        </button>
        <button v-if="mode === 'places'" class="btn ghost" @click="downloadPlaces" title="Strg+S">
          ⬇ JSON
        </button>
        <button v-if="mode === 'regions'" class="btn ghost" @click="downloadRegions" title="Strg+S">
          ⬇ JSON
        </button>
        <button v-if="mode === 'regions' && drawing.active" class="btn ghost" @click="cancelDrawing">
          Abbrechen
        </button>
        <button v-if="mode === 'regions' && drawing.active && drawing.points.length >= 3" class="btn ghost" @click="finalizeDrawing">
          Schließen
        </button>
      </template>
    </div>

    <div v-if="isDmDevMode" class="hint-bar">{{ devHint }}</div>

    <div v-if="isDmDevMode && mode === 'places' && places.length > 0" class="dev-panel">
      <div class="panel-title">Orte ({{ places.length }})</div>
      <div class="panel-list">
        <div v-for="place in places" :key="place.id" class="panel-item">
          <button class="item-name" @click="centerOnImg(place.img)" :title="`x=${Math.round(place.img.x)} y=${Math.round(place.img.y)}`">
            {{ place.name }}
          </button>
          <button class="item-btn" @click="renamePlace(place.id)" title="Umbenennen">✎</button>
          <button class="item-btn danger" @click="removePlace(place.id)" title="Löschen">✕</button>
        </div>
      </div>
    </div>

    <div v-if="isDmDevMode && mode === 'regions' && regions.length > 0" class="dev-panel">
      <div class="panel-title">Regionen ({{ regions.length }})</div>
      <div class="panel-list">
        <div
          v-for="region in regions"
          :key="region.id"
          class="panel-item"
          :class="{ active: selectedRegionId === region.id }"
        >
          <button class="item-name" @click="selectRegion(region.id); centerOnImg(regionImgCenter(region))" :title="`${region.points.length} Punkte`">
            {{ region.name }}
          </button>
          <span class="item-meta">{{ region.points.length }}</span>
          <button class="item-btn" @click="renameRegion(region.id)" title="Umbenennen">✎</button>
          <button class="item-btn danger" @click="deleteRegion(region.id)" title="Löschen">✕</button>
        </div>
      </div>
    </div>

    <div class="topbar">
      <button class="iconbtn" :class="{ active: searchOpen }" @click="openSearch" title="Ort suchen (Strg+F)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
      </button>
      <button
        v-if="!isDmDevMode"
        class="iconbtn"
        :class="{ active: regionsPanelOpen }"
        @click="regionsPanelOpen = !regionsPanelOpen"
        title="Regionen"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
          <path d="M9 4 4 6.5v13L9 17l6 2.5 5-2.5v-13L15 6.5 9 4z" />
          <path d="M9 4v13M15 6.5v13" />
        </svg>
      </button>
    </div>

    <div v-if="searchOpen" class="search-overlay" @click.self="closeSearch">
      <div class="search-box">
        <div class="search-row">
          <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <input
            ref="searchInputEl"
            v-model="searchQuery"
            class="search-input"
            type="text"
            placeholder="Ort suchen..."
            @keydown="onSearchInputKey"
          />
          <kbd class="search-hint">Esc</kbd>
        </div>
        <div class="search-results">
          <button
            v-for="(r, i) in searchResults"
            :key="r.id"
            class="search-result"
            :class="{ active: i === searchActiveIndex }"
            @click="flyToPlace(r, { zoom: 4, closeAfter: true })"
            @mouseenter="searchActiveIndex = i"
          >
            <span class="search-result-name">{{ r.name }}</span>
            <span class="search-result-coords">{{ Math.round(r.img.x) }}, {{ Math.round(r.img.y) }}</span>
          </button>
          <div v-if="searchResults.length === 0" class="search-empty">Keine Treffer</div>
        </div>
        <div class="search-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigieren</span>
          <span><kbd>↵</kbd> öffnen</span>
          <span>{{ searchablePlaces.length }} Orte</span>
        </div>
      </div>
    </div>

    <div v-if="regionsPanelOpen && !isDmDevMode" class="region-toggle-panel">
      <div class="rtp-header">
        <span class="rtp-title">Regionen</span>
        <div class="rtp-actions">
          <button class="rtp-link" @click="setAllRegions(true)">alle</button>
          <span class="rtp-sep">·</span>
          <button class="rtp-link" @click="setAllRegions(false)">keine</button>
          <button class="rtp-close" @click="regionsPanelOpen = false" title="Schließen">✕</button>
        </div>
      </div>
      <div class="rtp-list">
        <label
          v-for="region in staticRegions"
          :key="region.id"
          class="rtp-item"
          :class="{ off: !regionVisibility[region.name] }"
        >
          <input
            type="checkbox"
            :checked="regionVisibility[region.name]"
            @change="toggleRegion(region.name)"
          />
          <span class="rtp-swatch" :style="{ background: region.color }"></span>
          <span class="rtp-name">{{ region.name }}</span>
          <button
            class="rtp-fly"
            @click.prevent="flyToPlace({ name: region.name, img: { x: region.points.reduce((a, p) => a + p.img.x, 0) / region.points.length, y: region.points.reduce((a, p) => a + p.img.y, 0) / region.points.length } }, { zoom: 1.2 })"
            title="Hinfliegen"
          >→</button>
        </label>
      </div>
    </div>

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

.region {
  pointer-events: auto;
  cursor: pointer;
  fill: url(#regionGrad);
  stroke: #f97316;
  stroke-width: 2;
  stroke-linejoin: round;
  transition: filter .15s;
  &:hover {
    filter: brightness(1.15);
  }
  &.selected {
    fill: url(#regionGradSel);
    stroke: #06b6d4;
    stroke-width: 3;
    stroke-dasharray: 6 4;
  }
}

.region-label-group {
  .region-label-bg {
    fill: rgba(0, 0, 0, 0.6);
    stroke: rgba(255, 255, 255, 0.14);
  }
  .region-label {
    fill: white;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
  &.selected .region-label-bg {
    fill: rgba(6, 182, 212, 0.85);
    stroke: rgba(255, 255, 255, 0.35);
  }
}

.region-vertex {
  pointer-events: auto;
  cursor: grab;
  fill: white;
  stroke: #06b6d4;
  stroke-width: 3;
  filter: url(#softShadow);
  &:active {
    cursor: grabbing;
    fill: #fbbf24;
  }
}

.region-mid {
  pointer-events: auto;
  cursor: copy;
  fill: rgba(255, 255, 255, 0.55);
  stroke: #06b6d4;
  stroke-width: 2;
  stroke-dasharray: 2 2;
  &:hover {
    fill: #34d399;
  }
}

.region-draft-fill {
  fill: rgba(251, 191, 36, 0.18);
  stroke: none;
  pointer-events: none;
}

.region-draft-line {
  fill: none;
  stroke: #fbbf24;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

.region-draft-preview {
  stroke: rgba(251, 191, 36, 0.55);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  pointer-events: none;
}

.region-draft-vertex {
  fill: white;
  stroke: #fbbf24;
  stroke-width: 2;
  pointer-events: none;
  filter: url(#softShadow);
  &.first {
    fill: #fbbf24;
    stroke: white;
    stroke-width: 3;
  }
}

.place-group {
  cursor: pointer;
}

.place-shadow {
  fill: rgba(0, 0, 0, 0.45);
  filter: blur(2px);
}

.place-dot {
  pointer-events: auto;
  cursor: pointer;
  fill: #f43f5e;
  stroke: white;
  stroke-width: 2.5;
  transition: fill .15s, transform .15s;
  &:hover {
    fill: #fbbf24;
  }
}

.place-dot-inner {
  fill: white;
}

.place-label-bg {
  fill: rgba(0, 0, 0, 0.7);
  stroke: rgba(255, 255, 255, 0.16);
}

.place-label {
  fill: white;
  font-size: 12px;
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

.dev-badge {
  background: linear-gradient(135deg, #f43f5e, #fbbf24);
  color: #1a0a0a;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
  padding: 4px 8px;
  border-radius: 6px;
}

.btn {
  border: 0;
  border-radius: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.14);
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background .15s, color .15s;
  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }
  &.active {
    background: linear-gradient(135deg, #06b6d4, #6366f1);
    color: white;
  }
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.08);
}

.count {
  display: inline-block;
  min-width: 18px;
  text-align: center;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 999px;
  font-size: 11px;
  padding: 1px 6px;
}

.hint-bar {
  position: absolute;
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  pointer-events: none;
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

.dev-panel {
  position: absolute;
  right: 12px;
  top: 60px;
  width: 260px;
  max-height: calc(100vh - 80px);
  background: rgba(10, 14, 22, 0.78);
  color: white;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-title {
  padding: 10px 12px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-list {
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.panel-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 6px;
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  &.active {
    background: rgba(6, 182, 212, 0.18);
    outline: 1px solid rgba(6, 182, 212, 0.5);
  }
}

.item-name {
  background: transparent;
  border: 0;
  color: white;
  text-align: left;
  font-size: 13px;
  padding: 4px 6px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover {
    color: #06b6d4;
  }
}

.item-meta {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-variant-numeric: tabular-nums;
}

.item-btn {
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  &.danger:hover {
    background: rgba(244, 63, 94, 0.25);
    color: #fda4af;
  }
}

.toast {
  position: absolute;
  right: 12px;
  bottom: 12px;
  background: rgba(0, 0, 0, 0.78);
  color: white;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-weight: 700;
}

.static-region {
  fill-opacity: 0.18;
  stroke-width: 2.5;
  stroke-opacity: 0.85;
  stroke-linejoin: round;
  pointer-events: none;
  transition: fill-opacity .15s, stroke-width .15s;
  &.interactive {
    pointer-events: auto;
    cursor: pointer;
    &:hover {
      fill-opacity: 0.32;
      stroke-opacity: 1;
    }
  }
  &.selected {
    fill-opacity: 0.42;
    stroke-width: 4;
    stroke-opacity: 1;
    stroke-dasharray: 10 5;
    filter: drop-shadow(0 0 6px currentColor);
  }
}

.static-region-label-bg {
  stroke: rgba(0, 0, 0, 0.65);
  stroke-width: 1;
  fill-opacity: 0.92;
  transition: fill-opacity .15s;
  &.selected {
    fill-opacity: 1;
    stroke: white;
    stroke-width: 1.5;
  }
}

.static-region-label {
  fill: white;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  paint-order: stroke;
  stroke: rgba(0, 0, 0, 0.55);
  stroke-width: 2;
  stroke-linejoin: round;
}

.static-place-shadow {
  fill: rgba(0, 0, 0, 0.55);
  filter: blur(1.5px);
}

.static-place-dot {
  fill: #f8fafc;
  stroke: rgba(15, 23, 42, 0.85);
  stroke-width: 1.5;
  pointer-events: none;
  transition: fill .15s, stroke .15s, r .15s;
  &.interactive {
    pointer-events: auto;
    cursor: pointer;
    &:hover {
      fill: #fbbf24;
      stroke: #f97316;
    }
  }
  &.selected {
    fill: #fbbf24;
    stroke: #f97316;
    stroke-width: 2.5;
  }
}

.static-place-dot-inner {
  fill: rgba(15, 23, 42, 0.85);
}

.static-place-label {
  fill: white;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.static-place-label-stroke {
  fill: none;
  stroke: rgba(0, 0, 0, 0.78);
  stroke-width: 3;
  stroke-linejoin: round;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
  paint-order: stroke;
}

.highlight-pulse,
.highlight-pulse-2 {
  fill: none;
  stroke: #fbbf24;
  animation: pulse 1.4s ease-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.highlight-pulse {
  stroke-width: 3;
  opacity: 0.85;
}

.highlight-pulse-2 {
  stroke-width: 2;
  opacity: 0.6;
  animation-delay: 0.45s;
}

.highlight-core {
  fill: #fbbf24;
  stroke: white;
  stroke-width: 2;
}

@keyframes pulse {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

.topbar {
  position: absolute;
  right: 12px;
  top: 12px;
  display: flex;
  gap: 6px;
  z-index: 5;
}

.iconbtn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.75);
  color: rgba(255, 255, 255, 0.92);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background .15s, color .15s, transform .1s;
  &:hover {
    background: rgba(30, 41, 59, 0.92);
  }
  &:active {
    transform: scale(0.96);
  }
  &.active {
    background: linear-gradient(135deg, #06b6d4, #6366f1);
    border-color: rgba(255, 255, 255, 0.25);
    color: white;
  }
}

.search-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  z-index: 10;
  backdrop-filter: blur(2px);
}

.search-box {
  width: min(520px, 92vw);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.search-icon {
  color: rgba(255, 255, 255, 0.55);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  color: white;
  font-size: 15px;
  font-family: inherit;
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

.search-hint {
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.4px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  padding: 2px 6px;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.65);
}

.search-results {
  max-height: 360px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.search-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  background: transparent;
  border: 0;
  border-left: 3px solid transparent;
  text-align: left;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  font-family: inherit;
  &:hover, &.active {
    background: rgba(6, 182, 212, 0.15);
    border-left-color: #06b6d4;
    color: white;
  }
}

.search-result-name {
  font-weight: 600;
}

.search-result-coords {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}

.search-empty {
  padding: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.search-footer {
  display: flex;
  gap: 14px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  kbd {
    font-family: inherit;
    background: rgba(255, 255, 255, 0.08);
    padding: 1px 5px;
    border-radius: 3px;
    margin-right: 4px;
    font-size: 10px;
  }
  span:last-child {
    margin-left: auto;
  }
}

.region-toggle-panel {
  position: absolute;
  right: 12px;
  top: 60px;
  width: 280px;
  max-height: calc(100vh - 80px);
  background: rgba(15, 23, 42, 0.92);
  color: white;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 6;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
}

.rtp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.rtp-title {
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.rtp-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rtp-link {
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  cursor: pointer;
  padding: 2px 4px;
  font-family: inherit;
  &:hover {
    color: #06b6d4;
  }
}

.rtp-sep {
  color: rgba(255, 255, 255, 0.25);
}

.rtp-close {
  margin-left: 4px;
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
}

.rtp-list {
  overflow-y: auto;
  padding: 6px;
}

.rtp-item {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity .15s;
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  &.off {
    opacity: 0.45;
  }
  input[type="checkbox"] {
    accent-color: #06b6d4;
    width: 14px;
    height: 14px;
    cursor: pointer;
  }
}

.rtp-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.rtp-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rtp-fly {
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 14px;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 700;
  &:hover {
    background: rgba(6, 182, 212, 0.18);
    color: #06b6d4;
  }
}
</style>
