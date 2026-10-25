import * as k from '../../../iso/iso-kit'

export const W = 820
export const H = 430
export type P = k.Projection
export const plan = (x: number, y: number, w: number, d: number, r = 2) => ({ x, y, w, d, r })
export const projection = (points: k.Point3[], azimuth = 43, elevation = 32) => {
  // Fit the complete 3D bounds. The extrema of an isometric projection can
  // come from any of the eight corners, not just the two diagonal corners.
  const xs = points.map(([x]) => x), ys = points.map(([, y]) => y), zs = points.map(([, , z]) => z)
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)]
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)]
  const [z0, z1] = [Math.min(...zs), Math.max(...zs)]
  const corners: k.Point3[] = []
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) corners.push([x, y, z])
  return k.fitProjection(corners, W, H, { pad: 28, headroom: 14, azimuth, elevation })
}
type ShapeRole = { ground?: boolean; logical?: boolean; assembly?: string }
export const box = (P: P, x: number, y: number, w: number, d: number, z: number, h: number, tone: k.Tone = 'mid', name = 'solid', role: ShapeRole = {}) =>
  `<g data-part="${name}" data-assembly="${role.assembly ?? name}" data-ground="${role.ground === true}" data-audit="${role.logical === true ? 'logical' : 'physical'}" data-shape="slab" data-x="${x}" data-y="${y}" data-w="${w}" data-d="${d}" data-z="${z}" data-h="${h}">${k.solidSvg(k.slabOf(plan(x, y, w, d), z, h, P, 4, 0.8), { tone, crease: 'faint' })}</g>`
export const round = (P: P, x: number, y: number, radius: number, z: number, h: number, tone: k.Tone = 'hi', name = 'turning', role: ShapeRole = {}) =>
  `<g data-part="${name}" data-assembly="${role.assembly ?? name}" data-ground="${role.ground === true}" data-audit="${role.logical === true ? 'logical' : 'physical'}" data-shape="cylinder" data-x="${x}" data-y="${y}" data-r="${radius}" data-z="${z}" data-h="${h}">${k.solidSvg(k.cylinder(x, y, radius, z, h, P, 20, 0.4), { tone, crease: 'faint' })}</g>`
export const stroke = (d: string, tone: k.LineTone = 'lo', flow = false) => k.lineSvg(d, { tone, flow })
export const seg3 = (P: P, a: k.Point3, b: k.Point3) => k.segment(a, b, P)
export const port = (P: P, at: k.Point3, name: string) => {
  const [x, y] = k.iso(at, P)
  return `<circle data-part="${name}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="var(--anatomy-strong)" stroke="var(--anatomy-strong)" stroke-width="1" />`
}
export const wire = (P: P, a: k.Point3, b: k.Point3, name: string, tone: k.LineTone = 'mid', flow = false) => {
  const d = k.segment(a, b, P)
  const path = k.lineSvg(d, { tone, flow }).replace('<path', '<path stroke-dasharray="5 4"')
  return `<g data-part="${name}" data-audit="logical">${path}</g>`
}
export const topLine = (P: P, a: k.Plane, b: k.Plane, z: number) => k.lineOnTop(a, b, z, P)
export const text = (P: P, at: k.Point3, value: string, size = 10, _fill = '#334155') => {
  const [x, y] = k.iso(at, P)
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" text-anchor="middle" fill="var(--anatomy-strong)" font-family="system-ui,sans-serif" font-weight="650">${value}</text>`
}
export function bench(P: P, label: string) {
  const out = [box(P, -230, -85, 460, 170, 0, 12, 'lo', `${label}-base`)]
  for (const [x, y] of [[-210, -65], [200, -65], [-210, 65], [200, 65]] as const) {
    out.push(round(P, x, y, 8, -10, 10, 'mid', `${label}-foot`))
  }
  for (const [x, y] of [[-215, -70], [-215, 70], [215, -70], [215, 70], [-110, -70], [-110, 70], [110, -70], [110, 70]] as const) {
    out.push(round(P, x, y, 2.6, 12, 1.8, 'hi', `${label}-fastener`))
  }
  out.push(box(P, -220, -88, 440, 8, 12, 2, 'mid', `${label}-front-rail`))
  out.push(box(P, -220, 80, 440, 8, 12, 2, 'mid', `${label}-back-rail`))
  out.push(box(P, -220, -80, 8, 160, 12, 2, 'mid', `${label}-left-trim`))
  out.push(box(P, 212, -80, 8, 160, 12, 2, 'mid', `${label}-right-trim`))
  return out.join('')
}
export const ease = (x: number) => { const v = Math.max(0, Math.min(1, x)); return v * v * (3 - 2 * v) }
export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/** Order rendered solid groups with the same camera depth used by Anatomy. */
export function depthSortSvg(markup: string, P: P) {
  const groups = [...markup.matchAll(/<g\s+([^>]*data-shape="(?:slab|cylinder)"[^>]*)>/g)].map((match) => {
    const start = match.index!
    const tags = /<\/?g\b[^>]*>/g
    tags.lastIndex = start
    let level = 0, end = start
    for (let tag;(tag = tags.exec(markup));) {
      if (tag[0].startsWith('</')) level--
      else level++
      if (level === 0) { end = tags.lastIndex; break }
    }
    if (!end) throw new Error('unclosed solid group')
    const attrs = match[1]!
    const get = (key: string) => Number(attrs.match(new RegExp(`(?:^|\\s)${key}="([^"]*)"`))?.[1])
    const shape = attrs.match(/data-shape="([^"]+)"/)?.[1]
    const x = get('data-x'), y = get('data-y'), z = get('data-z')
    const center: k.Point3 = shape === 'slab'
      ? [x + get('data-w') / 2, y + get('data-d') / 2, z + get('data-h') / 2]
      : [x, y, z + get('data-h') / 2]
    const assembly = attrs.match(/data-assembly="([^"]+)"/)?.[1] ?? attrs.match(/data-part="([^"]+)"/)?.[1] ?? `part-${start}`
    return { start, end, html: markup.slice(start, end), assembly, ground: attrs.includes('data-ground="true"'), key: attrs.includes('data-ground="true"') ? -Infinity : k.depthOf(center, P) }
  })
  const assemblies = new Map<string, typeof groups>()
  for (const group of groups) assemblies.set(group.assembly, [...(assemblies.get(group.assembly) ?? []), group])
  const blocks = [...assemblies].map(([name, parts]) => ({
    name,
    parts,
    ground: parts.some(part => part.ground),
    key: parts.reduce((sum, part) => sum + part.key, 0) / parts.length,
  })).sort((a, b) => a.ground ? -1 : b.ground ? 1 : a.key - b.key)
  const wrappers = blocks.map(block => `<g data-assembly="${block.name}">${block.parts.map(part => part.html).join('')}</g>`).join('')
  const first = groups[0]!.start, last = groups[groups.length - 1]!.end
  const overlays: string[] = []
  let cursor = first
  for (const group of groups) {
    overlays.push(markup.slice(cursor, group.start))
    cursor = group.end
  }
  overlays.push(markup.slice(cursor, last))
  return markup.slice(0, first) + wrappers + overlays.join('') + markup.slice(last)
}
