// ============================================================
// 图解：BitTorrent 集市（k2.6.2）
// tracker 公告板 = 只发对等端列表；机柜托盘 = 各自持有的 256 Kb 分块
// 手推车 = 分块交换；tit-for-tat = 向给自己供块的邻居回赠（top 4 解阻）
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 760
const H = 460
const PHASE = 4 // 秒：一轮“下载一块 → 回赠一块”
const UNCHOKED = ['B', 'C', 'D', 'E']

type Peer = { id: string; x: number; y: number; chunks: number[]; choked?: boolean }

const PEERS: Peer[] = [
  { id: 'B', x: -180, y: 50, chunks: [2, 6, 1, 4] },
  { id: 'C', x: -145, y: -70, chunks: [5, 3, 7, 2] },
  { id: 'D', x: 0, y: -115, chunks: [8, 4, 2, 6] },
  { id: 'E', x: 145, y: -70, chunks: [1, 7, 5, 3] },
  { id: 'F', x: 180, y: 50, chunks: [6, 2, 8, 4], choked: true },
]
const YOU: Peer = { id: 'A', x: 0, y: 120, chunks: [1, 2, 5, 8] }

const GROUND = { x: -228, y: -162, w: 456, d: 334, r: 14 }
const A_DOCK: [number, number] = [0, 147]
const VIA: Record<string, [number, number]> = {
  B: [-100, 158],
  C: [-105, 158],
  D: [100, 155],
  E: [105, 158],
}

