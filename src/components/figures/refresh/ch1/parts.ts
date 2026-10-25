import * as k from '../../../iso/iso-kit'

type ShapeMeta =
  | { kind: 'slab'; plan: k.Plan; z: number; h: number; projection: k.Projection }
  | { kind: 'cylinder'; x: number; y: number; r: number; z: number; h: number; projection: k.Projection }
const shapeMeta = new WeakMap<object, ShapeMeta>()
let partIndex = 0

/** Preserve the actual 3D arguments used by iso-kit drawing calls on their returned SVG group. */
export function trackedKit(kit: typeof k): typeof k {
  return new Proxy(kit, {
    get(target, property, receiver) {
      if (property === 'slabOf') return (plan: k.Plan, z: number, h: number, P: k.Projection, ...rest: unknown[]) => {
        const paths = target.slabOf(plan, z, h, P, ...(rest as Parameters<typeof k.slabOf>[4][]))
        shapeMeta.set(paths, { kind: 'slab', plan: { ...plan }, z, h, projection: { ...P, origin: [...P.origin] } })
        return paths
      }
      if (property === 'cylinder') return (x: number, y: number, r: number, z: number, h: number, P: k.Projection, ...rest: unknown[]) => {
        const paths = target.cylinder(x, y, r, z, h, P, ...(rest as Parameters<typeof k.cylinder>[6][]))
        shapeMeta.set(paths, { kind: 'cylinder', x, y, r, z, h, projection: { ...P, origin: [...P.origin] } })
        return paths
      }
      return Reflect.get(target, property, receiver)
    },
  }) as typeof k
}

const drawKit = trackedKit(k)
export type P3 = k.Point3
export const W = 700
export const H = 385
export const at = (p: P3, P: k.Projection) => k.iso(p, P)
export const S = (p: k.SolidPaths, tone: k.SolidStyle['tone'] = 'mid') => {
  const svg = k.solidSvg(p, { tone })
  const meta = shapeMeta.get(p)
  if (!meta) return svg
  const index = ++partIndex
  const proj = meta.projection
  const common = `data-anatomy-part="${index}" data-projection-scale="${proj.scale}" data-projection-azimuth="${proj.azimuth ?? 45}" data-projection-elevation="${proj.elevation ?? 30}" data-projection-origin-x="${proj.origin[0]}" data-projection-origin-y="${proj.origin[1]}"`
  const attrs = meta.kind === 'slab'
    ? `${common} data-shape="slab" data-x="${meta.plan.x}" data-y="${meta.plan.y}" data-w="${meta.plan.w}" data-d="${meta.plan.d}" data-r="${meta.plan.r}" data-z="${meta.z}" data-h="${meta.h}"`
    : `${common} data-shape="cylinder" data-x="${meta.x}" data-y="${meta.y}" data-radius="${meta.r}" data-z="${meta.z}" data-h="${meta.h}"`
  return `<g ${attrs}>${svg}</g>`
}
export const L = (d: string, tone: k.LineStyle['tone'] = 'faint') => k.lineSvg(d, { tone })
export const T = (p: P3, label: string, P: k.Projection, size = 8, tone = 'hi') => {
  const [x, y] = at(p, P)
  return `<text class="iso-face-text" data-tone="${tone}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" text-anchor="middle">${label}</text>`
}
export const projection = (plan: k.Plan, z = 48, pad = 20) =>
  k.fitProjection([...k.boxCorners(plan, -13, 7), ...k.boxCorners({ ...plan, x: plan.x + 10, y: plan.y + 10, w: plan.w - 20, d: plan.d - 20 }, 0, z)], W, H, {
    pad,
    azimuth: 34,
    elevation: 31,
  })

