export interface Realm {
  slug: string
  name: string
  kind: string
  tone: string
  tagline: string
  lead: string
  body: string[]
  regions: string[]
}

/**
 * Die drei großen Reiche Vael Tirs. Regionen-Namen entsprechen denen der Weltkarte
 * (siehe data/region-colors.json) und dienen als grobe Landstriche.
 */
export const realms: Realm[] = [
  {
    slug: 'calythar',
    name: 'Calythar',
    kind: 'Reich der Ordnung',
    tone: '#60a5fa',
    tagline: 'Im Licht liegt die Ordnung.',
    lead: 'Das Herz des Luminoxischen Zeitalters — wo Zeit verwaltet und Loyalität bekräftigt wird.',
    body: [
      'Calythar gilt als Fundament der bekannten Welt. Nach den Großen Kriegen wurde hier der Luminoxische Pakt geschlossen und mit ihm eine einzige, verbindliche Zeitrechnung durchgesetzt. Abweichung gilt als Relikt der Alten Welt.',
      'Von den calythischen Höhen im Norden bis zu den varethianischen Ebenen ist das Land in Stände, Ämter und Marken gegliedert. Die Luminare Garde wacht über die Grenzen, das Aurel über den Glauben.',
    ],
    regions: ['Calythische Höhen (Norden)', 'Valdorn', 'Ordensmarken', 'Varethianische Ebenen', 'Westen', 'Süden'],
  },
  {
    slug: 'eshraen',
    name: 'Esh’Raen',
    kind: 'Land der alten Lehren',
    tone: '#34d399',
    tagline: 'Was vergessen wurde, wird bewahrt.',
    lead: 'Ein Land, dessen Wissen älter ist als der Pakt — bewacht, reglementiert, nie ganz erloschen.',
    body: [
      'Esh’Raen trägt die Erinnerung an Zeiten vor der Setzung. Seine Archive und Schulen bewahren Lehren, die das Arkanum kontrolliert und das Aurel mit Misstrauen betrachtet.',
      'Hier ist die Grenze zwischen Wissen und Verbot dünn. Manche Pfade führen tiefer in die alte Welt, als die Ordnung es zugeben mag.',
    ],
    regions: [],
  },
  {
    slug: 'varkuun',
    name: 'Varkuun',
    kind: 'Die brennenden Marken',
    tone: '#ef4444',
    tagline: 'Ordnung muss verteidigt werden.',
    lead: 'Raues, umkämpftes Land — wo die Ordnung am dünnsten und das Feuer am nächsten ist.',
    body: [
      'Varkuun erstreckt sich über Nord, Zentrum und Süden — eine Mark, die mehr verteidigt als verwaltet wird. Auf verbranntem Grund gedeihen Pflanzen und Wesen, die anderswo keinen Halt fänden.',
      'Wer durch Varkuun reist, vertraut weniger auf Erlasse als auf den eigenen Stahl.',
    ],
    regions: ['Nordvarkuun', 'Zentralvarkuun', 'Südvarkuun'],
  },
]

export function findRealm(slug: string) {
  return realms.find((r) => r.slug === slug) ?? null
}
