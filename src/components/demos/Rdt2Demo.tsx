import { useMemo, useState } from 'react'
import { DemoFrame, ParamSelect, ParamToggle, PlayControls, ResultGrid, StepNote, useStepMachine } from './DemoKit'

/**
 * rdt2.0 / rdt2.1 / rdt2.2 的有限状态机（FSM）演示。
 *
 * 本组件内置一个真正的、事件驱动的协议模拟器：发送方与接收方各自运行一组 FSM 状态，
 * 每一步就是一次 FSM 迁移（触发条件 → 执行动作 → 迁移后状态）。
 *
 * rdt2.x 假设：信道只会发生比特翻转（bit error），既不丢包也不乱序。
 *  - rdt2.0：数据分组没有序号。ACK/NAK 被损坏时，发送方无法判断接收方是否收到数据，
 *             贸然重传可能造成重复交付 → FSM 中根本没有这条迁移 → 发送方卡死（致命缺陷）。
 *  - rdt2.1：数据分组带序号 0/1。控制报文损坏时重传当前分组，接收方识别重复并丢弃。
 *  - rdt2.2：无 NAK。接收方总是回 ACK 并显式带上被确认分组的序号；
 *             重复 ACK 对发送方等价于 NAK（触发重传）。
 */

type Ver = 'rdt2.0' | 'rdt2.1' | 'rdt2.2'
type ErrKind = 'none' | 'data' | 'ack' | 'nak'

interface Trans {
  cond: string
  act: string
  to: string
}
interface StateDef {
  label: string
  trans: Trans[]
}
type StateTable = Record<string, StateDef>

function senderTable(ver: Ver): StateTable {
  if (ver === 'rdt2.0') {
    return {
      call0: {
        label: '等待上层调用 0',
        trans: [
          { cond: 'rdt_send(data0)', act: 'sndpkt = make_pkt(data0, checksum); udt_send(sndpkt)', to: 'wait' },
        ],
      },
      wait: {
        label: '等待 ACK 或 NAK',
        trans: [
          { cond: 'rdt_rcv(rcvpkt) && isACK(rcvpkt)', act: '确认成功，准备下一组数据', to: 'call1' },
          { cond: 'rdt_rcv(rcvpkt) && isNAK(rcvpkt)', act: 'udt_send(sndpkt) 重传当前分组', to: 'wait' },
          {
            cond: 'rdt_rcv(rcvpkt) && corrupt(rcvpkt)',
            act: '⚠ 区分不出 ACK / NAK：无迁移 → 协议卡死',
            to: 'dead',
          },
        ],
      },
      call1: {
        label: '等待上层调用 1',
        trans: [
          { cond: 'rdt_send(data1)', act: 'sndpkt = make_pkt(data1, checksum); udt_send(sndpkt)', to: 'wait' },
        ],
      },
      dead: { label: '（卡死）永远等待 ACK/NAK', trans: [] },
      done: { label: '（无更多数据）', trans: [] },
    }
  }
  if (ver === 'rdt2.1') {
    return {
      call0: {
        label: '等待上层调用 0',
        trans: [
          { cond: 'rdt_send(data0)', act: 'sndpkt = make_pkt(0, data0, checksum); udt_send(sndpkt)', to: 'wait0' },
        ],
      },
      wait0: {
        label: '等待 ACK/NAK 0',
        trans: [
          {
            cond: 'rdt_rcv(rcvpkt) && (corrupt(rcvpkt) || isNAK(rcvpkt))',
            act: 'udt_send(sndpkt) 重传 seq 0 分组（序号保证不会重复交付）',
            to: 'wait0',
          },
          {
            cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && isACK(rcvpkt)',
            act: '发送下一组 seq 1',
            to: 'wait1',
          },
        ],
      },
      call1: {
        label: '等待上层调用 1',
        trans: [
          { cond: 'rdt_send(data1)', act: 'sndpkt = make_pkt(1, data1, checksum); udt_send(sndpkt)', to: 'wait1' },
        ],
      },
      wait1: {
        label: '等待 ACK/NAK 1',
        trans: [
          {
            cond: 'rdt_rcv(rcvpkt) && (corrupt(rcvpkt) || isNAK(rcvpkt))',
            act: 'udt_send(sndpkt) 重传 seq 1 分组（序号保证不会重复交付）',
            to: 'wait1',
          },
          {
            cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && isACK(rcvpkt)',
            act: '数据全部交付完毕',
            to: 'done',
          },
        ],
      },
      done: { label: '（无更多数据）', trans: [] },
    }
  }
  // rdt2.2
  return {
    call0: {
      label: '等待上层调用 0',
      trans: [
        { cond: 'rdt_send(data0)', act: 'sndpkt = make_pkt(0, data0, checksum); udt_send(sndpkt)', to: 'wait0' },
      ],
    },
    wait0: {
      label: '等待 ACK 0',
      trans: [
        {
          cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && isACK(rcvpkt, 0)',
          act: '发送下一组 seq 1',
          to: 'wait1',
        },
        {
          cond: 'rdt_rcv(rcvpkt) && (corrupt(rcvpkt) || isACK(rcvpkt, 1))',
          act: 'udt_send(sndpkt) 重传 seq 0 分组（重复 ACK 等价于 NAK）',
          to: 'wait0',
        },
      ],
    },
    call1: {
      label: '等待上层调用 1',
      trans: [
        { cond: 'rdt_send(data1)', act: 'sndpkt = make_pkt(1, data1, checksum); udt_send(sndpkt)', to: 'wait1' },
      ],
    },
    wait1: {
      label: '等待 ACK 1',
      trans: [
        {
          cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && isACK(rcvpkt, 1)',
          act: '数据全部交付完毕',
          to: 'done',
        },
        {
          cond: 'rdt_rcv(rcvpkt) && (corrupt(rcvpkt) || isACK(rcvpkt, 0))',
          act: 'udt_send(sndpkt) 重传 seq 1 分组（重复 ACK 等价于 NAK）',
          to: 'wait1',
        },
      ],
    },
    done: { label: '（无更多数据）', trans: [] },
  }
}