const P = k.fitProjection(
  [...k.boxCorners(GROUND, -10, 4), ...k.boxCorners({ x: -212, y: -145, w: 424, d: 300, r: 2 }, 0, 50), [0, -34, 86]],
  W,
  H,
  { pad: 14, azimuth: 34, elevation: 36 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)
const text3 = (
  p: [number, number, number],
  body: string,
  size = 9,
  tone = 'hi',
  anchor: 'start' | 'middle' | 'end' = 'middle',
) => {
  const [x, y] = at(p)
  return `<text class="iso-face-text" data-tone="${tone}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" text-anchor="${anchor}">${body}</text>`
}

type Col = { p: string; f: string; t: string; s: [string, string, string, string] }
const COLORS: Col[] = [
  { p: '#2f6fd0', f: '#3b7de6', t: '#4a8ef0', s: ['#24579f', '#2a61b1', '#3169bf', '#3873cc'] },
  { p: '#2f9e6e', f: '#37ab79', t: '#44c08a', s: ['#237a54', '#2a8a60', '#31986a', '#38a574'] },
  { p: '#c98a2b', f: '#d99a35', t: '#e8ab45', s: ['#9a6a20', '#ad7626', '#bd822c', '#cc8f33'] },
  { p: '#8a5bd0', f: '#9868e0', t: '#a878f0', s: ['#6a46a2', '#7650b4', '#825ac4', '#8d63d4'] },
  { p: '#c05050', f: '#d05c5c', t: '#e06a6a', s: ['#944040', '#a64747', '#b54e4e', '#c45555'] },
  { p: '#2b9ba8', f: '#32aab8', t: '#3fbccb', s: ['#207780', '#268791', '#2b96a2', '#31a4b1'] },
]
const GREEN: Col = { p: '#2f9e6e', f: '#37ab79', t: '#44c08a', s: ['#237a54', '#2a8a60', '#31986a', '#38a574'] }
const RED: Col = { p: '#b74747', f: '#c55353', t: '#d46060', s: ['#8c3535', '#9a3b3b', '#a84242', '#b34949'] }
const PAPER: Col = { p: '#c9ced6', f: '#d9dde4', t: '#eef1f5', s: ['#9aa0a8', '#a8aeb6', '#b6bcc4', '#c2c8d0'] }

const colorGroup = (c: Col) =>
  `<g style="--anatomy-paper:${c.p};--anatomy-face:${c.f};--anatomy-top:${c.t};--anatomy-shade-0:${c.s[0]};--anatomy-shade-1:${c.s[1]};--anatomy-shade-2:${c.s[2]};--anatomy-shade-3:${c.s[3]}">`

const ease = (u: number) => u * u * (3 - 2 * u)
const clamp01 = (u: number) => Math.max(0, Math.min(1, u))

function crate(x: number, y: number, z: number, num: number, scale = 1) {
  const c = COLORS[(num - 1) % COLORS.length]
  const w = 9 * scale
  const h = 4.4 * scale
  const body = k.slabOf({ x: x - w / 2, y: y - w / 2, w, d: w, r: 1.1 * scale }, z, h, P, 3, 0.4 * scale)
  const lid = k.slabOf(
    { x: x - w / 2 - 0.7, y: y - w / 2 - 0.7, w: w + 1.4, d: w + 1.4, r: 1.2 * scale },
    z + h,
    1.3 * scale,
    P,
    3,
    0.3 * scale,
  )
  return (
    colorGroup(c) +
    S(body, { tone: 'hi' }) +
    S(lid, { tone: 'mid', crease: 'none' }) +
    '</g>' +
    text3([x, y, z + h + 1.9 * scale], String(num), 7.2 * scale)
  )
}

function faceCard(x0: number, z0: number, w: number, h: number, fill: string, opacity = 0.92) {
  const y = -30.6
  const pts = [
    at([x0, y, z0]),
    at([x0 + w, y, z0]),
    at([x0 + w, y, z0 + h]),
    at([x0, y, z0 + h]),
  ]
  const a = at([x0 + 2.4, y - 0.2, z0 + h * 0.34])
  const b = at([x0 + w - 3.4, y - 0.2, z0 + h * 0.34])
  const c = at([x0 + 2.4, y - 0.2, z0 + h * 0.64])
  const d = at([x0 + w * 0.62, y - 0.2, z0 + h * 0.64])
  return (
    `<path d="${k.pathOf(pts, true)}" fill="${fill}" opacity="${opacity}"/>` +
    L(`M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`, { tone: 'faint' }) +
    L(`M${c[0].toFixed(1)},${c[1].toFixed(1)}L${d[0].toFixed(1)},${d[1].toFixed(1)}`, { tone: 'faint' })
  )
}

function peerCab(p: Peer, you = false) {
  const { x, y } = p
  const out: string[] = []
  for (const [dx, dy] of [
    [-23, -15],
    [23, -15],
    [-23, 15],
    [23, 15],
  ]) {
    out.push(S(k.cylinder(x + dx, y + dy, 2.6, 0, 4, P, 12), { tone: 'mid' }))
  }
  out.push(S(k.slabOf({ x: x - 31, y: y - 22, w: 62, d: 44, r: 3 }, 4, 5, P, 4, 0.6), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: x - 27, y: y - 19, w: 54, d: 38, r: 2 }, 9, 22, P, 4, 0.8), { tone: 'mid' }))
  for (const dx of [-15, 15]) {
    out.push(L(k.segment([x + dx, y + 19.15, 10], [x + dx, y + 19.15, 30], P), { tone: 'faint' }))
  }
  out.push(S(k.slabOf({ x: x - 29, y: y - 20, w: 58, d: 40, r: 2 }, 31, 3, P, 4, 0.6), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: x - 27, y: y - 20, w: 54, d: 4, r: 1 }, 34, 12, P, 3, 0.4), { tone: 'mid' }))
  // 装卸台与滚轮
  out.push(S(k.slabOf({ x: x - 14, y: y + 20, w: 28, d: 9, r: 1 }, 10, 3, P, 3, 0.4), { tone: 'lo' }))
  out.push(S(k.cylinder(x - 10, y + 26, 1.8, 13, 2.4, P, 10), { tone: 'mid' }))
  out.push(S(k.cylinder(x + 10, y + 26, 1.8, 13, 2.4, P, 10), { tone: 'mid' }))
  // 托盘里的分块箱
  const xs = [-18, -6, 6, 18]
  for (let i = 0; i < 4; i++) out.push(crate(x + xs[i], y + 1, 34, p.chunks[i]))
  out.push(text3([x, y + 12, 36.2], you ? 'A · 你' : p.id, you ? 9.5 : 8, you ? 'hi' : 'mid'))
  // 状态灯
  const lamp = p.choked ? RED : GREEN
  out.push(
    colorGroup(lamp) +
      S(k.cylinder(x + 21, y + 12, 2.2, 34, 4.5, P, 14), { tone: 'hi', lit: true }) +
      '</g>' +
      L(k.ring(x + 21, y + 12, 2.4, 38.8, P, 14), { tone: p.choked ? 'red' : 'green' }),
  )
  if (p.choked) {
    out.push(S(k.slabOf({ x: x - 17, y: y + 20, w: 34, d: 2.6, r: 1 }, 15, 2.2, P, 3, 0.3), { tone: 'mid' }))
    out.push(L(k.lineOnTop([x - 16, y + 21.3], [x + 16, y + 21.3], 17.4, P), { tone: 'red' }))
    out.push(text3([x, y + 24, 23], 'choke', 8.5, 'hi'))
  }
  return out.join('')
}