/** A machine-specific mounting plate. The mounting geometry is shared; the mechanism above it is not. */
export function bed(P: k.Projection, plan: k.Plan, z = 0) {
  const a: string[] = []
  const bedLayer = (svg: string, layer: number) => svg.replace('data-anatomy-part=', `data-anatomy-bed-layer="${layer}" data-anatomy-part=`)
  const feet: string[] = []
  for (const [x, y] of k.corners(plan, 7)) {
    feet.push(bedLayer(S(drawKit.cylinder(x, y, 5, z - 13, 5, P, 16), 'lo'), 0))
  }
  a.push(...feet)
  a.push(bedLayer(S(drawKit.slabOf({ ...plan, x: plan.x - 8, y: plan.y - 8, w: plan.w + 16, d: plan.d + 16, r: 7 }, z - 8, 8, P, 8, 1), 'lo').replace('data-anatomy-part=', 'data-anatomy-ground="true" data-anatomy-part='), 1))
  a.push(bedLayer(S(drawKit.slabOf(plan, z, 6, P, 8, 0.8), 'mid'), 2))
  a.push(L(k.planOutline(k.insetPlan(plan, 4), z + 6, P), 'faint'))
  for (const [x, y] of k.corners(plan, 7)) {
    a.push(bedLayer(S(drawKit.cylinder(x, y, 2.6, z + 6, 1, P, 12), 'hi'), 3))
    a.push(L(k.segment([x - 1.3, y, z + 7.1], [x + 1.3, y, z + 7.1], P), 'faint'))
  }
  // Edge ruler: the rule belongs to a real raised strip and every tick lands on its edge.
  const ruler = { x: plan.x + 12, y: plan.y + plan.d - 11, w: plan.w - 24, d: 5, r: 1 }
  a.push(bedLayer(S(drawKit.slabOf(ruler, z + 6, 0.8, P, 4), 'lo'), 4))
  const ticks = k.topTicks(ruler.x + 1, ruler.x + ruler.w - 1, 5, 7, ruler.y + 0.6, z + 6.8, [1.5, 3], P)
  a.push(L(ticks.minor, 'faint'), L(ticks.major, 'mid'))
  return a.join('')
}

export function fastenerRow(xs: number[], y: number, z: number, P: k.Projection) {
  return xs.map((x) => S(drawKit.cylinder(x, y, 1.8, z, 1.1, P, 10), 'lo')).join('')
}

export function rail(x: number, y: number, length: number, z: number, P: k.Projection, axis: 'x' | 'y' = 'x') {
  const plan = axis === 'x'
    ? { x, y, w: length, d: 4, r: 1 }
    : { x, y, w: 4, d: length, r: 1 }
  const out = [S(drawKit.slabOf(plan, z, 3.5, P, 4, 0.4), 'mid')]
  const n = Math.floor(length / 12)
  for (let i = 1; i < n; i++) {
    const cx = axis === 'x' ? x + i * length / n : x + 2
    const cy = axis === 'x' ? y + 2 : y + i * length / n
    out.push(S(drawKit.cylinder(cx, cy, 1, z + 3.5, 0.8, P, 8), 'lo'))
  }
  return out.join('')
}

export function controlKnob(x: number, y: number, z: number, P: k.Projection, lit = false) {
  return S(drawKit.cylinder(x, y, 4.3, z, 5, P, 20), lit ? 'hi' : 'mid') +
    L(k.knurl(x, y, 3.6, z + 0.6, z + 4.6, 18, P), 'faint') +
    L(k.lineOnTop([x - 2, y], [x + 2.5, y], z + 5.1, P), lit ? 'hi' : 'lo')
}

export function panel(x: number, y: number, z: number, w: number, h: number, P: k.Projection) {
  const plan = { x, y, w, d: 3, r: 1 }
  const out = [S(drawKit.slabOf(plan, z, h, P, 5, 0.5), 'mid')]
  out.push(L(k.segment([x + 3, y + 3, z + h - 3], [x + w - 3, y + 3, z + h - 3], P), 'faint'))
  out.push(L(k.segment([x + 3, y + 3, z + 3], [x + w - 3, y + 3, z + 3], P), 'faint'))
  return out.join('')
}

export function grouped(children: string[]) { return children.join('') }
export const assembly = (name: string, svg: string) => `<g data-anatomy-assembly="${name}">${svg}</g>`