function receiverTable(ver: Ver): StateTable {
  if (ver === 'rdt2.0') {
    return {
      wait: {
        label: '等待来自下层的调用',
        trans: [
          {
            cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt)',
            act: 'extract(rcvpkt, data); deliver_data(data); udt_send(ACK)',
            to: 'wait',
          },
          { cond: 'rdt_rcv(rcvpkt) && corrupt(rcvpkt)', act: 'udt_send(NAK)', to: 'wait' },
        ],
      },
    }
  }
  if (ver === 'rdt2.1') {
    return {
      e0: {
        label: '等待 0',
        trans: [
          {
            cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && has_seq0(rcvpkt)',
            act: 'extract; deliver_data(data); udt_send(ACK)',
            to: 'e1',
          },
          { cond: 'rdt_rcv(rcvpkt) && corrupt(rcvpkt)', act: 'udt_send(NAK)', to: 'e0' },
          {
            cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && !has_seq0(rcvpkt)',
            act: '重复分组：丢弃，不交付上层; udt_send(ACK)',
            to: 'e0',
          },
        ],
      },
      e1: {
        label: '等待 1',
        trans: [
          {
            cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && has_seq1(rcvpkt)',
            act: 'extract; deliver_data(data); udt_send(ACK)',
            to: 'e0',
          },
          { cond: 'rdt_rcv(rcvpkt) && corrupt(rcvpkt)', act: 'udt_send(NAK)', to: 'e1' },
          {
            cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && !has_seq1(rcvpkt)',
            act: '重复分组：丢弃，不交付上层; udt_send(ACK)',
            to: 'e1',
          },
        ],
      },
    }
  }
  return {
    e0: {
      label: '等待 0',
      trans: [
        {
          cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && has_seq0(rcvpkt)',
          act: 'extract; deliver_data(data); udt_send(ACK, seq=0)',
          to: 'e1',
        },
        {
          cond: 'rdt_rcv(rcvpkt) && corrupt(rcvpkt)',
          act: 'udt_send(ACK, seq=1) —— 重复 ACK（无 NAK）',
          to: 'e0',
        },
        {
          cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && !has_seq0(rcvpkt)',
          act: '重复分组：丢弃，不交付上层; udt_send(ACK, seq=0)',
          to: 'e0',
        },
      ],
    },
    e1: {
      label: '等待 1',
      trans: [
        {
          cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && has_seq1(rcvpkt)',
          act: 'extract; deliver_data(data); udt_send(ACK, seq=1)',
          to: 'e0',
        },
        {
          cond: 'rdt_rcv(rcvpkt) && corrupt(rcvpkt)',
          act: 'udt_send(ACK, seq=0) —— 重复 ACK（无 NAK）',
          to: 'e1',
        },
        {
          cond: 'rdt_rcv(rcvpkt) && notcorrupt(rcvpkt) && !has_seq1(rcvpkt)',
          act: '重复分组：丢弃，不交付上层; udt_send(ACK, seq=1)',
          to: 'e1',
        },
      ],
    },
  }
}

