import { createServer } from 'vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root=resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const anatomyRoot=process.env.ANATOMY_SKILL_DIR??resolve(process.env.USERPROFILE??'', '.codex/skills/anatomy')
const A=await import(pathToFileURL(resolve(anatomyRoot, 'kit/audit.mjs')).href)
const server=await createServer({ root, configFile: resolve(root, 'vite.config.ts'), server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' })

const cases=[
  ['s2.1.1', '/src/components/figures/refresh/ch2/AppArchitectureFigure.tsx', (m, p) => ['cs', 'p2p'].flatMap((mode, i) => Array.from({ length: 4 }, (_, stage) => [0.1, 1.9].map((offset, j) => [i*8+stage*2+j, m.model(mode, stage*2+offset, p)])).flat())],
  ['s2.1.3', '/src/components/figures/refresh/ch2/TransportServiceFigure.tsx', (m, p) => ['tcp', 'udp'].flatMap(v => [0, 1, 2, 3].map((stage, i) => [v+'-'+i, m.draw(v, stage, p)]))],
  ['s2.2.2', '/src/components/figures/refresh/ch2/HttpMessageFigure.tsx', (m, p) => {
    const rows=[]
    for (const [i, mode] of ['request', 'fields'].entries()) for (let stage=0; stage<4; stage++) {
      const t=stage*2+0.1
      const model=m.messageModel(mode, stage, '200 OK')
      if (mode==='request'&&(model.start!=='POST /resource HTTP/1.1'||!model.headers.includes('Content-Length: 8')||model.body!=='name=Ana'||new TextEncoder().encode(model.body).length!==8)) throw new Error('HTTP POST report must show an 8-byte name=Ana body')
      if (mode==='fields'&&(model.start!=='GET /resource HTTP/1.1'||model.hasBody||model.body!=='')) throw new Error('HTTP GET fields mode must not display a request body')
      if (stage===2&&model.separator!=='CRLF') throw new Error('HTTP stage 2 must expose the CRLF separator')
      rows.push([i*4+stage, m.draw(mode, t, p, '200 OK')])
    }
    const statuses=['200 OK', '304 Not Modified', '404 Not Found']
    for (const [i, status] of statuses.entries()) for (let stage=0; stage<4; stage++) for (const offset of [0.1, 1.9]) {
      const t=stage*2+offset
      const model=m.messageModel('response', stage, status)
      if (model.start!==`HTTP/1.1 ${status}`) throw new Error('HTTP response status changed during stage '+stage+': '+status)
      if (stage===2&&model.separator!=='CRLF') throw new Error('HTTP stage 2 must expose the CRLF separator')
      if (status==='304 Not Modified'&&stage===3&&(model.hasBody||model.body!=='')) throw new Error('304 response must end without an entity body')
      if (stage===2&&!m.draw('response', t, p, status).includes('CRLF')) throw new Error('HTTP scene must highlight the CRLF boundary')
      if (status==='304 Not Modified'&&stage===3&&m.draw('response', t, p, status).includes('响应实体')) throw new Error('304 scene must not show a response entity')
      rows.push([8+i*8+stage*2+(offset>1?1:0), m.draw('response', t, p, status)])
    }
    return rows
  }],
  ['s2.2.3', '/src/components/figures/refresh/ch2/CookieCacheFigure.tsx', (m, p) => ['cookie', 'cache', 'conditional'].flatMap((v, i) => [0, 2.8, 3, 5.8, 6, 8.8].map((t, j) => [i*6+j, m.draw(v, t, p)]))],
  ['s2.4.2', '/src/components/figures/refresh/ch2/MailRetrievalFigure.tsx', (m, p) => [['pop3', false], ['pop3', true], ['imap', false]].flatMap(([v, r], i) => [0, 2.8, 3, 5.8, 6, 8.8].map((t, j) => [i*6+j, m.draw(v, r, t, p)]))],
  ['s2.5.1', '/src/components/figures/refresh/ch2/DnsDirectoryFigure.tsx', (m, p) => ['A', 'NS', 'MX'].flatMap((v, i) => Array.from({ length: 7 }, (_, stage) => [0.1, 1.9].map((offset, j) => [i*14+stage*2+j, m.draw(v, stage*2+offset, p)])).flat())],
  ['s2.6.1', '/src/components/figures/refresh/ch2/FileDistributionFigure.tsx', (m, p) => ['cs', 'p2p'].flatMap((v, i) => [50, 100, 200].flatMap((u, j) => [0.1, 0.9].map((t, k) => [i*6+j*2+k, m.draw(v, t, p, u)])))],
  ['s3.4.1', '/src/components/figures/refresh/ch3-reliability/RdtEvolutionFigure.tsx', (m, p) => ['rdt1', 'rdt2', 'rdt21', 'rdt22', 'rdt3'].flatMap((v, i) => Array.from({ length: 4 }, (_, stage) => [0.1, 1.9].map((offset, j) => [i*8+stage*2+j, m.draw(v, stage*2+offset, p)])).flat())],
  ['s3.5.1', '/src/components/figures/refresh/ch3-reliability/TcpByteAssemblyFigure.tsx', (m, p) => Array.from({ length: 12 }, (_, stage) => [0.1, 0.9].map((offset, j) => [stage*2+j, m.draw(stage+offset, p)])).flat()],
  ['s3.5.3', '/src/components/figures/refresh/ch3-reliability/TcpReliabilityFigure.tsx', (m, p) => ['fast', 'timeout', 'ackloss'].flatMap((v, i) => Array.from({ length: v==='fast'? 9:4 }, (_, stage) => [0.1, 1.9].map((offset, j) => [i*18+stage*2+j, m.draw(v, stage, stage*2+offset, p)])).flat())],
]
const selectedCases=new Set((process.env.FIGURE_AUDIT_ONLY??'').split(',').map(id => id.trim()).filter(Boolean))

const getAttrs=source => Object.fromEntries([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]))
const number=(record, key) => {
  const value=Number(record[key])
  if (!Number.isFinite(value)) throw new Error((record['data-part']??'unnamed')+' missing/invalid '+key)
  return value
}
const records=svg => [...svg.matchAll(/<g\b([^>]*data-shape="(?:slab|cylinder)"[^>]*)>/g)].map(m => getAttrs(m[1]))

function buildAudit(P, shapes, checkDepthRecorder=false) {
  const R=A.recorder(P, { ground: shape => shape.ground===true })
  const assemblies=new Map()
  shapes.forEach((raw, index) => {
    const name=(raw['data-part']??'part')+'@'+index
    if (raw['data-shape']==='segment') {
      const a=[number(raw, 'data-x1'), number(raw, 'data-y1'), number(raw, 'data-z1')]
      const b=[number(raw, 'data-x2'), number(raw, 'data-y2'), number(raw, 'data-z2')]
      if (Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2])<0.01) throw new Error(name+' zero-length route')
      const radius=number(raw, 'data-radius')
      const tubes=R.route(name, [a, b], radius, { piece: name, owner: name })
      R.put({ name, piece: name, at: a.map((v, i) => (v+b[i])/2), shapes: tubes })
      return
    }
    let shape, at
    if (raw['data-shape']==='slab') {
      const x=number(raw, 'data-x'), y=number(raw, 'data-y'), w=number(raw, 'data-w'), d=number(raw, 'data-d'), z=number(raw, 'data-z'), h=number(raw, 'data-h')
      if (w<=0||d<=0||h<=0) throw new Error(name+' zero-volume slab')
      shape=A.slab({ x, y, w, d, r: 2 }, z, h, { name, ground: raw['data-ground']==='true' })
      at=[x+w/2, y+d/2, z+h/2]
    } else {
      const x=number(raw, 'data-x'), y=number(raw, 'data-y'), r=number(raw, 'data-r'), z=number(raw, 'data-z'), h=number(raw, 'data-h')
      if (r<=0||h<=0) throw new Error(name+' zero-volume cylinder')
      shape=A.cylinder(x, y, r, z, h, { name, ground: raw['data-ground']==='true' })
      at=[x, y, z+h/2]
    }
    R.solid(shape)
    const assembly=raw['data-assembly']??name
    const item=assemblies.get(assembly)??{ name: assembly, piece: assembly, points: [], shapes: [], names: [] }
    item.points.push(at)
    item.shapes.push(shape)
    item.names.push(name)
    assemblies.set(assembly, item)
  })
  for (const item of assemblies.values()) {
    const at=[0, 1, 2].map(axis => item.points.reduce((sum, point) => sum+point[axis], 0)/item.points.length)
    const V=R.V, key=at[0]*V[0]+at[1]*V[1]+at[2]*V[2]
    R.put({ name: item.name, piece: item.piece, at, key, shapes: item.shapes })
  }
  const drawOrder=R.items.map((item, index) => index)
  A.settle(R, P, { states: [0] })
  // Settle estimates the ideal depth order, but the artwork is emitted in the
  // source SVG order. Restore those exact ranks before checking that order.
  R.items.forEach((item, index) => (item.key=drawOrder[index]))
  const result=A.audit(R, P, { apart: false, frames: [] })
  let localDepth=0, negativeLocalDepthChecked=false
  const localDepthProblems=[]
  for (const item of assemblies.values()) {
    if (item.shapes.length < 2) continue
    const local=A.recorder(P, { ground: () => false })
    item.shapes.forEach((shape, index) => local.put({ name: item.names[index], piece: item.name, at: item.points[index], key: index, shapes: [shape] }))
    const localDrawRank=new Map(local.items.map((part, index) => [part.name, index]))
    A.settle(local, P, { states: [0] })
    local.items.forEach(part => (part.key=localDrawRank.get(part.name)))
    const localResult=A.audit(local, P, { apart: false, frames: [], ground: () => false })
    localDepth+=localResult.depth.problems.length
    if (checkDepthRecorder&&localResult.depth.problems.length) {
      const drawOrder=local.items.map(part => part.name)
      const solvedOrder=local.items.map((part, index) => ({name:part.name, key:local.settled.solved.keys[index]})).sort((a, b) => a.key-b.key).map(part => part.name)
      localDepthProblems.push({assembly:item.name, drawOrder, solvedOrder, constraints:localResult.depth.problems.map(problem => problem.front+' > '+problem.back)})
    }
    if (checkDepthRecorder && !negativeLocalDepthChecked && local.settled.overlaps.pairs.length>0) {
      const saved=local.items.map(part => part.key)
      local.items.forEach((part, index) => (part.key=local.items.length-index))
      const inverted=A.audit(local, P, { apart: false, frames: [], ground: () => false })
      local.items.forEach((part, index) => (part.key=saved[index]))
      if (inverted.depth.problems.length) {
        negativeLocalDepthChecked=true
        console.log('negative local assembly depth self-check: inverted '+item.name+' internal draw rank detected '+inverted.depth.problems.length+' findings')
      }
    }
  }
  if (localDepthProblems.length) console.log('local assembly depth detail: '+JSON.stringify(localDepthProblems))
  if (checkDepthRecorder && !negativeLocalDepthChecked) console.log('negative local assembly depth self-check: N/A (no multi-solid assembly with projected overlaps)')
  if (checkDepthRecorder) {
    const groundIndex=R.items.findIndex(item => item.shapes?.some(shape => shape.ground===true))
    if (groundIndex<0) throw new Error('negative depth self-check could not find a real ground slab')
    const saved=R.items.map(item => item.key)
    R.items.forEach((item, index) => (item.key=index))
    R.items[groundIndex].key=R.items.length+1
    const inverted=A.audit(R, P, { apart: false, frames: [] })
    R.items.forEach((item, index) => (item.key=saved[index]))
    if (inverted.depth.problems.length===0) throw new Error('negative depth self-check failed to detect a ground slab drawn last')
    console.log('negative depth self-check: inverted ground draw rank detected '+inverted.depth.problems.length+' depth findings')
  }
  return { R, result, localDepth }
}