function tracker(disp: number | null) {
  const out: string[] = []
  out.push(S(k.slabOf({ x: -30, y: -32, w: 60, d: 34, r: 3 }, 0, 8, P, 4, 0.8), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: -12, y: -24, w: 24, d: 18, r: 2 }, 8, 26, P, 4, 0.6), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -34, y: -34, w: 68, d: 36, r: 3 }, 34, 5, P, 4, 0.6), { tone: 'hi' }))
  // 发卡滑槽
  out.push(S(k.slabOf({ x: -7, y: 2, w: 14, d: 30, r: 1 }, 5, 2.4, P, 3, 0.3), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -9, y: 0, w: 18, d: 4, r: 1 }, 7, 1.2, P, 2, 0.2), { tone: 'lo' }))
  for (const sx of [-7.8, 7.8]) {
    out.push(S(k.slabOf({ x: sx - 0.9, y: 4, w: 1.8, d: 26, r: 0.6 }, 7.4, 2.2, P, 2, 0.2), { tone: 'lo' }))
  }
  // 公告板与立柱
  out.push(S(k.slabOf({ x: -34, y: -34, w: 68, d: 3, r: 1 }, 39, 31, P, 2, 0.5), { tone: 'mid' }))
  for (const px of [-32, 32]) out.push(S(k.cylinder(px, -32, 2.2, 39, 35, P, 14), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -38, y: -37, w: 76, d: 6, r: 1 }, 74, 5, P, 2, 0.6), { tone: 'hi' }))
  // 钉在板上的对等端名单（2 列 × 3 行）
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      out.push(faceCard(-28 + col * 30, 46 + row * 8, 24, 6.2, col === 0 && row === 0 ? '#eef1f5' : '#c9ced6'))
    }
  }
  out.push(text3([0, -30.4, 70.5], 'TRACKER · 对等端列表', 7.5, 'hi'))
  // 顶灯
  out.push(
    colorGroup(GREEN) +
      S(k.cylinder(0, -34, 3.2, 79, 4.6, P, 14), { tone: 'hi', lit: true }) +
      '</g>' +
      L(k.ring(0, -34, 3.4, 83.7, P, 14), { tone: 'green' }),
  )
  // 滑出的“对等端列表”卡片
  if (disp !== null) {
    out.push(
      colorGroup(PAPER) +
        S(k.slabOf({ x: -5, y: disp, w: 10, d: 7, r: 1 }, 7.4, 0.9, P, 2, 0.2), { tone: 'hi', lit: true }) +
        '</g>',
    )
    out.push(L(k.lineOnTop([-3, disp + 1.6], [3, disp + 1.6], 8.4, P), { tone: 'faint' }))
  }
  return out.join('')
}