interface TraceStep {
  n: number
  side: '发送方' | '接收方'
  cond: string
  actions: string[]
  fromState: string
  toState: string
  transIdx: number
  wire: { text: string; corrupt: boolean }
  tone: 'info' | 'ok' | 'warn'
  comment?: string
}

interface SimResult {
  trace: TraceStep[]
  deadlocked: boolean
  delivered: string[]
  dupCount: number
  notes: string[]
}

interface SimMsg {
  kind: 'DATA' | 'ACK' | 'NAK'
  seq: number | null
  data?: string
  corrupt: boolean
  dup?: boolean
}

function simulate(ver: Ver, err: ErrKind, force: boolean): SimResult {
  const sTab = senderTable(ver)
  const rTab = receiverTable(ver)
  const appData = ['data0', 'data1']
  const trace: TraceStep[] = []
  const delivered: string[] = []
  const notes: string[] = []

  let sState = 'call0'
  let rState = ver === 'rdt2.0' ? 'wait' : 'e0'
  let toRecv: SimMsg | null = null
  let toSnd: SimMsg | null = null
  let curSeq = 0
  let curData = ''
  let dataIdx = 0
  let deadlocked = false
  let finished = false
  const injected = { data: false, ack: false, nak: false }
  let guard = 0

  const push = (s: Omit<TraceStep, 'n'>) => {
    trace.push({ ...s, n: trace.length + 1 })
  }
  const sLabel = (id: string) => sTab[id]?.label ?? id
  const rLabel = (id: string) => rTab[id]?.label ?? id
  const waitState = (seq: number) => (ver === 'rdt2.0' ? 'wait' : seq === 0 ? 'wait0' : 'wait1')
  const nextCall = () => (dataIdx < appData.length ? 'call1' : 'done')

  while (guard++ < 120 && !finished && !deadlocked) {
    // ---------- 发送方：上层交付数据，发送分组 ----------
    if (sState === 'call0' || sState === 'call1') {
      const data = appData[dataIdx]
      const seq = dataIdx % 2
      curSeq = seq
      curData = data
      const corrupt = err === 'data' && !injected.data
      if (corrupt) injected.data = true
      const wireText =
        ver === 'rdt2.0'
          ? `DATA(${data})`
          : `DATA(seq=${seq}, ${data})`
      toRecv = { kind: 'DATA', seq: ver === 'rdt2.0' ? null : seq, data, corrupt }
      const to = waitState(seq)
      const ti = sTab[sState].trans.findIndex((t) => t.cond.startsWith('rdt_send'))
      push({
        side: '发送方',
        cond: sTab[sState].trans[ti]?.cond ?? 'rdt_send(data)',
        actions: [
          ver === 'rdt2.0'
            ? 'sndpkt = make_pkt(data, checksum)'
            : `sndpkt = make_pkt(${seq}, ${data}, checksum)`,
          'udt_send(sndpkt)',
        ],
        fromState: sState,
        toState: to,
        transIdx: ti < 0 ? 0 : ti,
        wire: { text: wireText, corrupt },
        tone: corrupt ? 'warn' : 'info',
        comment: corrupt ? '比特翻转注入：数据分组在校验和检查时会被发现。' : undefined,
      })
      sState = to
      dataIdx++
      continue
    }

    // ---------- 接收方：收到数据分组 ----------
    if (toRecv) {
      const m = toRecv
      toRecv = null
      if (ver === 'rdt2.0') {
        if (!m.corrupt) {
          delivered.push(m.data!)
          const ackCorrupt = err === 'ack' && !injected.ack
          if (ackCorrupt) injected.ack = true
          toSnd = { kind: 'ACK', seq: null, corrupt: ackCorrupt }
          const ti = rTab[rState].trans.findIndex((t) => t.cond.includes('notcorrupt'))
          push({
            side: '接收方',
            cond: rTab[rState].trans[ti].cond,
            actions: ['extract(rcvpkt, data)', 'deliver_data(data)', 'udt_send(ACK)'],
            fromState: rState,
            toState: rState,
            transIdx: ti,
            wire: { text: 'ACK', corrupt: ackCorrupt },
            tone: ackCorrupt ? 'warn' : 'ok',
            comment: ackCorrupt
              ? `数据 ${m.data} 已交付上层；但 ACK 的比特被翻转了。`
              : `数据 ${m.data} 已交付上层应用。`,
          })
        } else {
          const nakCorrupt = err === 'nak' && !injected.nak
          if (nakCorrupt) injected.nak = true
          toSnd = { kind: 'NAK', seq: null, corrupt: nakCorrupt }
          const ti = rTab[rState].trans.findIndex((t) => t.cond.includes('corrupt'))
          push({
            side: '接收方',
            cond: rTab[rState].trans[ti].cond,
            actions: ['udt_send(NAK)'],
            fromState: rState,
            toState: rState,
            transIdx: ti,
            wire: { text: 'NAK', corrupt: nakCorrupt },
            tone: 'warn',
            comment: nakCorrupt
              ? 'NAK 的比特在传输中被翻转 —— 发送方收到的是乱码。'
              : '校验和检查失败，数据被丢弃，向发送方回送 NAK。',
          })
        }
        continue
      }
      // rdt2.1 / rdt2.2
      const expected = rState === 'e0' ? 0 : 1
      if (!m.corrupt && m.seq === expected) {
        delivered.push(m.data!)
        const ackCorrupt = err === 'ack' && !injected.ack
        if (ackCorrupt) injected.ack = true
        toSnd = { kind: 'ACK', seq: expected, corrupt: ackCorrupt }
        const to = expected === 0 ? 'e1' : 'e0'
        const ti = rTab[rState].trans.findIndex((t) => t.cond.includes('notcorrupt'))
        push({
          side: '接收方',
          cond: rTab[rState].trans[ti].cond,
          actions: [
            'extract(rcvpkt, data)',
            'deliver_data(data)',
            ver === 'rdt2.2' ? `udt_send(ACK, seq=${expected})` : 'udt_send(ACK)',
          ],
          fromState: rState,
          toState: to,
          transIdx: ti,
          wire: { text: ver === 'rdt2.2' ? `ACK(seq=${expected})` : 'ACK', corrupt: ackCorrupt },
          tone: 'ok',
          comment: ackCorrupt
            ? `数据 ${m.data} 已交付上层；ACK 的比特被翻转。`
            : `数据 ${m.data} 已交付上层。`,
        })
        rState = to
      } else if (!m.corrupt) {
        // 重复分组：序号不匹配
        const ackSeq = ver === 'rdt2.2' ? 1 - expected : null
        toSnd = { kind: 'ACK', seq: ackSeq, dup: true, corrupt: false }
        const ti = rTab[rState].trans.findIndex((t) => t.cond.includes('!has_seq'))
        push({
          side: '接收方',
          cond: rTab[rState].trans[ti].cond,
          actions: [
            '重复分组：extract 但不交付上层（discard）',
            ver === 'rdt2.2' ? `udt_send(ACK, seq=${ackSeq})` : 'udt_send(ACK)',
          ],
          fromState: rState,
          toState: rState,
          transIdx: ti,
          wire: { text: ver === 'rdt2.2' ? `dup ACK(seq=${ackSeq})` : 'ACK', corrupt: false },
          tone: 'warn',
          comment: `这是 ${m.data} 的重复副本（序号 ${m.seq} ≠ 期望 ${expected}），被丢弃，不会重复交付给应用层。`,
        })
      } else {
        // 数据分组比特出错
        if (ver === 'rdt2.1') {
          const nakCorrupt = err === 'nak' && !injected.nak
          if (nakCorrupt) injected.nak = true
          toSnd = { kind: 'NAK', seq: null, corrupt: nakCorrupt }
          const ti = rTab[rState].trans.findIndex((t) => t.cond.includes('corrupt'))
          push({
            side: '接收方',
            cond: rTab[rState].trans[ti].cond,
            actions: ['udt_send(NAK)'],
            fromState: rState,
            toState: rState,
            transIdx: ti,
            wire: { text: 'NAK', corrupt: nakCorrupt },
            tone: 'warn',
            comment: nakCorrupt
              ? 'NAK 的比特被翻转 —— 发送方收到的是乱码。'
              : '校验和检查失败，数据被丢弃，向发送方回送 NAK。',
          })
        } else {
          const ackSeq = 1 - expected
          toSnd = { kind: 'ACK', seq: ackSeq, dup: true, corrupt: false }
          const ti = rTab[rState].trans.findIndex((t) => t.cond.includes('corrupt'))
          push({
            side: '接收方',
            cond: rTab[rState].trans[ti].cond,
            actions: [`udt_send(ACK, seq=${ackSeq}) —— 重复 ACK（rdt2.2 不用 NAK）`],
            fromState: rState,
            toState: rState,
            transIdx: ti,
            wire: { text: `dup ACK(seq=${ackSeq})`, corrupt: false },
            tone: 'warn',
            comment: `数据出错，接收方回送「已收到 seq=${ackSeq} 的重复 ACK」；发送方据此重传当前分组。`,
          })
        }
      }
      continue
    }

    // ---------- 发送方：收到控制报文（ACK / NAK） ----------
    if (toSnd) {
      const m = toSnd
      toSnd = null
      const curLabel = sLabel(sState)
      if (m.corrupt) {
        if (ver === 'rdt2.0' && !force) {
          push({
            side: '发送方',
            cond: 'rdt_rcv(rcvpkt) && corrupt(rcvpkt)',
            actions: [
              '⚠ 无法判断收到的是 ACK 还是 NAK',
              'FSM 中没有这条迁移 → 发送方永远等待 → 协议卡死',
            ],
            fromState: sState,
            toState: 'dead',
            transIdx: 2,
            wire: { text: `（乱码，看不出是 ${m.kind}）`, corrupt: true },
            tone: 'warn',
            comment:
              'rdt2.0 的致命缺陷：不能贸然重传——接收方没有序号，无法识别重复分组，可能把同一份数据交付两次。',
          })
          sState = 'dead'
          deadlocked = true
          continue
        }
        // rdt2.1 / rdt2.2（或强制重传）：重传当前分组
        const ti = sTab[sState].trans.findIndex((t) => t.cond.includes('corrupt'))
        const to = sTab[sState].trans[ti]?.to ?? sState
        push({
          side: '发送方',
          cond: sTab[sState].trans[ti]?.cond ?? 'rdt_rcv(rcvpkt) && corrupt(rcvpkt)',
          actions: [
            'udt_send(sndpkt) 重传当前分组',
            ver === 'rdt2.0'
              ? '（强行重传：rdt2.0 没有序号，接收方无法识别重复！）'
              : '（分组带序号，接收方能识别并丢弃重复分组）',
          ],
          fromState: sState,
          toState: to,
          transIdx: ti < 0 ? 0 : ti,
          wire: {
            text: ver === 'rdt2.0' ? `DATA(${curData}) 重传` : `DATA(seq=${curSeq}, ${curData}) 重传`,
            corrupt: false,
          },
          tone: 'warn',
          comment:
            ver === 'rdt2.0'
              ? '这就是 rdt2.0 的问题所在：重传后接收方会再次交付同一份数据 → 重复交付。'
              : '重传是安全的：序号让接收方能识别这是重复分组。',
        })
        sState = to
        toRecv = { kind: 'DATA', seq: ver === 'rdt2.0' ? null : curSeq, data: curData, corrupt: false }
        continue
      }

      if (m.kind === 'ACK') {
        const dupAck = ver === 'rdt2.2' && m.seq !== curSeq
        if (dupAck) {
          // rdt2.2：重复 ACK 等价于 NAK → 重传当前分组
          const ti = sTab[sState].trans.findIndex((t) => t.cond.includes('isACK(rcvpkt'))
          const to = sTab[sState].trans[ti]?.to ?? sState
          push({
            side: '发送方',
            cond: sTab[sState].trans[ti]?.cond ?? 'rdt_rcv(rcvpkt) && isACK(rcvpkt, 其他)',
            actions: ['udt_send(sndpkt) 重传当前分组（重复 ACK 等价于 NAK）'],
            fromState: sState,
            toState: to,
            transIdx: ti < 0 ? 0 : ti,
            wire: {
              text: `DATA(seq=${curSeq}, ${curData}) 重传`,
              corrupt: false,
            },
            tone: 'warn',
            comment: `收到的 ACK 确认的是 seq=${m.seq}，而当前分组是 seq=${curSeq} → 说明对方还没收到当前分组 → 重传。`,
          })
          sState = to
          toRecv = { kind: 'DATA', seq: curSeq, data: curData, corrupt: false }
          continue
        }
        // 确认成功
        const to = nextCall()
        const ti = sTab[sState].trans.findIndex((t) => t.cond.includes('isACK(rcvpkt'))
        push({
          side: '发送方',
          cond: sTab[sState].trans[ti]?.cond ?? 'rdt_rcv(rcvpkt) && isACK(rcvpkt)',
          actions:
            to === 'done'
              ? ['收到确认，停止等待（本组数据已可靠交付）']
              : [ver === 'rdt2.0' ? '准备发送下一组数据' : '发送下一组 seq ' + (curSeq ^ 1)],
          fromState: sState,
          toState: to,
          transIdx: ti < 0 ? 0 : ti,
          wire: { text: ver === 'rdt2.2' ? `ACK(seq=${m.seq})` : 'ACK', corrupt: false },
          tone: 'ok',
          comment: '数据被正确接收，发送方可以继续。',
        })
        sState = to
        if (to === 'done') finished = true
        continue
      }

      // NAK
      const ti = sTab[sState].trans.findIndex((t) => t.cond.includes('isNAK'))
      const to = sTab[sState].trans[ti]?.to ?? sState
      push({
        side: '发送方',
        cond: sTab[sState].trans[ti]?.cond ?? 'rdt_rcv(rcvpkt) && isNAK(rcvpkt)',
        actions: ['udt_send(sndpkt) 重传当前分组'],
        fromState: sState,
        toState: to,
        transIdx: ti < 0 ? 0 : ti,
        wire: {
          text: ver === 'rdt2.0' ? `DATA(${curData}) 重传` : `DATA(seq=${curSeq}, ${curData}) 重传`,
          corrupt: false,
        },
        tone: 'warn',
        comment: '收到 NAK：对方明确报告数据出错，立即重传。',
      })
      sState = to
      toRecv = { kind: 'DATA', seq: ver === 'rdt2.0' ? null : curSeq, data: curData, corrupt: false }
      continue
    }

    break
  }

  const dupCount = delivered.length - new Set(delivered).size
  if (ver === 'rdt2.0' && force && dupCount > 0) {
    notes.push(
      `强行重传的后果：接收方把 ${delivered.filter((d) => d === 'data0').length} 次 data0 都交付给了上层——重复交付！`,
    )
  }
  if (ver === 'rdt2.0' && deadlocked) {
    notes.push('rdt2.0 死锁：控制报文损坏后发送方再也无法推进协议。')
  }
  return { trace, deadlocked, delivered, dupCount, notes }
}

