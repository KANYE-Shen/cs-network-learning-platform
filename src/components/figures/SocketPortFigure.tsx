// ============================================================
// 图解：进程、套接字与端口（k2.1.3）
// 公寓楼 = 主机；信箱 = 端口；房门 = 进程；包裹 = 报文段
// 邮递员把报文段投入 80 号信箱，经竖井送到 Web 服务器进程
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 920
const H = 430
const PORTS = [21, 25, 53, 80]
const SLOT_X = [-108, -36, 36, 108]
const HOST_IP = '192.168.1.10'
const DEST = 3 // 80 号信箱
const CYCLE = 13
const WALK_END = 2.2
const INSERT_END = 4.8
const CHUTE_END = 7.8

const GROUND = { x: -225, y: -105, w: 455, d: 220, r: 12 }
const HOUSE = { x: -160, y: -55, w: 320, d: 110, r: 2 }

const P = k.fitProjection(
  [
    ...k.boxCorners(GROUND, -8, 0),
    ...k.boxCorners(HOUSE, 0, 122),
    ...k.boxCorners({ x: -108, y: -26, w: 34, d: 34, r: 0 }, 124, 150),
    [210, 100, 46],
  ],
  W,
  H,
  { pad: 14, azimuth: 32, elevation: 32 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)
const text = (p: [number, number, number], s: string, size = 10, tone = 'hi') => {
  const [x, y] = at(p)
  return `<text class="iso-face-text" data-tone="${tone}" x="${x}" y="${y}" font-size="${size}" text-anchor="middle">${s}</text>`
}

const DARK =
  '<g style="--anatomy-paper:#0c0e12;--anatomy-face:#11151b;--anatomy-top:#151a21;--anatomy-shade-0:#080a0d;--anatomy-shade-1:#0a0c10;--anatomy-shade-2:#0d1014;--anatomy-shade-3:#101319">'
const SCREEN =
  '<g style="--anatomy-paper:#173050;--anatomy-face:#21406a;--anatomy-top:#274a78;--anatomy-shade-0:#122640;--anatomy-shade-1:#172d4a;--anatomy-shade-2:#1b3455;--anatomy-shade-3:#1f3b60">'
const WARM =
  '<g style="--anatomy-paper:#5a4a26;--anatomy-face:#7a642f;--anatomy-top:#8a7238;--anatomy-shade-0:#4a3c1e;--anatomy-shade-1:#544426;--anatomy-shade-2:#5e4c2c;--anatomy-shade-3:#685534">'
const METAL =
  '--anatomy-paper:#414a55;--anatomy-face:#525d69;--anatomy-top:#67727f;--anatomy-shade-0:#343d46;--anatomy-shade-1:#3a434d;--anatomy-shade-2:#404a55;--anatomy-shade-3:#47515c;--anatomy-lit-top:#8492a0;--anatomy-lit-shade:#5f6b78;--anatomy-hi:#eef2f7'
const KRAFT =
  '--anatomy-paper:#8a7a56;--anatomy-face:#a08c62;--anatomy-top:#b49c6e;--anatomy-shade-0:#756747;--anatomy-shade-1:#7f7050;--anatomy-shade-2:#89795a;--anatomy-shade-3:#938363;--anatomy-hi:#2a2418'

const ease = (v: number) => {
  const f = Math.max(0, Math.min(1, v))
  return f * f * (3 - 2 * f)
}
const lerp = (a: number, b: number, f: number) => a + (b - a) * f

/* ---------------- 建筑构件 ---------------- */

function mailbox(x: number, port: number, lit: boolean) {
  const out: string[] = []
  out.push(S(k.slabOf({ x: x - 14, y: 55, w: 28, d: 2, r: 0.6 }, 70, 19, P, 3, 0.4), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 12, y: 56.5, w: 24, d: 7, r: 1 }, 73, 14, P, 3, 0.8), { tone: 'hi', lit }))
  out.push(S(k.slabOf({ x: x - 12, y: 56.5, w: 24, d: 7, r: 1 }, 87, 1.6, P, 3, 0.4), { tone: 'mid' }))
  // 投信口（深色内凹）
  out.push(DARK + S(k.slabOf({ x: x - 8, y: 63.45, w: 16, d: 0.5, r: 0.4 }, 79, 3.6, P, 2), { tone: 'hi', crease: 'none' }) + '</g>')
  // 端口号铭牌
  out.push(S(k.slabOf({ x: x - 7.5, y: 63.6, w: 15, d: 0.5, r: 0.3 }, 73.4, 5, P, 2), { tone: 'lo' }))
  out.push(text([x, 64.25, 74.7], String(port), lit ? 10 : 9))
  // 上沿铰链
  out.push(L(k.segment([x - 9, 63.9, 86.6], [x + 9, 63.9, 86.6], P), { tone: 'faint' }))
  return out.join('')
}