let totalFindings=0, lastAudit=null
try {
  const kit=await server.ssrLoadModule('/src/components/figures/refresh/ch2/primitives.ts')
  for (const [subsection, path, scenarios] of cases.filter(([id]) => selectedCases.size===0||selectedCases.has(id))) {
    const module=await server.ssrLoadModule(path)
    const P=module.auditProjection()
    let samples=0, solidRecords=0, routedCables=0, findings=0, clearance=0, depth=0, localDepth=0, loose=0, sunk=0, unsupported=0
    let renderedSolids=0, physicalSolids=0, logicalSolids=0
    for (const [index, svg] of scenarios(module, P)) {
      const rows=records(svg)
      if (rows.some(r => !['physical', 'logical'].includes(r['data-audit']))) throw new Error(subsection+' state '+index+' has a rendered solid without an explicit audit role')
      renderedSolids+=rows.length
      logicalSolids+=rows.filter(r => r['data-audit']==='logical').length
      physicalSolids+=rows.filter(r => r['data-audit']==='physical').length
      const { R, result, localDepth: localCount }=buildAudit(P, rows.filter(r => r['data-audit']==='physical'), samples===0)
      const count=A.failures(result)+localCount
      if (count) console.log(subsection+' state '+index+': '+count+' [clearance '+result.clearance.length+', cross-assembly depth '+result.depth.problems.length+', local assembly depth '+localCount+', unsupported '+result.supports.loose.length+', sunk '+result.supports.sunk.length+'] '+result.depth.problems.slice(0, 3).map(p => p.a+' × '+p.b).join('; '))
      clearance+=result.clearance.length
      depth+=result.depth.problems.length
      localDepth+=localCount
      loose+=result.supports.loose.length
      sunk+=result.supports.sunk.length
      unsupported+=result.terminals.length+result.loose.length
      lastAudit={ R, P }
      samples++; solidRecords+=R.solids.length; routedCables+=R.tubes.length; findings+=count
    }
    totalFindings+=findings
    console.log(subsection+': sampled '+samples+' actual draw states; rendered='+renderedSolids+' solids (physical='+physicalSolids+', logical='+logicalSolids+'); recorded physical='+solidRecords+' Anatomy solids; Anatomy tubes='+routedCables+'; findings='+findings+' [clearance '+clearance+', cross-assembly depth '+depth+', local assembly depth '+localDepth+', unsupported '+unsupported+', loose support '+loose+', sunk overlaps '+sunk+']')
  }
} catch (error) {
  totalFindings++
  console.error('figure-audit-b error: '+(error?.stack??error))
} finally { await server.close() }
console.log('Anatomy recorder/settle/audit completed. Total reported geometry findings='+totalFindings+'. Nonzero findings are failures requiring review.')
if (lastAudit) A.auditOrExit(lastAudit.R, lastAudit.P, { flag: '--anatomy-audit-b', argv: ['--anatomy-audit-b'], apart: false, frames: [] })
if (totalFindings) process.exitCode=1