/** 状态框：显示当前状态与所有可能的迁移 */
function StateBox({
  title,
  stateLabel,
  table,
  stateId,
  activeTrans,
  accent,
}: {
  title: string
  stateLabel: string
  table: StateTable
  stateId: string
  activeTrans: number | null
  accent: string
}) {
  const def = table[stateId]
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="text-[11px] font-semibold mb-1.5" style={{ color: accent }}>
        {title}
      </div>
      <div
        className="rounded-md px-2.5 py-1.5 text-xs font-semibold mono mb-2 inline-block"
        style={{ background: 'var(--surface)', border: `1px solid ${accent}` }}
      >
        {stateLabel}
      </div>
      <div className="space-y-1">
        {def && def.trans.length > 0 ? (
          def.trans.map((t, i) => {
            const on = activeTrans === i
            return (
              <div
                key={i}
                className="rounded-md px-2 py-1.5 text-[10px] mono leading-relaxed transition-colors"
                style={{
                  background: on ? 'rgba(50,85,219,0.10)' : 'transparent',
                  border: `1px solid ${on ? 'var(--brand)' : 'var(--border)'}`,
                }}
              >
                <span style={{ color: on ? 'var(--brand)' : 'var(--text-muted)' }}>if </span>
                <span style={{ color: on ? 'var(--brand)' : 'var(--text)' }}>{t.cond}</span>
                <span className="muted"> → {t.act} ⇒ {table[t.to]?.label ?? t.to}</span>
              </div>
            )
          })
        ) : (
          <div className="text-[10px] muted">（终态：没有出边）</div>
        )}
      </div>
    </div>
  )
}

