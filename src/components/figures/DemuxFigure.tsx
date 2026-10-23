// ============================================================
// 图解：UDP 无连接分用（k3.2.3）——分拣机房与编号滑槽
// 箱子 = UDP 数据报，滑槽 = 端口/套接字；只看目的 IP + 目的端口
// 正文数据：目的端口 6428、源端口 9157/5775（源不参与分用）
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 520
const H = 400
const CYCLE = 9
const DEST_IP = '10.0.0.20'
const PORTS = [53, 80, 443, 6428, 8080]
const SLOT_X = [-96, -48, 0, 48, 96]
const SOURCES = [9157, 5775, 40000]
const BELT = { x: -138, y: 10, w: 276, d: 26, r: 3 }
const WALL = { x: -150, y: 36, w: 300, d: 12, r: 1 }
const FLOOR = { x: -150, y: -64, w: 300, d: 100, r: 4 }
const BASE = { x: -158, y: -78, w: 316, d: 158, r: 8 }

const P = k.fitProjection(
  [
    ...k.boxCorners(BASE, -8, 0),
    ...k.boxCorners(WALL, 4, 90),
    [-196, -76, 94],
    [196, -76, 94],
    [0, 52, 66],
  ],
  W,
  H,
  { pad: 12, azimuth: 32, elevation: 34 },
)

const S = (p: k.SolidPaths, s?: k.SolidStyle) => k.solidSvg(p, s)
const L = (d: string, s?: k.LineStyle) => k.lineSvg(d, s)
const at = (p: [number, number, number]) => k.iso(p, P)
const quad = (pts: [number, number, number][]) => k.pathOf(k.pointsAt(pts, P), true)
const txt = (x: number, y: number, text: string, size = 9, tone = 'hi') =>
  `<text class="iso-face-text" data-tone="${tone}" x="${x}" y="${y}" font-size="${size}" text-anchor="middle">${text}</text>`

const ease = (x: number) => x * x * (3 - 2 * x)
const clamp = (x: number) => Math.max(0, Math.min(1, x))

/** 一个滑槽：凹陷槽口 + 上下檐 + 两侧边框 + 编号牌 */
function slot(cx: number, port: number, active: boolean) {
  const out: string[] = []
  const face = WALL.y + WALL.d
  // 槽内暗腔与滑道
  out.push(`<path d="${quad([
    [cx - 13, face + 0.1, 34],
    [cx + 13, face + 0.1, 34],
    [cx + 13, face + 0.1, 58],
    [cx - 13, face + 0.1, 58],
  ])}" fill="${active ? '#245a91' : '#0a0e13'}" opacity=".96"/>`)
  for (const z of [38, 43]) {
    out.push(L(k.segment([cx - 12, face + 0.2, z], [cx + 12, face + 0.2, z], P), { tone: active ? 'blue' : 'faint' }))
  }
  // 上下檐、左右门柱（实体外挑）
  out.push(S(k.slabOf({ x: cx - 17, y: face - 1, w: 34, d: 4, r: 0.4 }, 58, 4, P, 3, 0.3), { tone: active ? 'hi' : 'mid' }))
  out.push(S(k.slabOf({ x: cx - 17, y: face - 1, w: 34, d: 4, r: 0.4 }, 31, 3, P, 3, 0.3), { tone: active ? 'hi' : 'mid' }))
  for (const ox of [-16.5, 13.5]) {
    out.push(S(k.slabOf({ x: cx + ox, y: face - 1, w: 3, d: 4, r: 0.3 }, 34, 24, P, 2), { tone: active ? 'hi' : 'mid' }))
  }
  // 编号牌
  out.push(S(k.slabOf({ x: cx - 13, y: face - 0.5, w: 26, d: 2.4, r: 0.4 }, 63, 6, P, 3, 0.3), { tone: active ? 'hi' : 'lo' }))
  out.push(L(k.segment([cx - 13, face + 1.9, 64], [cx + 13, face + 1.9, 64], P), { tone: active ? 'blue' : 'faint' }))
  const p = at([cx, face + 2, 67.4])
  out.push(txt(p[0], p[1], String(port), 9, active ? 'hi' : 'mid'))
  if (active) {
    out.push(k.dotsSvg([at([cx + 15, face + 1, 66])], { size: 1.1, tone: 'hi', pulse: true }))
  }
  return out.join('')
}