/** A true axis-aligned (x-axis) cylindrical shell, including its annular cut end. */
export function axialShell(x0: number, x1: number, cy: number, cz: number, outer: number, inner: number, P: k.Projection, tone: 'hi'|'mid'|'lo' = 'mid') {
  const n = 24
  const point = (x: number, r: number, i: number): P3 => {
    const a = 2 * Math.PI * i / n
    return [x, cy + r * Math.cos(a), cz + r * Math.sin(a)]
  }
  const fill = tone === 'hi' ? 'var(--anatomy-top)' : tone === 'lo' ? 'var(--anatomy-paper)' : 'var(--anatomy-face)'
  const side: string[] = []
  for (let i = 0; i < n; i++) {
    const p0 = point(x0, outer, i), p1 = point(x1, outer, i), p2 = point(x1, outer, i + 1), p3 = point(x0, outer, i + 1)
    const pts = [p0,p1,p2,p3].map(p => k.iso(p,P))
    const shade = i % 6 < 2 ? 'var(--anatomy-shade-3)' : i % 6 < 4 ? fill : 'var(--anatomy-shade-1)'
    side.push(`<path d="${k.pathOf(pts,true)}" fill="${shade}" stroke="var(--anatomy-shade-0)" stroke-width=".42"/>`)
  }
  const outerEnd = Array.from({length:n},(_,i)=>k.iso(point(x1,outer,i),P))
  const innerEnd = Array.from({length:n},(_,i)=>k.iso(point(x1,inner,i),P))
  const end = `<path d="${k.pathOf(outerEnd,true)}${k.pathOf([...innerEnd].reverse(),true)}" fill="${fill}" fill-rule="evenodd" stroke="var(--anatomy-shade-0)" stroke-width=".55"/>`
  const innerWall = inner > 0 ? Array.from({length:n},(_,i)=>{
    const a=point(x0,inner,i), b=point(x1,inner,i), c=point(x1,inner,i+1), d=point(x0,inner,i+1)
    return `<path d="${k.pathOf([a,b,c,d].map(p=>k.iso(p,P)),true)}" fill="var(--anatomy-shade-1)" stroke="none"/>`
  }).join('') : ''
  const attrs = `data-anatomy-part="${++partIndex}" data-shape="axis-shell" data-x0="${x0}" data-x1="${x1}" data-y="${cy}" data-z="${cz}" data-outer="${outer}" data-inner="${inner}" data-projection-scale="${P.scale}" data-projection-azimuth="${P.azimuth ?? 45}" data-projection-elevation="${P.elevation ?? 30}" data-projection-origin-x="${P.origin[0]}" data-projection-origin-y="${P.origin[1]}"`
  return `<g ${attrs}>${side.join('')}${innerWall}${end}<path d="${k.pathOf(outerEnd,true)}" fill="none" stroke="var(--anatomy-hi)" stroke-width=".7"/></g>`
}

/** Swept, faceted round conductor following a 3D helical centreline. */
export function helicalWire(x0: number, x1: number, cy: number, cz: number, orbit: number, turns: number, phase: number, radius: number, P: k.Projection) {
  const rings = 72, sides = 8
  const norm = (v: P3): P3 => { const l=Math.hypot(...v)||1; return [v[0]/l,v[1]/l,v[2]/l] }
  const cross = (a:P3,b:P3):P3 => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
  const centers:P3[]=[]
  for(let i=0;i<=rings;i++){
    const u=i/rings, a=2*Math.PI*turns*u+phase
    centers.push([x0+(x1-x0)*u,cy+orbit*Math.cos(a),cz+orbit*Math.sin(a)])
  }
  const mesh:P3[][]=[]
  for(let i=0;i<=rings;i++){
    const prev=centers[Math.max(0,i-1)]!,next=centers[Math.min(rings,i+1)]!
    const tangent=norm([next[0]-prev[0],next[1]-prev[1],next[2]-prev[2]])
    let normal=norm(cross(tangent,[0,0,1])); if(Math.hypot(...normal)<.1) normal=norm(cross(tangent,[0,1,0]))
    const binormal=norm(cross(tangent,normal)),c=centers[i]!,ring:P3[]=[]
    for(let j=0;j<sides;j++){
      const a=2*Math.PI*j/sides
      ring.push([c[0]+radius*(normal[0]*Math.cos(a)+binormal[0]*Math.sin(a)),c[1]+radius*(normal[1]*Math.cos(a)+binormal[1]*Math.sin(a)),c[2]+radius*(normal[2]*Math.cos(a)+binormal[2]*Math.sin(a))])
    }
    mesh.push(ring)
  }
  const out:string[]=[]
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
    const p=[mesh[i]![j]!,mesh[i+1]![j]!,mesh[i+1]![(j+1)%sides]!,mesh[i]![(j+1)%sides]!].map(v=>k.iso(v,P))
    const shade=['var(--anatomy-shade-1)','var(--anatomy-face)','var(--anatomy-top)','var(--anatomy-shade-2)'][j%4]
    out.push(`<path d="${k.pathOf(p,true)}" fill="${shade}" stroke="var(--anatomy-shade-0)" stroke-width=".28"/>`)
  }
  const points = centers.map(p => `[${p.map(v => Number(v.toFixed(4))).join(',')}]`).join(';')
  const attrs = `data-anatomy-part="${++partIndex}" data-shape="tube" data-anatomy-cut-open="true" data-points="${points}" data-radius="${radius}" data-projection-scale="${P.scale}" data-projection-azimuth="${P.azimuth ?? 45}" data-projection-elevation="${P.elevation ?? 30}" data-projection-origin-x="${P.origin[0]}" data-projection-origin-y="${P.origin[1]}"`
  return `<g ${attrs}>${out.join('')}</g>`
}