function chute(x: number, lit: boolean) {
  const out: string[] = []
  out.push(S(k.slabOf({ x: x - 3, y: 55.1, w: 6, d: 1.1, r: 0.4 }, 25, 48, P, 2), { tone: 'lo' }))
  for (const dx of [-4.4, 3.4]) {
    out.push(S(k.slabOf({ x: x + dx, y: 55.1, w: 1, d: 4.6, r: 0.3 }, 25, 48, P, 2), { tone: 'mid' }))
  }
  for (let i = 0; i < 5; i++) {
    out.push(S(k.slabOf({ x: x - 4.7, y: 54.9, w: 9.4, d: 5, r: 0.5 }, 32 + i * 10, 1.2, P, 2), { tone: 'mid' }))
  }
  if (lit) out.push(L(k.segment([x, 59.9, 27], [x, 59.9, 72], P), { tone: 'green' }))
  return out.join('')
}

function door(x: number, open: number, lit: boolean) {
  const out: string[] = []
  // 门内亮着的房间
  out.push(WARM + S(k.slabOf({ x: x - 8.5, y: 54.7, w: 17, d: 0.8, r: 0.4 }, 1, 20, P, 2), { tone: 'hi', crease: 'none' }) + '</g>')
  // 门框
  for (const dx of [-10, 9]) out.push(S(k.slabOf({ x: x + dx, y: 55, w: 1.8, d: 3.2, r: 0.3 }, 0, 25, P, 2), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 11, y: 54.6, w: 22, d: 4, r: 0.5 }, 25, 3, P, 2, 0.4), { tone: 'mid' }))
  // 门扇（80 号房间在投递时向右滑开）
  out.push(S(k.slabOf({ x: x - 8 + open, y: 56.3, w: 16, d: 1.8, r: 0.5 }, 0, 22, P, 2, 0.5), { tone: 'hi', lit }))
  out.push(k.dotsSvg([at([x + 5.5 + open, 58.3, 10])], { size: 1.1, tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 10, y: 58, w: 20, d: 5, r: 0.5 }, 0, 1.2, P, 2), { tone: 'lo' }))
  // 开门时门缝透出的灯光
  if (open > 1) {
    out.push(
      WARM +
        S(k.slabOf({ x: x - 8, y: 58, w: 16, d: 9, r: 1 }, 1.3, 0.8, P, 2), { tone: 'hi', crease: 'none' }) +
        '</g>',
    )
  }
  return out.join('')
}

function postman(x: number, armUp: boolean) {
  const out: string[] = []
  const Y = 88
  // 鞋与腿
  for (const dx of [-4.5, 4.5]) {
    out.push(S(k.slabOf({ x: x + dx - 2.6, y: Y, w: 5.2, d: 8, r: 1 }, 0, 2.4, P, 2, 0.4), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: x + dx - 2, y: Y + 1, w: 4, d: 6, r: 0.8 }, 2.4, 12, P, 2, 0.3), { tone: 'mid' }))
  }
  // 躯干与腰带
  out.push(S(k.slabOf({ x: x - 6, y: Y, w: 12, d: 10, r: 1.4 }, 14, 16, P, 3, 0.7), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: x - 6.2, y: Y, w: 12.4, d: 10.2, r: 1.4 }, 22, 1.4, P, 2), { tone: 'lo' }))
  // 头、帽子
  out.push(S(k.cylinder(x, Y + 5, 4.2, 30, 7, P, 20), { tone: 'hi' }))
  out.push(S(k.cylinder(x, Y + 5, 5, 37, 2, P, 20), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 5.5, y: Y + 7, w: 11, d: 5, r: 1 }, 37.5, 1.2, P, 2), { tone: 'mid' }))
  // 手臂：一只手抬起投递
  out.push(S(k.slabOf({ x: x + 6, y: Y + 3, w: 3.4, d: 6, r: 0.7 }, 16, 13, P, 2, 0.3), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x + 8, y: Y + 4, w: 3.4, d: 5, r: 0.7 }, armUp ? 26 : 12, armUp ? 11 : 12, P, 2, 0.3), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 9, y: Y + 3, w: 3.4, d: 6, r: 0.7 }, 15, 13, P, 2, 0.3), { tone: 'mid' }))
  // 邮包与背带
  out.push(S(k.slabOf({ x: x - 9, y: Y - 3, w: 7, d: 8, r: 1.2 }, 12, 12, P, 3, 0.5), { tone: 'mid' }))
  out.push(L(k.segment([x - 7, Y + 4, 30], [x - 6, Y, 16], P), { tone: 'lo' }))
  out.push(k.dotsSvg([at([x, Y + 10.1, 26])], { size: 1, tone: 'mid' }))
  return out.join('')
}