function crateTag(x: number, y: number, z: number, port: number, active: boolean) {
  const out: string[] = []
  const face = y + 5
  out.push(`<path d="${quad([
    [x - 7.5, face, z - 3.4],
    [x + 7.5, face, z - 3.4],
    [x + 7.5, face, z + 3.4],
    [x - 7.5, face, z + 3.4],
  ])}" fill="#0d131a" opacity=".92"/>`)
  out.push(
    L(quad([[x - 7.5, face, z - 3.4], [x + 7.5, face, z - 3.4], [x + 7.5, face, z + 3.4], [x - 7.5, face, z + 3.4]]), {
      tone: active ? 'hi' : 'faint',
    }),
  )
  const a = at([x, face + 0.2, z + 0.6])
  const b = at([x, face + 0.2, z - 1.8])
  out.push(txt(a[0], a[1] - 2, DEST_IP, 6.5, active ? 'hi' : 'mid'))
  out.push(txt(b[0], b[1] + 1, `:${port}`, 8, active ? 'hi' : 'mid'))
  return out.join('')
}

export default function DemuxFigure() {
  const [destPort, setDestPort] = useState(6428)
  const [sourcePort, setSourcePort] = useState(9157)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const ph = t % CYCLE

  const slotIndex = Math.max(0, PORTS.indexOf(destPort))
  const targetX = SLOT_X[slotIndex] ?? 0

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(BASE, -8, 8, P, 10, 1), { tone: 'lo', halo: true }))
    out.push(`<g style="--anatomy-paper:#2e353d;--anatomy-face:#3a434d;--anatomy-top:#46515c;--anatomy-shade-0:#252b32;--anatomy-shade-1:#2a3239;--anatomy-shade-2:#303841;--anatomy-shade-3:#363f48">`)
    out.push(S(k.slabOf(FLOOR, 0, 4, P, 6, 0.6), { tone: 'mid' }))
    out.push(`</g>`)
    // 地坪危险条纹与排水格栅
    for (let x = FLOOR.x + 8; x < FLOOR.x + FLOOR.w - 4; x += 16) {
      out.push(L(k.lineOnTop([x, FLOOR.y + 2], [x + 8, FLOOR.y + 2], 4.3, P), { tone: 'faint' }))
    }
    for (let x = -24; x <= 24; x += 6) {
      out.push(L(k.lineOnTop([x, -44], [x, -25], 4.3, P), { tone: 'faint' }))
    }
    out.push(S(k.slabOf({ x: -26, y: -46, w: 52, d: 23, r: 1 }, 4, 1, P, 3), { tone: 'lo' }))

    // 后墙、侧墙、顶部横梁
    out.push(`<g style="--anatomy-paper:#333b44;--anatomy-face:#414b56;--anatomy-top:#4d5864;--anatomy-shade-0:#292f36;--anatomy-shade-1:#2e353d;--anatomy-shade-2:#343c45;--anatomy-shade-3:#3a434d">`)
    out.push(S(k.slabOf(WALL, 4, 86, P, 4, 1), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: WALL.x, y: WALL.y - 2, w: 300, d: 3, r: 0.5 }, 88, 4, P, 3, 0.4), { tone: 'hi' }))
    out.push(S(k.slabOf({ x: -150, y: -64, w: 12, d: 100, r: 2 }, 4, 86, P, 4, 0.8), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: 138, y: -64, w: 12, d: 100, r: 2 }, 4, 86, P, 4, 0.8), { tone: 'lo' }))
    out.push(`</g>`)
    // 墙面接缝与铆钉
    for (const z of [22, 44, 66]) {
      out.push(L(k.segment([WALL.x + 2, WALL.y + WALL.d, z], [WALL.x + WALL.w - 2, WALL.y + WALL.d, z], P), { tone: 'faint' }))
    }
    for (let x = WALL.x + 6; x < WALL.x + WALL.w; x += 30) {
      out.push(k.dotsSvg([at([x, WALL.y + WALL.d + 0.2, 86])], { size: 0.55, tone: 'mid' }))
    }
    // 侧墙通风格栅
    for (let z = 28; z <= 64; z += 9) {
      out.push(L(k.segment([-150, -40, z], [-150, -18, z], P), { tone: 'faint' }))
      out.push(L(k.segment([150, -40, z], [150, -18, z], P), { tone: 'faint' }))
    }
    // 顶部横梁
    for (const x of [-100, 100]) {
      out.push(S(k.slabOf({ x: x - 3, y: -64, w: 6, d: 100, r: 1 }, 86, 4, P, 3), { tone: 'mid' }))
    }

    // 编号滑槽
    PORTS.forEach((port, i) => out.push(slot(SLOT_X[i] ?? 0, port, i === slotIndex)))

    // 待分拣货架（静态箱子，补充场景）
    out.push(S(k.slabOf({ x: -132, y: -54, w: 70, d: 24, r: 1 }, 4, 3, P, 3), { tone: 'lo' }))
    for (const [x, port] of [
      [-120, 53],
      [-98, 80],
      [-76, 443],
    ] as const) {
      out.push(S(k.slabOf({ x: x - 8, y: -47, w: 16, d: 10, r: 0.8 }, 7, 7, P, 3, 0.3), { tone: 'mid' }))
      out.push(L(k.lineOnTop([x - 5, -47], [x + 5, -47], 14.1, P), { tone: 'faint' }))
      const p = at([x, -42, 10])
      out.push(txt(p[0], p[1], String(port), 7, 'mid'))
    }

    // 传送带：立柱、机架、带面、滚筒缝、护栏
    for (const [x, y] of [
      [-130, 15],
      [-130, 31],
      [126, 15],
      [126, 31],
    ] as const) {
      out.push(S(k.slabOf({ x: x - 2.5, y: y - 2.5, w: 5, d: 5, r: 0.5 }, 4, 66, P, 2), { tone: 'mid' }))
      out.push(S(k.slabOf({ x: x - 6, y: y - 6, w: 12, d: 12, r: 1 }, 4, 3, P, 3), { tone: 'lo' }))
    }
    out.push(S(k.slabOf({ x: BELT.x, y: BELT.y - 2, w: BELT.w, d: 3, r: 0.5 }, 66, 5, P, 3), { tone: 'lo' }))
    out.push(S(k.slabOf(BELT, 71, 3, P, 4, 0.4), { tone: 'mid', crease: 'none' }))
    for (let x = BELT.x + 8; x < BELT.x + BELT.w - 4; x += 16) {
      out.push(L(k.segment([x, BELT.y + 1, 74.2], [x, BELT.y + BELT.d - 1, 74.2], P), { tone: 'faint' }))
    }
    out.push(S(k.slabOf({ x: BELT.x, y: BELT.y - 2, w: BELT.w, d: 2, r: 0.3 }, 74, 3, P, 2), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: BELT.x, y: BELT.y + BELT.d, w: BELT.w, d: 2, r: 0.3 }, 74, 3, P, 2), { tone: 'lo' }))
    // 进料斗
    out.push(S(k.slabOf({ x: -152, y: 6, w: 18, d: 34, r: 1 }, 74, 3, P, 3), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -154, y: 4, w: 2.5, d: 38, r: 0.3 }, 77, 18, P, 2), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: -154, y: 4, w: 20, d: 2.5, r: 0.3 }, 77, 18, P, 2), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: -154, y: 39.5, w: 20, d: 2.5, r: 0.3 }, 77, 18, P, 2), { tone: 'lo' }))

    // 分拣龙门：立柱、横梁、滑车、推杆
    for (const x of [-120, 120]) {
      out.push(S(k.slabOf({ x: x - 2.5, y: 22, w: 5, d: 6, r: 0.5 }, 4, 82, P, 2), { tone: 'mid' }))
      out.push(S(k.slabOf({ x: x - 7, y: 18, w: 14, d: 14, r: 1 }, 4, 3, P, 3), { tone: 'lo' }))
    }
    out.push(S(k.slabOf({ x: -123, y: 22, w: 246, d: 6, r: 0.6 }, 86, 4, P, 3, 0.4), { tone: 'mid' }))
    for (let x = -116; x <= 116; x += 14) {
      out.push(k.dotsSvg([at([x, 22.2, 90])], { size: 0.4, tone: 'lo' }))
    }

    // 推杆进度
    const push = clamp((ph - 4.4) / 1.4)
    const retract = clamp((ph - 5.9) / 1.0)
    const extension = push * (1 - retract)
    const paddleY = 24 + 18 * extension
    // 滑车与竖臂
    out.push(S(k.slabOf({ x: targetX - 9, y: 21, w: 18, d: 9, r: 0.8 }, 82, 8, P, 3, 0.4), { tone: 'hi' }))
    out.push(S(k.slabOf({ x: targetX - 2.5, y: 25, w: 5, d: 5, r: 0.4 }, 77, 6, P, 2), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: targetX - 2.5, y: 25, w: 5, d: Math.max(1, paddleY - 25), r: 0.4 }, 76.5, 3, P, 2), { tone: 'mid' }))

    // 活动箱子：沿皮带 → 推入槽口 → 落入滑槽
    const travel = clamp(ph / 4.4)
    let cx = -128 + (targetX + 128) * ease(travel)
    let cy = 32
    let cz = 78.5
    if (ph >= 4.4 && ph < 5.9) {
      cx = targetX
      cy = 32 + 16 * ease(push)
    } else if (ph >= 5.9) {
      cx = targetX
      cy = 48
      cz = 78.5 - 32 * ease(clamp((ph - 5.9) / 1.1))
    }
    if (ph < 6.8) {
      out.push(
        `<g style="--anatomy-paper:#b6a27c;--anatomy-face:#cbb68b;--anatomy-top:#e0cda2;--anatomy-lit-top:#f0dfb8;--anatomy-lit-shade:#b7a075;--anatomy-shade-0:#8f7a54;--anatomy-shade-1:#a08b62;--anatomy-shade-2:#b09a6e;--anatomy-shade-3:#c0a97b">`,
      )
      out.push(S(k.slabOf({ x: cx - 8, y: cy - 5, w: 16, d: 10, r: 1 }, cz - 4.5, 9, P, 3, 0.5), { tone: 'hi', lit: true }))
      out.push(L(k.lineOnTop([cx - 6, cy - 5.4], [cx + 6, cy - 5.4], cz + 4.7, P), { tone: 'blue' }))
      out.push(`</g>`)
      out.push(crateTag(cx, cy, cz, destPort, true))
    }
    // 推板（画在箱子之后，读者能看到它抵住箱尾）
    if (extension > 0.02) {
      out.push(S(k.slabOf({ x: targetX - 7, y: paddleY - 1.5, w: 14, d: 3, r: 0.4 }, 75, 5, P, 3, 0.4), { tone: 'hi', lit: true }))
    }


    return out.join('')
  }, [ph, destPort, slotIndex, targetX])

  return (
    <FigureCard
      fig="图 18 · UDP 无连接分用"
      title="滑槽按“目的 IP + 目的端口”选，不看寄件人"
      subtitle="分拣机房是接收主机，墙上一排编号滑槽是端口；带标签的箱子是 UDP 数据报，分拣臂只把它送进目的端口对应的槽。"
      readout={
        <>
          目的 IP {DEST_IP} · 目的端口 {destPort} · 目标套接字 {DEST_IP}:{destPort} · 源端口 {sourcePort}（不参与分用）
        </>
      }
      running={running}
      onToggle={() => setRunning((r) => !r)}
      onReset={() => {
        setT(0)
        setRunning(false)
      }}
      extra={
        <div className="flex items-center gap-2">
          <select
            className="text-xs rounded-lg px-2 py-1.5 border bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            value={destPort}
            onChange={(e) => {
              setDestPort(Number(e.target.value))
              setT(0)
            }}
            aria-label="选择目的端口"
          >
            {PORTS.map((p) => (
              <option key={p} value={p}>
                目的端口 {p}
              </option>
            ))}
          </select>
          <select
            className="text-xs rounded-lg px-2 py-1.5 border bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            value={sourcePort}
            onChange={(e) => setSourcePort(Number(e.target.value))}
            aria-label="选择源端口"
          >
            {SOURCES.map((p) => (
              <option key={p} value={p}>
                源端口 {p}
              </option>
            ))}
          </select>
        </div>
      }
      caption={
        <>
          UDP 套接字由<strong>目的 IP + 目的端口</strong>二元组标识：箱子上的目的端口是 6428，分拣臂就把它投进 6428
          号槽；把源端口从 9157 换成 5775，槽位不变。只有改变目的端口（或者换一台目的主机）才会落到别的槽——这就是
          “无连接分用只看 2 元组”。
        </>
      }
    >
      <Scene width={W} height={H} label="UDP 分用：分拣机房、传送带与编号端口滑槽" svg={svg} />
    </FigureCard>
  )
}