export default function Rdt2Demo() {
  const [ver, setVer] = useState<Ver>('rdt2.1')
  const [err, setErr] = useState<ErrKind>('none')
  const [force, setForce] = useState(false)

  const sim = useMemo(() => simulate(ver, err, force), [ver, err, force])
  const sTab = useMemo(() => senderTable(ver), [ver])
  const rTab = useMemo(() => receiverTable(ver), [ver])

  const steps = useMemo(() => sim.trace, [sim])
  const machine = useStepMachine(
    steps.map((s) => ({ label: s.cond, detail: s.actions.join('；') })),
    { intervalMs: 1500 },
  )

  const applied = Math.min(machine.index, steps.length)
  const lastStep = applied > 0 ? steps[applied - 1] : null

  // 当前状态 = 应用了 applied 步之后的状态
  const sState = lastStep ? (lastStep.side === '发送方' ? lastStep.toState : sStateOf(steps, applied, '发送方', 'call0')) : 'call0'
  const rState = lastStep ? (lastStep.side === '接收方' ? lastStep.toState : sStateOf(steps, applied, '接收方', ver === 'rdt2.0' ? 'wait' : 'e0')) : ver === 'rdt2.0' ? 'wait' : 'e0'

  function sStateOf(
    list: TraceStep[],
    upTo: number,
    side: '发送方' | '接收方',
    fallback: string,
  ): string {
    let st = fallback
    for (let i = 0; i < upTo && i < list.length; i++) {
      if (list[i].side === side) st = list[i].toState
    }
    return st
  }

  const deliveredSoFar = useMemo(() => {
    // 数一下到 applied 为止交付给上层的数据
    const out: string[] = []
    for (let i = 0; i < applied && i < steps.length; i++) {
      const st = steps[i]
      if (st.side === '接收方' && st.actions.some((a) => a.includes('deliver_data'))) {
        const m = st.wire.text.match(/DATA\((?:seq=\d+, )?(data\d)\)/)
        if (m) out.push(m[1])
      }
    }
    return out
  }, [steps, applied])

  const dupSoFar = deliveredSoFar.length - new Set(deliveredSoFar).size

  const errOptions = [
    { value: 'none', label: '无故障' },
    { value: 'data', label: '数据分组比特翻转' },
    { value: 'ack', label: 'ACK 比特翻转' },
    ...(ver === 'rdt2.2' ? [] : [{ value: 'nak', label: 'NAK 比特翻转' }]),
  ]

  const conclusion = (() => {
    if (ver === 'rdt2.0') {
      if (sim.deadlocked) {
        return {
          tone: 'warn' as const,
          text: 'rdt2.0 在控制报文被损坏时彻底卡死：发送方分不清收到的是 ACK 还是 NAK，也不知道接收方到底收没收到数据。贸然重传又可能造成重复交付——这正是 rdt2.0 的致命缺陷。',
        }
      }
      if (force && sim.dupCount > 0) {
        return {
          tone: 'warn' as const,
          text: `强行重传的后果显现：同一份 ${sim.delivered[0]} 被交付了 ${sim.delivered.filter((d) => d === sim.delivered[0]).length} 次。rdt2.0 没有序号，接收方无从识别重复分组 → 重复交付。`,
        }
      }
      return {
        tone: 'info' as const,
        text: 'rdt2.0 在无故障或只发生数据位错时工作正常（数据位错 → NAK → 重传）。它的软肋只有一处：ACK/NAK 被损坏。',
      }
    }
    if (ver === 'rdt2.1') {
      return {
        tone: 'ok' as const,
        text: `rdt2.1 给每个数据分组加了序号 0/1。控制报文损坏时发送方可以安全地重传当前分组，接收方识别出重复分组并丢弃、不交付上层（本次重复交付 ${dupSoFar} 次）。代价是发送方状态数翻倍（4 个状态）。`,
      }
    }
    return {
      tone: 'ok' as const,
      text: `rdt2.2 取消 NAK：接收方总是回 ACK 并显式带上被确认分组的序号；重复 ACK 对发送方就等价于 NAK，触发重传。协议功能与 rdt2.1 相同，但控制报文种类更少。`,
    }
  })()

  return (
    <DemoFrame
      title="rdt2.0 / 2.1 / 2.2：可靠传输的有限状态机"
      description="每一步就是一次 FSM 迁移：触发条件 → 执行动作 → 迁移后状态。可注入数据位错 / ACK 位错 / NAK 位错，观察发送方与接收方如何应对。"
      controls={
        <>
          <PlayControls
            playing={machine.playing}
            onPlay={() => machine.setPlaying(true)}
            onPause={() => machine.setPlaying(false)}
            onReset={machine.reset}
            onStep={machine.step}
            onStepBack={machine.stepBack}
            canStepBack
            speed={machine.speed}
            onSpeedChange={machine.setSpeed}
          />
        </>
      }
      legend={[
        { color: 'var(--brand)', label: '当前迁移（高亮）' },
        { color: '#16a078', label: '正常确认' },
        { color: '#dc7828', label: '出错 / 重传' },
      ]}
    >
      <div className="space-y-4">
        {/* 参数 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
          <ParamSelect
            label="协议版本"
            value={ver}
            onChange={(v) => {
              const nv = v as Ver
              setVer(nv)
              if (nv === 'rdt2.2' && err === 'nak') setErr('ack')
              machine.reset()
            }}
            options={[
              { value: 'rdt2.0', label: 'rdt2.0（无序号）' },
              { value: 'rdt2.1', label: 'rdt2.1（加序号 0/1）' },
              { value: 'rdt2.2', label: 'rdt2.2（无 NAK，ACK 带序号）' },
            ]}
            hint="rdt2.x 假设信道只发生比特翻转，不丢包、不乱序。"
          />
          <ParamSelect
            label="注入故障"
            value={err}
            onChange={(v) => {
              setErr(v as ErrKind)
              machine.reset()
            }}
            options={errOptions}
            hint={
              err === 'none'
                ? '不注入任何比特错误。'
                : err === 'data'
                  ? '第一个数据分组的比特被翻转 → 接收方校验和检查失败。'
                  : err === 'ack'
                    ? '第一个 ACK 的比特被翻转 → 发送方收到乱码。'
                    : '第一个 NAK 的比特被翻转 → 发送方收到乱码。'
            }
          />
          <div className="space-y-2">
            {ver === 'rdt2.0' && (
              <ParamToggle
                label="强行重传（模拟 rdt2.0 的错误补救）"
                value={force}
                onChange={(v) => {
                  setForce(v)
                  machine.reset()
                }}
                hint="开启后，控制报文损坏时发送方选择直接重传——看看会发生什么。"
              />
            )}
            {ver === 'rdt2.0' && !force && err !== 'none' && (
              <div
                className="rounded-lg px-3 py-2 text-[11px] leading-relaxed"
                style={{ background: 'rgba(220,120,40,0.10)', color: '#dc7828' }}
              >
                ⚠ 按 rdt2.0 的定义，FSM 中<b>没有</b>「控制报文损坏」这条迁移，发送方将卡死。
                勾选上方开关可以查看「强行重传」的代价。
              </div>
            )}
          </div>
        </div>

        {/* 两个 FSM */}
        <div className="grid lg:grid-cols-2 gap-3">
          <StateBox
            title="发送方状态机（Sender FSM）"
            stateLabel={sTab[sState]?.label ?? sState}
            table={sTab}
            stateId={sState}
            activeTrans={lastStep && lastStep.side === '发送方' ? lastStep.transIdx : null}
            accent="var(--brand)"
          />
          <StateBox
            title="接收方状态机（Receiver FSM）"
            stateLabel={rTab[rState]?.label ?? rState}
            table={rTab}
            stateId={rState}
            activeTrans={lastStep && lastStep.side === '接收方' ? lastStep.transIdx : null}
            accent="#16a078"
          />
        </div>

        {/* 线上报文 */}
        <div
          className="rounded-lg px-3 py-2.5 text-xs mono flex items-center justify-between gap-3 flex-wrap"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <span className="muted">线上报文</span>
          <span
            className="font-semibold"
            style={{
              color: lastStep ? (lastStep.tone === 'warn' ? '#dc7828' : lastStep.tone === 'ok' ? '#16a078' : 'var(--brand)') : 'var(--text-muted)',
            }}
          >
            {lastStep ? lastStep.wire.text : '（等待第一个动作）'}
            {lastStep?.wire.corrupt ? '  ⚠ 比特已被翻转' : ''}
          </span>
          <span className="muted">
            {applied} / {steps.length} 步
          </span>
        </div>

        {/* 当前步骤说明 */}
        <StepNote
          tone={lastStep ? lastStep.tone : 'info'}
          text={
            lastStep
              ? `【${lastStep.side}】${lastStep.cond} → ${lastStep.actions.join('；')}${
                  lastStep.comment ? '。' + lastStep.comment : ''
                }`
              : '点击「单步」或「播放」开始运行协议。每一步都是一次 FSM 迁移。'
          }
        />

        <ResultGrid
          items={[
            { label: '交付上层的数据', value: deliveredSoFar.join(', ') || '（无）', highlight: true },
            { label: '重复交付次数', value: `${dupSoFar} 次`, hint: dupSoFar > 0 ? '上层收到了重复数据！' : '正常' },
            { label: '协议状态', value: sim.deadlocked ? '卡死' : applied >= steps.length ? '完成' : '进行中', hint: `协议 ${ver}` },
          ]}
        />

        {/* 结论 */}
        <StepNote tone={conclusion.tone} text={conclusion.text} />

        {/* 步骤列表 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">迁移记录</div>
          <ol className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {steps.map((st, i) => (
              <li
                key={st.n}
                className="rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed"
                style={{
                  background: i < applied ? 'var(--surface-2)' : 'transparent',
                  border: `1px solid ${i === applied ? 'var(--brand)' : 'var(--border)'}`,
                  opacity: i < applied ? 1 : 0.6,
                }}
              >
                <span className="mono muted">{st.n}.</span>{' '}
                <span className="font-semibold">{st.side}</span>{' '}
                <span className="mono" style={{ color: st.tone === 'warn' ? '#dc7828' : st.tone === 'ok' ? '#16a078' : 'var(--text)' }}>
                  {st.cond}
                </span>
                <span className="muted"> ⇒ {st.actions.join('；')}</span>
              </li>
            ))}
          </ol>
        </div>

        {sim.notes.length > 0 && (
          <div className="space-y-1">
            {sim.notes.map((n, i) => (
              <div
                key={i}
                className="rounded-lg px-3 py-2 text-xs leading-relaxed"
                style={{ background: 'rgba(220,120,40,0.10)', color: '#dc7828' }}
              >
                ⚠ {n}
              </div>
            ))}
          </div>
        )}
      </div>
    </DemoFrame>
  )
}