function cart(x: number, y: number, num: number | null, flip: boolean) {
  const out: string[] = []
  const dir = flip ? 1 : -1
  for (const [dx, dy] of [
    [-11, -7],
    [11, -7],
    [-11, 7],
    [11, 7],
  ]) {
    out.push(S(k.cylinder(x + dx, y + dy, 2.2, 0, 5, P, 10), { tone: 'lo' }))
  }
  out.push(S(k.slabOf({ x: x - 15, y: y - 10, w: 30, d: 20, r: 2 }, 5, 3.4, P, 3, 0.5), { tone: 'hi', lit: true, halo: true }))
  out.push(L(k.lineOnTop([x - 13, y - 8], [x + 13, y - 8], 8.6, P), { tone: 'hi' }))
  out.push(L(k.lineOnTop([x - 13, y + 8], [x + 13, y + 8], 8.6, P), { tone: 'mid' }))
  for (const dx of [-13, 13]) {
    out.push(S(k.slabOf({ x: x + dx - 1.1, y: y + dir * 10 - 1.1, w: 2.2, d: 2.2, r: 0.5 }, 8.4, 14, P, 2, 0.2), { tone: 'lo' }))
  }
  out.push(S(k.slabOf({ x: x - 15, y: y + dir * 17 - 1, w: 30, d: 2, r: 0.6 }, 22, 2.4, P, 2, 0.2), { tone: 'mid' }))
  if (num !== null) out.push(crate(x, y, 8.6, num, 0.95))
  return out.join('')
}

function onPath(points: [number, number][], s: number): [number, number] {
  const sealed = clamp01(s)
  const lens: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
  }
  const total = lens[lens.length - 1] || 1
  let want = sealed * total
  for (let i = 1; i < points.length; i++) {
    if (want <= lens[i] || i === points.length - 1) {
      const span = lens[i] - lens[i - 1] || 1
      const u = clamp01((want - lens[i - 1]) / span)
      return [
        points[i - 1][0] + (points[i][0] - points[i - 1][0]) * u,
        points[i - 1][1] + (points[i][1] - points[i - 1][1]) * u,
      ]
    }
  }
  return points[points.length - 1]
}