function parcel(pos: [number, number, number]) {
  const [x, y, z] = pos
  const out: string[] = [`<g style="${KRAFT}">`]
  out.push(S(k.slabOf({ x: x - 4, y: y - 4, w: 8, d: 8, r: 0.7 }, z, 9, P, 2, 0.6), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: x - 4.3, y: y - 1, w: 8.6, d: 2, r: 0.2 }, z - 0.1, 9.2, P, 2), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 1, y: y - 4.3, w: 2, d: 8.6, r: 0.2 }, z - 0.1, 9.2, P, 2), { tone: 'mid' }))
  out.push('</g>')
  return out.join('')
}

/* ---------------- 主体 ---------------- */

export default function SocketPortFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const u = ((t % CYCLE) + CYCLE) % CYCLE
  const walking = u < WALK_END
  const walkF = ease(u / WALK_END)
  const postX = lerp(-45, 118, walkF)
  const armUp = !walking

  let box: [number, number, number]
  if (u < WALK_END) {
    box = [postX + 17, 97, 41]
  } else if (u < INSERT_END) {
    const f = ease((u - WALK_END) / (INSERT_END - WALK_END))
    box = [lerp(134, 108, f), lerp(96, 62.5, f), lerp(41, 80, f) + Math.sin(f * Math.PI) * 12]
  } else if (u < CHUTE_END) {
    const f = (u - INSERT_END) / (CHUTE_END - INSERT_END)
    box = [108, 60, lerp(80, 28, f)]
  } else if (u < 9.4) {
    const f = ease((u - CHUTE_END) / 1.6)
    box = [108, lerp(60, 61.5, f), lerp(28, 12, f)]
  } else {
    box = [108, 61.5, 12]
  }
  const doorLift = u > 7.5 ? ease((u - 7.5) / 0.7) * 14 : 0

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(GROUND, -8, 8, P, 10, 1), { tone: 'lo' }))
    // 人行道与台阶
    out.push(S(k.slabOf({ x: -152, y: 58, w: 304, d: 10, r: 1 }, 0, 2.2, P, 3, 0.4), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -148, y: 67, w: 296, d: 8, r: 1 }, 0, 1.2, P, 3, 0.3), { tone: 'mid' }))

    // 楼体、基座、檐口、屋顶
    out.push(S(k.slabOf({ x: HOUSE.x - 4, y: HOUSE.y - 4, w: HOUSE.w + 8, d: HOUSE.d + 8, r: 2 }, 0, 8, P, 4, 0.6), { tone: 'lo' }))
    out.push(S(k.slabOf(HOUSE, 8, 110, P, 5, 0.8), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: HOUSE.x - 5, y: HOUSE.y - 5, w: HOUSE.w + 10, d: HOUSE.d + 10, r: 2 }, 118, 6, P, 4, 0.7), { tone: 'hi' }))
    out.push(S(k.slabOf({ x: HOUSE.x - 2, y: HOUSE.y - 2, w: HOUSE.w + 4, d: HOUSE.d + 4, r: 2 }, 124, 2.5, P, 4, 0.4), { tone: 'mid' }))

    // 壁柱
    for (const x of [-144, -72, 0, 72, 144]) {
      out.push(S(k.slabOf({ x: x - 3, y: 55, w: 6, d: 2.8, r: 0.4 }, 8, 108, P, 2, 0.4), { tone: 'lo' }))
      out.push(S(k.slabOf({ x: x - 4, y: 54.6, w: 8, d: 4, r: 0.4 }, 112, 3, P, 2, 0.3), { tone: 'mid' }))
      out.push(S(k.slabOf({ x: x - 4, y: 54.6, w: 8, d: 4, r: 0.4 }, 8, 2.4, P, 2, 0.3), { tone: 'mid' }))
    }

    // 楼上窗户
    for (const x of SLOT_X) {
      out.push(S(k.slabOf({ x: x - 17, y: 56, w: 34, d: 1.6, r: 0.6 }, 93, 19, P, 3, 0.4), { tone: 'lo' }))
      out.push(SCREEN + S(k.slabOf({ x: x - 13.5, y: 57.5, w: 27, d: 0.5, r: 0.3 }, 96, 13, P, 2), { tone: 'hi', crease: 'none' }) + '</g>')
      out.push(S(k.slabOf({ x: x - 18, y: 56, w: 36, d: 4, r: 0.6 }, 91, 2.4, P, 3, 0.3), { tone: 'mid' }))
      out.push(L(k.segment([x, 57.8, 96], [x, 57.8, 109], P), { tone: 'faint' }))
      out.push(L(k.segment([x - 13.5, 57.8, 102.5], [x + 13.5, 57.8, 102.5], P), { tone: 'faint' }))
    }

    // 信箱、竖井、房门
    for (let i = 0; i < PORTS.length; i++) {
      const x = SLOT_X[i]
      const lit = i === DEST
      out.push(`<g style="${METAL}">${mailbox(x, PORTS[i], lit)}</g>`)
      out.push(`<g style="${METAL}">${chute(x, lit)}</g>`)
      out.push(`<g style="${METAL}">${door(x, i === DEST ? doorLift : 0, lit)}</g>`)
    }

    // 屋顶水塔、通气管与栏杆
    out.push(S(k.cylinder(-88, -18, 16, 126.5, 21, P, 26), { tone: 'mid' }))
    out.push(S(k.cylinder(-88, -18, 10, 147.5, 2.4, P, 20), { tone: 'hi' }))
    for (const [dx, dy] of [
      [-11, -11],
      [11, -11],
      [-11, 11],
      [11, 11],
    ] as const) {
      out.push(S(k.cylinder(-88 + dx, -18 + dy, 2.2, 126.5, 5, P, 10), { tone: 'lo' }))
    }
    for (const x of [20, 62]) out.push(S(k.cylinder(x, 12, 4.5, 126.5, 9, P, 16), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: 20, y: 10, w: 42, d: 3, r: 1 }, 126.5, 2, P, 2), { tone: 'mid' }))
    for (const x of [-150, -90, -30, 30, 90, 150]) {
      out.push(S(k.slabOf({ x: x - 1.2, y: 50, w: 2.4, d: 2.4, r: 0.3 }, 126.5, 11, P, 2), { tone: 'lo' }))
    }
    out.push(S(k.slabOf({ x: -153, y: 49, w: 306, d: 4, r: 1 }, 137.5, 2, P, 2), { tone: 'mid' }))

    // 侧面落水管
    out.push(S(k.cylinder(164, 50, 3, 0, 118, P, 14), { tone: 'lo' }))
    for (const z of [16, 44, 72, 100]) out.push(L(k.ring(164, 50, 3, z, P, 14), { tone: 'faint' }))

    // 邮递员与报文段
    const pc = at([postX, 88, 0])
    out.push(
      `<g transform="translate(${pc[0]} ${pc[1]}) scale(1.5) translate(${-pc[0]} ${-pc[1]})" style="${METAL}">` +
        postman(postX, armUp) +
        '</g>',
    )
    out.push(parcel(box))

    return out.join('')
  }, [postX, armUp, box, doorLift, u])

  const stage =
    u < WALK_END
      ? '投递中：报文段送往 80 号信箱'
      : u < INSERT_END
        ? '报文段投入 80 号收件槽'
        : u < CHUTE_END
          ? '沿竖井下行：按端口号分用'
          : '分用完成：交给 Web 服务器进程'

  return (
    <FigureCard
      fig="图 10 · 端口与套接字"
      title="信箱是端口，房门是进程"
      subtitle="公寓楼是主机，墙上一排信箱是端口号；每个信箱用竖井连到一扇门，门后就是等待消息的进程。"
      readout={
        <>
          目的 IP {HOST_IP} · 目的端口 80 · 进程 Web 服务器（HTTP） · 端口号 16 位（0–65535） · {stage}
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
          端口号是 <strong>16 位无符号整数（0–65535）</strong>：0–1023 知名端口，1024–49151 注册端口，49152–65535
          动态端口。IP 地址只找到主机，端口号才能把报文段交给主机上的具体进程；HTTP 服务器的 80 号门后就是 Web 服务器进程。
        </>
      }
    >
      <Scene width={W} height={H} label="公寓楼信箱与房门：端口号与进程" svg={svg} />
    </FigureCard>
  )
}
