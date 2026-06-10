// =============================================================
//  Live-Map — P2P-Sync von Marker & Messung über PeerJS
//
//  Kein eigenes Backend: PeerJS nutzt seine kostenlose Cloud-Signaling,
//  der eigentliche Datenaustausch läuft P2P über WebRTC-DataChannels.
//
//  Host (Spielleiter): stabile Peer-ID im localStorage → Perma-Link.
//  Viewer (Gruppe): verbinden sich mit der Host-ID, empfangen Zustand (read-only).
// =============================================================
import type { DataConnection, Peer } from 'peerjs'

export interface LivePoint {
  x: number
  y: number
}
export interface LiveState {
  marker: LivePoint | null
  measure: LivePoint[]
}

export type LiveRole = 'off' | 'host' | 'viewer'
export type LiveStatus = 'idle' | 'connecting' | 'online' | 'error'

const HOST_ID_KEY = 'vaeltir-livemap-host-id'

export function useLiveMap() {
  const role = ref<LiveRole>('off')
  const status = ref<LiveStatus>('idle')
  const peerCount = ref(0)
  const hostId = ref('')
  const remote = ref<LiveState | null>(null)
  const errorMsg = ref('')

  let peer: Peer | null = null
  const conns = new Set<DataConnection>()
  let provideState: (() => LiveState) | null = null
  let viewerConn: DataConnection | null = null
  let retryTimer: ReturnType<typeof setInterval> | null = null

  function storedHostId(): string | null {
    try {
      return localStorage.getItem(HOST_ID_KEY)
    } catch {
      return null
    }
  }

  // UUID, das auch in nicht-sicheren Kontexten funktioniert (crypto.randomUUID
  // gibt es nur unter HTTPS/localhost; getRandomValues hingegen überall).
  function uuid(): string {
    const c = typeof crypto !== 'undefined' ? crypto : undefined
    if (c?.randomUUID) return c.randomUUID()
    if (c?.getRandomValues) {
      const a = c.getRandomValues(new Uint8Array(16))
      a[6] = (a[6]! & 0x0f) | 0x40
      a[8] = (a[8]! & 0x3f) | 0x80
      const h = Array.from(a, (b) => b.toString(16).padStart(2, '0'))
      return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`
    }
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 14)}`
  }

  function ensureHostId(): string {
    let id = storedHostId()
    if (!id) {
      id = `vaeltir-live-${uuid()}`
      try {
        localStorage.setItem(HOST_ID_KEY, id)
      } catch {
        /* ignore */
      }
    }
    return id
  }

  type PeerConstructor = new (id?: string, options?: Record<string, unknown>) => Peer
  async function loadPeer(): Promise<PeerConstructor> {
    const mod: any = await import('peerjs')
    return (mod.Peer ?? mod.default) as PeerConstructor
  }

  // ---------- Host ----------
  async function startHost(stateProvider: () => LiveState) {
    if (role.value !== 'off') stop()
    provideState = stateProvider
    const id = ensureHostId()
    hostId.value = id
    role.value = 'host'
    status.value = 'connecting'
    errorMsg.value = ''

    const PeerCtor = await loadPeer()
    peer = new PeerCtor(id)

    peer.on('open', () => {
      status.value = 'online'
    })
    peer.on('connection', (conn: DataConnection) => {
      conn.on('open', () => {
        conns.add(conn)
        peerCount.value = conns.size
        // Aktuellen Zustand sofort an neuen Viewer senden (Spät-Beitritt).
        try {
          conn.send(provideState?.())
        } catch {
          /* ignore */
        }
      })
      const drop = () => {
        conns.delete(conn)
        peerCount.value = conns.size
      }
      conn.on('close', drop)
      conn.on('error', drop)
    })
    peer.on('disconnected', () => {
      try {
        peer?.reconnect()
      } catch {
        /* ignore */
      }
    })
    peer.on('error', (e: any) => {
      if (e?.type === 'unavailable-id') errorMsg.value = 'ID belegt — läuft schon eine andere Sitzung?'
      else errorMsg.value = e?.type || 'Verbindungsfehler'
      status.value = 'error'
    })
  }

  function broadcast(state: LiveState) {
    for (const c of conns) {
      try {
        c.send(state)
      } catch {
        /* ignore */
      }
    }
  }

  // ---------- Viewer ----------
  async function startViewer(id: string) {
    if (role.value !== 'off') stop()
    hostId.value = id
    role.value = 'viewer'
    status.value = 'connecting'
    errorMsg.value = ''

    const PeerCtor = await loadPeer()
    peer = new PeerCtor()

    peer.on('open', () => connectToHost(id))
    peer.on('disconnected', () => {
      try {
        peer?.reconnect()
      } catch {
        /* ignore */
      }
    })
    peer.on('error', (e: any) => {
      // Host (noch) offline → still weiter versuchen statt hart zu scheitern.
      if (e?.type !== 'peer-unavailable') errorMsg.value = e?.type || 'Verbindungsfehler'
    })

    // Periodischer Reconnect, falls der Host (noch) nicht da ist.
    retryTimer = setInterval(() => {
      if (role.value === 'viewer' && status.value !== 'online') connectToHost(id)
    }, 4000)
  }

  function connectToHost(id: string) {
    if (!peer || peer.destroyed) return
    if (viewerConn && viewerConn.open) return
    try {
      const conn = peer.connect(id, { reliable: true })
      viewerConn = conn
      conn.on('open', () => {
        status.value = 'online'
      })
      conn.on('data', (data: unknown) => {
        remote.value = data as LiveState
      })
      conn.on('close', () => {
        status.value = 'connecting'
        viewerConn = null
      })
      conn.on('error', () => {
        status.value = 'connecting'
      })
    } catch {
      status.value = 'connecting'
    }
  }

  // ---------- Teardown ----------
  function stop() {
    if (retryTimer) {
      clearInterval(retryTimer)
      retryTimer = null
    }
    try {
      peer?.destroy()
    } catch {
      /* ignore */
    }
    peer = null
    conns.clear()
    viewerConn = null
    provideState = null
    role.value = 'off'
    status.value = 'idle'
    peerCount.value = 0
    remote.value = null
    errorMsg.value = ''
    hostId.value = ''
  }

  onScopeDispose(() => stop())

  return {
    role,
    status,
    peerCount,
    hostId,
    remote,
    errorMsg,
    storedHostId,
    ensureHostId,
    startHost,
    startViewer,
    broadcast,
    stop,
  }
}
