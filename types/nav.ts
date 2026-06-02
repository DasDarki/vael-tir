export interface NavLink {
  label: string
  to: string
  desc?: string
  /** Kurzes Kürzel/Glyph für Karten & Marken. */
  glyph?: string
  /** Externer Link → öffnet in neuem Tab. */
  external?: boolean
}

/** Knoten im Atlas-Baum (aus den Routen-Meta abgeleitet). */
export interface PageNode {
  title: string
  link?: string
  children: PageNode[]
}
