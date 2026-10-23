// ============================================================
// 图解 k3.5.8 的纯模型：TCP 流量控制（PPT 第 73–74 页）
// 规则与正文一致：
//   rwnd = RcvBuffer − (已到达但未被应用读走的字节数)
//   发送方：LastByteSent − LastByteAcked ≤ rwnd（发送方已知的通告窗口）
// 段长、传播时延、发送节拍为演示取值，不改变上述规则。
// ============================================================

export const RCV_BUFFER = 4096 // 典型默认 RcvBuffer（PPT 第 74 页）
export const SEG = 512 // 演示段长（字节）
export const SLOTS = RCV_BUFFER / SEG // 缓冲区可容纳 8 段
export const ONE_WAY = 0.9 // 单向传播时延（秒）
export const SEND_EVERY = 0.4 // 发送方尝试发送的节拍（秒）

export interface Segment {
  at: number // 到达接收方的时刻
  end: number // 段末字节号（LastByteSent 的取值）
}

export interface Ack {
  at: number // 到达发送方的时刻
  ack: number // 确认号（累积确认，即 LastByteRcvd）
  wnd: number // 本次通告的 rwnd
  update: boolean // 是否为窗口更新（由应用读取引起）
}

export interface Flow {
  t: number
  sent: number // LastByteSent
  acked: number // 发送方已知的 LastByteAcked
  sndWnd: number // 发送方已知的通告窗口
  arrived: number // LastByteRcvd
  read: number // LastByteRead
  advWnd: number // 接收方最近一次通告的 rwnd
  nextSend: number
  nextRead: number
  wire: Segment[] // 正在链路上的数据段（FIFO）
  acks: Ack[] // 正在返回的确认（FIFO）
  reads: number[] // 最近的读取时刻（用于画出离开水龙头的水滴）
  sends: number[] // 最近的发送时刻（用于画出离开发送方的段）
}

export function createFlow(readPeriod: number): Flow {
  return {
    t: 0,
    sent: 0,
    acked: 0,
    sndWnd: RCV_BUFFER,
    arrived: 0,
    read: 0,
    advWnd: RCV_BUFFER,
    nextSend: 0,
    nextRead: readPeriod,
    wire: [],
    acks: [],
    reads: [],
    sends: [],
  }
}

/** 接收方此刻真实的 rwnd。 */
export const rwndOf = (f: Flow) => RCV_BUFFER - (f.arrived - f.read)
/** 缓冲区里已缓存、尚未被应用读取的字节数。 */
export const bufferedOf = (f: Flow) => f.arrived - f.read
/** 发送方在途（已发送、未确认）的字节数。 */
export const inFlightOf = (f: Flow) => f.sent - f.acked
/** 发送方此刻是否被窗口挡住（不能再发一整段）。 */
export const blockedOf = (f: Flow) => inFlightOf(f) + SEG > f.sndWnd

type Kind = 'ack' | 'segment' | 'read' | 'send'

function nextEvent(f: Flow): { kind: Kind; at: number } {
  let best: { kind: Kind; at: number } = { kind: 'send', at: f.nextSend }
  const consider = (kind: Kind, at: number | undefined) => {
    if (at !== undefined && at < best.at) best = { kind, at }
  }
  consider('ack', f.acks[0]?.at)
  consider('segment', f.wire[0]?.at)
  consider('read', f.nextRead)
  return best
}

/**
 * 把模型推进到时刻 until。readPeriod 为应用每读一段所需的时间（秒）。
 * 全部事件按时间顺序处理，不依赖帧率。
 */
export function advanceTo(f: Flow, until: number, readPeriod: number): void {
  for (;;) {
    const event = nextEvent(f)
    if (event.at > until) break
    f.t = event.at
    if (event.kind === 'ack') {
      const a = f.acks.shift()!
      if (a.ack > f.acked) f.acked = a.ack
      f.sndWnd = a.wnd
    } else if (event.kind === 'segment') {
      const s = f.wire.shift()!
      f.arrived = s.end
      f.advWnd = rwndOf(f)
      f.acks.push({ at: f.t + ONE_WAY, ack: f.arrived, wnd: f.advWnd, update: false })
    } else if (event.kind === 'read') {
      f.nextRead = f.t + readPeriod
      if (bufferedOf(f) >= SEG) {
        f.read += SEG
        f.reads.push(f.t)
        const wnd = rwndOf(f)
        // 窗口更新：通告的 rwnd 比上次增加了至少一段才发送（避免零窗口死锁）
        if (wnd - f.advWnd >= SEG) {
          f.acks.push({ at: f.t + ONE_WAY, ack: f.arrived, wnd, update: true })
          f.advWnd = wnd
        }
      }
    } else {
      f.nextSend = f.t + SEND_EVERY
      if (!blockedOf(f)) {
        f.sent += SEG
        f.wire.push({ at: f.t + ONE_WAY, end: f.sent })
        f.sends.push(f.t)
      }
    }
  }
  f.t = until
  const keep = until - 3
  while (f.reads.length && f.reads[0]! < keep) f.reads.shift()
  while (f.sends.length && f.sends[0]! < keep) f.sends.shift()
}

/** 读取速率（段/秒）→ 每段读取周期（秒）。 */
export const periodOf = (segmentsPerSecond: number) => 1 / segmentsPerSecond