export default function BitTorrentFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const phase = Math.floor(t / PHASE)
  const slot = phase % UNCHOKED.length
  const q = (t % PHASE) / PHASE
  const mate = PEERS.find((p) => p.id === UNCHOKED[slot])!
  const num = mate.chunks[phase % mate.chunks.length]
  const replyNum = YOU.chunks[(phase + 2) % YOU.chunks.length]
  const downloaded = phase + (q >= 0.5 ? 1 : 0)
  const uploaded = phase + (q >= 0.98 ? 1 : 0)

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(GROUND, -10, 10, P, 8, 1), { tone: 'lo' }))
    // 地砖缝
    for (let x = -180; x <= 180; x += 60) out.push(L(k.lineOnTop([x, -156], [x, 164], 0.4, P), { tone: 'faint' }))
    for (let y = -120; y <= 150; y += 60) out.push(L(k.lineOnTop([-220, y], [220, y], 0.4, P), { tone: 'faint' }))
    // 四边矮护栏
    out.push(S(k.slabOf({ x: -228, y: 162, w: 456, d: 8, r: 2 }, 0, 4, P, 3, 0.4), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -228, y: -170, w: 456, d: 8, r: 2 }, 0, 4, P, 3, 0.4), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -228, y: -162, w: 8, d: 324, r: 2 }, 0, 4, P, 3, 0.4), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: 220, y: -162, w: 8, d: 324, r: 2 }, 0, 4, P, 3, 0.4), { tone: 'mid' }))
    out.push(
      k.dotsSvg(
        [
          at([-222, 166, 4.4]),
          at([222, 166, 4.4]),
          at([-222, -166, 4.4]),
          at([222, -166, 4.4]),
        ],
        { size: 0.9, tone: 'mid' },
      ),
    )

    // 由后向前排序的静态实体
    const drawers: { d: number; s: string }[] = []
    for (const p of PEERS) {
      drawers.push({ d: k.depthOf([p.x, p.y, 12], P), s: peerCab(p) })
    }
    drawers.push({ d: k.depthOf([YOU.x, YOU.y, 12], P), s: peerCab(YOU, true) })
    const dispY = q < 0.18 ? 4 + ease(q / 0.18) * 26 : null
    drawers.push({ d: k.depthOf([0, -15, 12], P), s: tracker(dispY) })
    drawers.sort((a, b) => a.d - b.d)
    for (const item of drawers) out.push(item.s)

    // 运货手推车
    const dock: [number, number] = [mate.x, mate.y + 27]
    const via = VIA[mate.id]
    if (q >= 0.08 && q < 0.5) {
      const [cx, cy] = onPath([dock, via, A_DOCK], ease((q - 0.08) / 0.42))
      out.push(cart(cx, cy, num, false))
    } else if (q >= 0.5 && q < 0.98) {
      const upVia: [number, number] = [via[0], via[1] + 10]
      const [cx, cy] = onPath([[6, 151], upVia, [mate.x + 8, mate.y + 29]], ease((q - 0.5) / 0.48))
      out.push(cart(cx, cy, replyNum, true))
    }
    // 你身边待发的空车
    out.push(cart(58, 146, 3, true))

    // 集市杂物：灯柱、木箱、拴马桩
    for (const [bx, by] of [
      [-206, 136],
      [-206, -136],
      [206, -136],
      [206, 136],
    ]) {
      out.push(S(k.cylinder(bx, by, 2.4, 4, 13, P, 12), { tone: 'lo' }))
      out.push(S(k.cylinder(bx, by, 3.4, 17, 2, P, 12), { tone: 'mid' }))
    }
    out.push(S(k.slabOf({ x: -196, y: 96, w: 14, d: 14, r: 1.5 }, 4, 10, P, 2, 0.4), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: -192, y: 100, w: 11, d: 11, r: 1.2 }, 14, 8, P, 2, 0.3), { tone: 'mid' }))
    out.push(crate(104, 118, 4, 7, 0.9))
    return out.join('')
  }, [q, mate, num, replyNum])

  return (
    <FigureCard
      fig="图 15 · BitTorrent 集市"
      title="tracker 发名单，邻居用分块换分块"
      subtitle="中央公告板只交换对等端列表；机柜托盘是各邻居持有的 256 Kb 分块，手推车把块送到你这里，再按 tit-for-tat 回赠给供块的邻居。"
      readout={
        <>
          已下载 {downloaded} 块 · 已上传 {uploaded} 块 · 邻居 5（解阻 4 / choke 1）· 本轮回赠 {mate.id}
        </>
      }
      running={running}
      onToggle={() => setRunning((r) => !r)}
      onReset={() => {
        setT(0)
        setRunning(false)
      }}
      caption={
        <>
          请求用 <strong>rarest first</strong>：先抢最稀有的分块，避免“最后一块没人有”。发送用{' '}
          <strong>tit-for-tat</strong>：只向当前给自己供块最快的 <strong>4</strong> 个邻居回赠，每{' '}
          <strong>10 秒</strong>重估前 4 名，每 <strong>30 秒</strong>随机乐观解阻一个邻居。图中 F 被 choke，
          所以没有手推车往返。动画把一轮交换压缩到 4 秒；计数为示意值，规则与正文一致；chunk = 256 Kb。
        </>
      }
    >
      <Scene width={W} height={H} label="BitTorrent：tracker 公告板与邻居间的手推车分块交换" svg={svg} />
    </FigureCard>
  )
}
