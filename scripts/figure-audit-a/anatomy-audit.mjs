import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const home = process.env.USERPROFILE || process.env.HOME || ''
const skillRoot = process.env.ANATOMY_SKILL_DIR || path.join(home, '.codex', 'skills', 'anatomy')
const auditUrl = pathToFileURL(path.join(skillRoot, 'kit', 'audit.mjs')).href
const latheUrl = pathToFileURL(path.join(skillRoot, 'kit', 'lathe.mjs')).href
let A, G
try {
  A = await import(auditUrl)
  G = await import(latheUrl)
} catch (error) {
  console.error(`Anatomy kit unavailable at ${skillRoot}. Set ANATOMY_SKILL_DIR to the installed anatomy skill directory.`)
  console.error(error.message)
  process.exit(2)
}

const figures = [
  ['f1.1.4-protocol-sequence', '/src/components/figures/refresh/ch1/ProtocolSequenceFigure.tsx'],
  ['f1.2.5-access-network', '/src/components/figures/refresh/ch1/AccessNetworkFigure.tsx'],
  ['f1.2.10-media', '/src/components/figures/refresh/ch1/MediaFigure.tsx'],
  ['f1.3.5-forwarding-routing', '/src/components/figures/refresh/ch1/ForwardingRoutingFigure.tsx'],
  ['f1.3.7-isp-hierarchy', '/src/components/figures/refresh/ch1/IspHierarchyFigure.tsx'],
  ['f1.4.1-throughput', '/src/components/figures/refresh/ch1/ThroughputFigure.tsx'],
  ['f1.4.6-loss', '/src/components/figures/refresh/ch1/PacketLossFigure.tsx'],
  ['f1.5.1-layer-service', '/src/components/figures/refresh/ch1/LayerServiceFigure.tsx'],
  ['f3.5.4-rtt-timeout', '/src/components/figures/refresh/ch3-control/RttTimeoutFigure.tsx'],
  ['f3.5.9-connection-management', '/src/components/figures/refresh/ch3-control/ConnectionManagementFigure.tsx'],
]
const requested = process.argv[2]
const requestedCase = process.argv.find((arg) => arg.startsWith('--case='))?.slice('--case='.length)
const selectedFigures = requested ? figures.filter(([id]) => id === requested) : figures
if (requested && selectedFigures.length === 0) throw new Error(`unknown figureId: ${requested}`)
const auditCases = {
  'f1.1.4-protocol-sequence': [
    { name: 'valid-request', props: { auditMode: 'valid', auditTime: .35 } },
    { name: 'valid-execute', props: { auditMode: 'valid', auditTime: 3.35 } },
    { name: 'invalid-blocked', props: { auditMode: 'invalid', auditTime: .35 } },
    { name: 'invalid-permitted', props: { auditMode: 'invalid', auditTime: 5.35 } },
  ],
  'f1.2.5-access-network': ['dsl', 'hfc', 'wireless'].flatMap((auditMode) => [
    { name: `${auditMode}-uplink`, props: { auditMode, auditTime: 1.7 } },
    { name: `${auditMode}-downlink`, props: { auditMode, auditTime: 3.7 } },
  ]),
  'f1.2.10-media': ['twisted', 'coax', 'fiber', 'radio'].flatMap((auditMode) => [
    { name: `${auditMode}-sample`, props: { auditMode, auditTime: .35 } },
    ...(auditMode === 'radio' ? [{ name: 'radio-wave-end', props: { auditMode, auditTime: .9 } }] : []),
  ]),
  'f1.3.5-forwarding-routing': ['datagram', 'virtual'].map((auditMode) => ({ name: auditMode, props: { auditMode, auditTime: 1.3 } })),
  'f1.3.7-isp-hierarchy': ['customer', 'peer', 'upstream'].map((auditMode) => ({ name: auditMode, props: { auditMode, auditTime: 0 } })),
  'f1.4.1-throughput': ['single', 'shared', 'bottleneck'].map((auditMode) => ({ name: auditMode, props: { auditMode, auditTime: 1.3 } })),
  'f1.4.6-loss': ['stable', 'burst'].flatMap((auditMode) => [
    { name: `${auditMode}-queued`, props: { auditMode, auditTime: 1.15 } },
    { name: `${auditMode}-drain`, props: { auditMode, auditTime: 6.1 } },
  ]),
  'f1.5.1-layer-service': [
    { name: 'five-application', props: { auditMode: 'five', auditTime: .2 } },
    { name: 'five-transport', props: { auditMode: 'five', auditTime: 1.4 } },
    { name: 'five-physical', props: { auditMode: 'five', auditTime: 4.7 } },
    { name: 'osi-session', props: { auditMode: 'osi', auditTime: 2.5 } },
    { name: 'osi-network', props: { auditMode: 'osi', auditTime: 4.8 } },
    { name: 'osi-physical', props: { auditMode: 'osi', auditTime: 7.1 } },
    { name: 'tcp-transport', props: { auditMode: 'tcp', auditTime: 1.4 } },
    { name: 'tcp-interface', props: { auditMode: 'tcp', auditTime: 3.6 } },
  ],
  'f3.5.4-rtt-timeout': [
    { name: 'sample-outbound', props: { auditMode: 'sample', auditTime: .6 } },
    { name: 'sample-return', props: { auditMode: 'sample', auditTime: 1.3 } },
    { name: 'estimate', props: { auditMode: 'estimate', auditTime: 1.3 } },
    { name: 'timer-ack-arrived', props: { auditMode: 'timer', auditAckMode: 'received', auditTime: .9 } },
    { name: 'timer-timeout', props: { auditMode: 'timer', auditAckMode: 'lost', auditTime: 1.7 } },
  ],
  'f3.5.9-connection-management': [
    { name: 'two-old-syn', props: { auditMode: 'two', auditTime: .3 } },
    { name: 'two-b-response', props: { auditMode: 'two', auditTime: 1.8 } },
    { name: 'two-reject-data', props: { auditMode: 'two', auditTime: 3.3 } },
    { name: 'two-rst-in-flight', props: { auditMode: 'two', auditTime: 4.5 } },
    { name: 'two-rst-arrived', props: { auditMode: 'two', auditTime: 5.85 } },
    { name: 'handshake-syn', props: { auditMode: 'three', auditTime: .3 } },
    { name: 'handshake-final-ack-flight', props: { auditMode: 'three', auditTime: 3.35 } },
    { name: 'handshake-confirmed', props: { auditMode: 'three', auditTime: 3.9 } },
    { name: 'close-fin-ack-flight', props: { auditMode: 'close', auditTime: 2.2 } },
    { name: 'close-b-fin', props: { auditMode: 'close', auditTime: 3.35 } },
    { name: 'time-wait', props: { auditMode: 'close', auditTime: 4.6 } },
    { name: 'time-wait-ack-arrival', props: { auditMode: 'close', auditTime: 5.8 } },
  ],
}