/** A helical conductor divided into contiguous, individually tracked paint sections. */
export function helicalWireSections(x0: number, x1: number, cy: number, cz: number, orbit: number, turns: number, phase: number, radius: number, P: k.Projection, sections = 8, owner = 'twisted-pair', color: 'blue' | 'red' = 'blue') {
  const rings = sections * 12, sides = 8
  const norm = (v: P3): P3 => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l] }
  const cross = (a: P3, b: P3): P3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const centers: P3[] = []
  for (let i = 0; i <= rings; i++) { const u = i / rings, a = 2 * Math.PI * turns * u + phase; centers.push([x0 + (x1 - x0) * u, cy + orbit * Math.cos(a), cz + orbit * Math.sin(a)]) }
  const mesh: P3[][] = []
  for (let i = 0; i <= rings; i++) {
    const prev = centers[Math.max(0, i - 1)]!, next = centers[Math.min(rings, i + 1)]!, tangent = norm([next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]])
    let normal = norm(cross(tangent, [0, 0, 1])); if (Math.hypot(...normal) < .1) normal = norm(cross(tangent, [0, 1, 0]))
    const binormal = norm(cross(tangent, normal)), center = centers[i]!, ring: P3[] = []
    for (let j = 0; j < sides; j++) { const a = 2 * Math.PI * j / sides; ring.push([center[0] + radius * (normal[0] * Math.cos(a) + binormal[0] * Math.sin(a)), center[1] + radius * (normal[1] * Math.cos(a) + binormal[1] * Math.sin(a)), center[2] + radius * (normal[2] * Math.cos(a) + binormal[2] * Math.sin(a))]) }
    mesh.push(ring)
  }
  return Array.from({ length: sections }, (_, section) => {
    const first = section * 12, last = first + 12, faces: string[] = []
    for (let i = first; i < last; i++) for (let j = 0; j < sides; j++) {
      const p = [mesh[i]![j]!, mesh[i + 1]![j]!, mesh[i + 1]![(j + 1) % sides]!, mesh[i]![(j + 1) % sides]!].map((v) => k.iso(v, P))
      const opacity = [1, .84, .72, .9][j % 4]
      faces.push(`<path d="${k.pathOf(p, true)}" fill="var(--anatomy-${color})" fill-opacity="${opacity}" stroke="var(--anatomy-mid)" stroke-width=".55" stroke-linejoin="round"/>`)
    }
    const points = centers.slice(first, last + 1), encoded = points.map((p) => `[${p.map((v) => Number(v.toFixed(4))).join(',')}]`).join(';')
    const attrs = `data-anatomy-owner="${owner}" data-anatomy-part="${++partIndex}" data-shape="tube" data-anatomy-free-start="${section === 0}" data-anatomy-free-end="${section === sections - 1}" data-points="${encoded}" data-radius="${radius}" data-projection-scale="${P.scale}" data-projection-azimuth="${P.azimuth ?? 45}" data-projection-elevation="${P.elevation ?? 30}" data-projection-origin-x="${P.origin[0]}" data-projection-origin-y="${P.origin[1]}"`
    const center = centers[Math.floor((first + last) / 2)]!
    return { svg: `<g ${attrs}>${faces.join('')}</g>`, center }
  })
}