const num = (attrs, name) => {
  const value = attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]+)"`))?.[1]
  if (value == null || !Number.isFinite(Number(value))) throw new Error(`missing numeric ${name} on recorded geometry`)
  return Number(value)
}
const attr = (attrs, name) => attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1]
const readVecs = (text) => text.split(';').map((entry) => entry.slice(1, -1).split(',').map(Number))
const routeEnds = (attrs) => {
  const wholeCut = attr(attrs, 'data-anatomy-cut-open') === 'true'
  const startFree = attr(attrs, 'data-anatomy-free-start') === 'true' || (wholeCut && attr(attrs, 'data-anatomy-free-start') == null)
  const endFree = attr(attrs, 'data-anatomy-free-end') === 'true' || (wholeCut && attr(attrs, 'data-anatomy-free-end') == null)
  return { ends: [!startFree, !endFree], free: [startFree, endFree] }
}
function trackedGroups(markup) {
  const starts = [...markup.matchAll(/<g\s+([^>]*\bdata-anatomy-part="[^"]+"[^>]*)>/g)]
  return starts.map((match) => {
    const from = match.index
    const tags = /<\/?g\b[^>]*>/g
    tags.lastIndex = from
    let depth = 0, end = from
    for (let tag; (tag = tags.exec(markup));) {
      if (tag[0].startsWith('</')) depth--
      else depth++
      if (depth === 0) { end = tags.lastIndex; break }
    }
    if (!end) throw new Error('unclosed recorded geometry group')
    return { attrs: match[1], svg: markup.slice(from, end), from, end }
  })
}
function namedGroups(markup, attribute) {
  const starts = [...markup.matchAll(new RegExp(`<g\\s+([^>]*\\b${attribute}="[^"]+"[^>]*)>`,'g'))]
  return starts.map((match) => {
    const from = match.index, tags = /<\/?g\b[^>]*>/g
    tags.lastIndex = from
    let depth = 0, end = from
    for (let tag; (tag = tags.exec(markup));) {
      if (tag[0].startsWith('</')) depth--
      else depth++
      if (depth === 0) { end = tags.lastIndex; break }
    }
    if (!end) throw new Error(`unclosed ${attribute} group`)
    return { attrs: match[1], svg: markup.slice(from, end), from, end }
  })
}

const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' })
let failed = false
try {
  for (const [figureId, modulePath] of selectedFigures) {
    const figureModule = await server.ssrLoadModule(modulePath)
    const Figure = figureModule.default
    if (figureId === 'f3.5.9-connection-management') {
      const state = figureModule.connectionStates
      const checks = [
        ['three SYN before arrival', state('three', 0, .84), { a: 'SYN-SENT', b: 'LISTEN' }],
        ['three SYN after arrival', state('three', 0, .85), { a: 'SYN-SENT', b: 'SYN-RECEIVED' }],
        ['three SYN-ACK before arrival', state('three', 1, .84), { a: 'SYN-SENT', b: 'SYN-RECEIVED' }],
        ['three SYN-ACK after arrival', state('three', 1, .85), { a: 'ESTABLISHED', b: 'SYN-RECEIVED' }],
        ['three final ACK before arrival', state('three', 2, .84), { a: 'ESTABLISHED', b: 'SYN-RECEIVED' }],
        ['three final ACK after arrival', state('three', 2, .85), { a: 'ESTABLISHED', b: 'ESTABLISHED' }],
        ['close FIN before arrival', state('close', 0, .84), { a: 'FIN_WAIT_1', b: 'ESTABLISHED' }],
        ['close FIN after arrival', state('close', 0, .85), { a: 'FIN_WAIT_1', b: 'CLOSE_WAIT' }],
        ['close ACK before arrival', state('close', 1, .84), { a: 'FIN_WAIT_1', b: 'CLOSE_WAIT' }],
        ['close ACK after arrival', state('close', 1, .85), { a: 'FIN_WAIT_2', b: 'CLOSE_WAIT' }],
        ['close B FIN before arrival', state('close', 2, .84), { a: 'FIN_WAIT_2', b: 'LAST_ACK' }],
        ['close B FIN after arrival', state('close', 2, .85), { a: 'TIME_WAIT', b: 'LAST_ACK' }],
        ['close final ACK before arrival', state('close', 3, .84), { a: 'TIME_WAIT', b: 'LAST_ACK' }],
        ['close final ACK after arrival', state('close', 3, .85), { a: 'TIME_WAIT', b: 'CLOSED' }],
        ['two-message RST before arrival', state('two', 3, .84), { a: 'CLOSED', b: '误判 ESTABLISHED' }],
        ['two-message RST after arrival', state('two', 3, .85), { a: 'CLOSED', b: 'CLOSED' }],
      ]
      for (const [label, actual, expected] of checks) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`connection state assertion failed: ${label}: ${JSON.stringify(actual)}`)
      }
      console.log(`CONNECTION_STATE_ASSERTIONS ${checks.length} passed`)
    }
    const configuredCases = auditCases[figureId] || [{ name: 'default', props: {} }]
    const cases = requestedCase ? configuredCases.filter(({ name }) => name === requestedCase) : configuredCases
    if (requestedCase && cases.length === 0) throw new Error(`${figureId}: unknown audit case ${requestedCase}`)
    for (const auditCase of cases) {
    const html = renderToStaticMarkup(React.createElement(Figure, auditCase.props))
    const groups = trackedGroups(html)
    if (!groups.length) throw new Error(`${figureId}: SSR output has no recorded geometry`)
    const renderedSolids = (html.match(/class="iso-solid(?:\s|"|&)/g) || []).length
    const recordedSolids = groups.filter(({ attrs }) => ['slab', 'cylinder'].includes(attr(attrs, 'data-shape'))).length
    if (renderedSolids !== recordedSolids) throw new Error(`${figureId}: ${renderedSolids} rendered iso solids but only ${recordedSolids} corresponding records`)
    const first = groups[0].attrs
    const P = {
      scale: num(first, 'data-projection-scale'),
      azimuth: num(first, 'data-projection-azimuth'),
      elevation: num(first, 'data-projection-elevation'),
      origin: [num(first, 'data-projection-origin-x'), num(first, 'data-projection-origin-y')],
    }
    const groundNames = new Set(groups.flatMap((group, index) => attr(group.attrs, 'data-anatomy-ground') === 'true' ? [`${figureId}.rendered-${index + 1}`] : []))
    if (!groundNames.size) throw new Error(`${figureId}: rendered geometry has no explicit ground record`)
    const ground = (shape) => groundNames.has(shape.name)
    const R = A.recorder(P, { ground })
    let solids = 0, tubes = 0
    const assemblyGroups = namedGroups(html, 'data-anatomy-assembly')
    const assemblies = assemblyGroups.map((assembly, index) => ({ ...assembly, name: `${figureId}.assembly-${index + 1}`, parts: groups.filter((part) => part.from > assembly.from && part.end < assembly.end) }))
    const consumed = new Set(assemblies.flatMap((assembly) => assembly.parts))
    const recordShape = (attrs, name) => {
      const kind = attr(attrs, 'data-shape')
      const owner = attr(attrs, 'data-anatomy-owner')
      const meta = { name, ...(owner ? { owner } : {}) }
      if (kind === 'slab') return { shape: A.slab({ x: num(attrs, 'data-x'), y: num(attrs, 'data-y'), w: num(attrs, 'data-w'), d: num(attrs, 'data-d'), r: num(attrs, 'data-r') }, num(attrs, 'data-z'), num(attrs, 'data-h'), meta), at: [num(attrs, 'data-x') + num(attrs, 'data-w') / 2, num(attrs, 'data-y') + num(attrs, 'data-d') / 2, num(attrs, 'data-z') + num(attrs, 'data-h') / 2] }
      if (kind === 'cylinder') return { shape: A.cylinder(num(attrs, 'data-x'), num(attrs, 'data-y'), num(attrs, 'data-radius'), num(attrs, 'data-z'), num(attrs, 'data-h'), meta), at: [num(attrs, 'data-x'), num(attrs, 'data-y'), num(attrs, 'data-z') + num(attrs, 'data-h') / 2] }
      if (kind === 'axis-shell') { const x0 = num(attrs, 'data-x0'), x1 = num(attrs, 'data-x1'); return { shape: A.ring(G.frameAlong([x0, num(attrs, 'data-y'), num(attrs, 'data-z')], [1, 0, 0]), 0, x1 - x0, num(attrs, 'data-inner'), num(attrs, 'data-outer'), meta), at: [x0 + (x1 - x0) / 2, num(attrs, 'data-y'), num(attrs, 'data-z')] } }
      if (kind === 'tube') { const points = readVecs(attr(attrs, 'data-points')); return { shape: A.tube(points, num(attrs, 'data-radius'), meta), at: points[Math.floor(points.length / 2)], points, radius: num(attrs, 'data-radius'), owner } }
      return null
    }
    const recordIndividual = (group, index) => {
      const { attrs, svg } = group
      const name = `${figureId}.rendered-${index + 1}`
      const kind = attr(attrs, 'data-shape')
      if (kind === 'tube') {
        const points = readVecs(attr(attrs, 'data-points'))
        const radius = num(attrs, 'data-radius')
        const geometry = recordShape(attrs, name)
        const shapes = [R.solid(geometry.shape)]
        R.route(name, points, radius, { owner: geometry.owner ?? name, piece: figureId, ...routeEnds(attrs) })
        R.put({ piece: figureId, name, at: points[Math.floor(points.length / 2)], svg, shapes })
        tubes++
        return
      }
      const geometry = recordShape(attrs, name)
      if (!geometry) throw new Error(`${figureId}: unsupported recorded geometry shape ${kind}`)
      R.put({ piece: figureId, name, at: geometry.at, svg, shapes: [R.solid(geometry.shape)] })
      solids++
    }
    const recordAssembly = (assembly) => {
        const shapes = [], centers = [], routeParts = new Map()
        const local = A.recorder(P)
        for (const [partIndex, part] of assembly.parts.entries()) {
          const childName = `${figureId}.rendered-${groups.indexOf(part) + 1}`
          const geometry = recordShape(part.attrs, childName)
          if (!geometry) throw new Error(`${figureId}: assembly contains unsupported shape ${attr(part.attrs, 'data-shape')}`)
          shapes.push(R.solid(geometry.shape)); centers.push(geometry.at)
          if (attr(part.attrs, 'data-shape') === 'tube') {
            if (attr(part.attrs, 'data-anatomy-free-start') != null || attr(part.attrs, 'data-anatomy-free-end') != null) {
              const owner = geometry.owner ?? childName
              const sections = routeParts.get(owner) ?? []
              sections.push({ attrs: part.attrs, points: geometry.points, radius: geometry.radius })
              routeParts.set(owner, sections)
            } else {
              R.route(childName, geometry.points, geometry.radius, { owner: geometry.owner ?? childName, piece: assembly.name, ...routeEnds(part.attrs) })
            }
            tubes++
          } else solids++
          const localGeometry = recordShape(part.attrs, `${assembly.name}.part-${partIndex + 1}`)
          local.put({ piece: assembly.name, name: localGeometry.shape.name, at: localGeometry.at, svg: part.svg, shapes: [local.solid(localGeometry.shape)] })
        }
        for (const [owner, sections] of routeParts) {
          const first = sections.find((section) => attr(section.attrs, 'data-anatomy-free-start') === 'true')
          if (!first) throw new Error(`${assembly.name}: segmented route ${owner} has no physical free start`)
          const ordered = [first], remaining = new Set(sections.filter((section) => section !== first))
          let points = [...first.points]
          const samePoint = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < .002
          while (remaining.size) {
            const tail = points.at(-1)
            const next = [...remaining].find((section) => samePoint(section.points[0], tail) || samePoint(section.points.at(-1), tail))
            if (!next) throw new Error(`${assembly.name}: segmented route ${owner} is discontinuous (${remaining.size} sections remain)`)
            remaining.delete(next); ordered.push(next)
            const forward = samePoint(next.points[0], tail)
            points.push(...(forward ? next.points.slice(1) : [...next.points].reverse().slice(1)))
          }
          if (attr(ordered.at(-1).attrs, 'data-anatomy-free-end') !== 'true') throw new Error(`${assembly.name}: segmented route ${owner} has no physical free end`)
          R.route(owner, points, first.radius, { owner, piece: assembly.name, ends: [false, false], free: [true, true] })
        }
        const at = [0, 1, 2].map((axis) => centers.reduce((sum, point) => sum + point[axis], 0) / centers.length)
        R.put({ piece: figureId, name: assembly.name, at, svg: assembly.svg, shapes })
        const localRanks = new Map(local.items.map((item, index) => [item.name, index]))
        const localSettle = A.settle(local, P, { states: [0] })
        const solvedLocalOrder = [...localSettle.items].sort((a, b) => a.key - b.key).map((item) => item.name)
        localSettle.items.forEach((item) => { item.key = localRanks.get(item.name) })
        const localResult = A.audit(local, P, { apart: false, frames: [], ground: () => false })
        console.log(`ASSEMBLY_DEPTH ${assembly.name} · ${assembly.parts.length} solids · ${localResult.depth.problems.length} local findings`)
        if (process.argv.includes('--verbose')) console.log(`  proposed local order: ${solvedLocalOrder.join(' → ')}`)
        if (process.argv.includes('--verbose')) for (const issue of localResult.depth.problems) {
          console.log(`  local-order ${issue.front} before ${issue.back}`)
          for (const name of [issue.front, issue.back]) {
            const index = Number(name.match(/\.part-(\d+)$/)?.[1]) - 1
            console.log(`    local geometry ${name}: ${assembly.parts[index]?.attrs ?? 'record missing'}`)
          }
        }
        if (localResult.depth.problems.length) failed = true
    }
    // Record each render item in its actual wrapper start order. Sorting independent
    // parts and assemblies in separate batches changes the SVG's painter order.
    const events = [
      ...groups.flatMap((group, index) => consumed.has(group) ? [] : [{ from: group.from, run: () => recordIndividual(group, index) }]),
      ...assemblies.map((assembly) => ({ from: assembly.from, run: () => recordAssembly(assembly) })),
    ].sort((a, b) => a.from - b.from)
    for (const event of events) event.run()
    // Anatomy may propose a better depth order. Restore each rendered item's actual
    // camera-depth key so audit tests the order produced by depthSortSvg in the SVG.
    const renderedRanks = new Map(R.items.map((item, index) => [item.name, index]))
    const settled = A.settle(R, P, { states: [0] })
    // settle mutates the same item objects in R.items, so snapshot the real SVG
    // rank before it runs and restore those numeric ranks afterward.
    settled.items.forEach((item) => { item.key = renderedRanks.get(item.name) })
    const result = A.audit(R, P, { apart: false, frames: [], ground })
    if (process.argv.includes('--negative-depth-test') && figureId === 'f1.1.4-protocol-sequence' && auditCase.name === 'valid-request') {
      const groundItem = settled.items.find((item) => item.shapes?.some((shape) => groundNames.has(shape.name)))
      if (!groundItem) throw new Error('negative depth self-check could not locate the rendered ground shape in recorder items')
      const original = groundItem.key
      groundItem.key = R.items.length + 10 // simulate the actual ground slab being rendered last
      const negative = A.audit(R, P, { apart: false, frames: [], ground })
      groundItem.key = original
      if (!negative.depth.problems.length) throw new Error('negative depth self-check failed: moving the bed slab last was not detected')
      console.log(`NEGATIVE_DEPTH_SELF_CHECK detected ${negative.depth.problems.length} depth findings after moving the bed slab last`)
    }
    const count = A.failures(result)
    const summary = `ANATOMY_AUDIT ${figureId}/${auditCase.name} · rendered-component-state · ${solids} solids · ${tubes} tubes · ${groups.length} geometry records`
    console.log(summary)
    const buckets = [
      `clearance=${result.clearance.length}`,
      `terminals=${result.terminals.length}`,
      `loose=${result.loose.length}`,
      `unsupported=${result.supports.loose.length}`,
      `hanging=${result.supports.hanging.length}`,
      `sunk=${result.supports.sunk.length}`,
      `depth=${result.depth.problems.length}`,
      `crowding=${result.crowding.length}`,
    ].join(' · ')
    console.log(count ? `audit failed: ${count} findings (${buckets})` : `audit passed (${buckets})`)
    if (process.argv.includes('--verbose')) {
      console.log(A.report(result, { limit: 80 }))
      for (const issue of result.depth.problems) { for (const id of [issue.front, issue.back]) { const index = Number(id.match(/\.rendered-(\d+)$/)?.[1]) - 1; console.log(`depth geometry ${id}: ${groups[index]?.attrs ?? 'record missing'}`) } }
      for (const id of result.supports.loose) {
        const index = Number(id.match(/\.rendered-(\d+)$/)?.[1]) - 1
        console.log(`unsupported geometry ${id}: ${groups[index]?.attrs ?? 'record missing'}`)
      }
      for (const pair of result.supports.sunk) for (const id of [pair.a, pair.b]) {
        const index = Number(id.match(/\.rendered-(\d+)$/)?.[1]) - 1
        console.log(`sunk geometry ${id}: ${groups[index]?.attrs ?? 'record grouped in assembly'}`)
      }
    }
    if (count) failed = true
    }
  }
} finally {
  await server.close()
}
if (failed) process.exitCode = 1
