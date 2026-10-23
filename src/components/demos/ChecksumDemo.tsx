import { useMemo, useState } from 'react'
import { DemoFrame, ParamSelect, ResultGrid, StepNote } from './DemoKit'

/**
 * 因特网校验和（Internet Checksum）：
 * - 把报文段内容看成 16 位整数的序列
 * - 用 1's 补码加法求和，最高位进位回卷到最低位
 * - 校验和 = 该和按位取反
 * 接收端把「内容 + 校验和」再算一次 1's 补码和：结果为全 1（0xFFFF）说明无错。
 */

const MASK16 = 0xffff

/** 1's 补码加法：逐字相加并把进位回卷 */
function onesComplementSum(words: number[]): { sum: number; carryCount: number } {
  let sum = 0
  let carryCount = 0
  for (const w of words) {
    const t = sum + (w & MASK16)
    if (t > MASK16) carryCount++
    sum = (t & MASK16) + (t >>> 16)
    // 处理回卷后可能再次产生的进位
    if (sum > MASK16) {
      sum = (sum & MASK16) + 1
      carryCount++
    }
  }
  return { sum: sum & MASK16, carryCount }
}

function toBits(n: number, width = 16): string {
  return (n & MASK16).toString(2).padStart(width, '0')
}

function hex(n: number): string {
  return '0x' + (n & MASK16).toString(16).toUpperCase().padStart(4, '0')
}

/** 默认演示数据：PPT 第 19 页例子 */
const PPT_WORD_A = 0xe666
const PPT_WORD_B = 0xd555

interface Example {
  id: string
  label: string
  words: number[]
  note: string
}

const EXAMPLES: Example[] = [
  {
    id: 'ppt',
    label: 'PPT 例：两个 16 位整数相加',
    words: [PPT_WORD_A, PPT_WORD_B],
    note:
      '这是 PPT 第 19 页的原例：两个 16 位整数相加，最高位产生进位（wraparound carryout），把进位加回最低位，再取反得到校验和。',
  },
  {
    id: 'udp',
    label: 'UDP 报文段（8 字节首部 + 2 字节数据）',
    words: [0x0020, 0x1a0b, 0x0044, 0x0011, 0x0000, 0x0043, 0x0001, 0x0000],
    note:
      '模拟一个真实 UDP 报文段：首部 8 字节 = 源端口/目的端口/长度/校验和(先填 0)，再加 2 字节应用数据。注意 UDP 的校验和含伪首部与整个 UDP 报文段。',
  },
  {
    id: 'simple',
    label: '简单例子：两个 16 位字',
    words: [0x000f, 0x00f0],
    note: '不产生进位的情况，用于对照：0x000F + 0x00F0 = 0x00FF，校验和就是 0xFF00。',
  },
]

export default function ChecksumDemo() {
  const [exampleId, setExampleId] = useState('ppt')
  const [flipBit, setFlipBit] = useState<number | null>(null) // 要翻转的比特位序号（0 = 最高位）
  const [customWords, setCustomWords] = useState<string>('0xE666, 0xD555')

  const example = EXAMPLES.find((e) => e.id === exampleId) ?? EXAMPLES[0]

  // 自定义输入解析
  const parsedCustom = useMemo(() => {
    const parts = customWords
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const v = s.toLowerCase().startsWith('0x') ? parseInt(s.slice(2), 16) : parseInt(s, 10)
        return Number.isFinite(v) && v >= 0 && v <= MASK16 ? v : null
      })
    if (parts.length === 0 || parts.some((p) => p === null)) return null
    return parts as number[]
  }, [customWords])

  const baseWords: number[] =
    exampleId === 'custom' ? (parsedCustom ?? []) : example.words

  // 比特翻转：位置 0 是最高位（bit15），位置 15 是最低位（bit0）
  const flipped = useMemo(() => {
    if (flipBit === null) return baseWords
    const pos = flipBit % 16
    const bitMask = 1 << (15 - pos)
    return baseWords.map((w, i) => {
      if (i === Math.floor(flipBit / 16)) return w ^ bitMask
      return w
    })
  }, [baseWords, flipBit])

  const sender = useMemo(() => onesComplementSum(baseWords), [baseWords])
  const receiver = useMemo(() => onesComplementSum(flipped), [flipped])
  const checksum = (~sender.sum) & MASK16
  const recvSum = useMemo(() => {
    // 接收端：内容 + 校验和字段，再算一次 1's 补码和
    const words = [...flipped, checksum]
    let sum = 0
    let carryCount = 0
    for (const w of words) {
      const t = sum + (w & MASK16)
      if (t > MASK16) carryCount++
      sum = (t & MASK16) + (t >>> 16)
      if (sum > MASK16) {
        sum = (sum & MASK16) + 1
        carryCount++
      }
    }
    return { sum: sum & MASK16, carryCount }
  }, [flipped, checksum])

  const noError = recvSum.sum === MASK16
  const bitFlipped = flipBit !== null

  // 逐位翻转表（对当前示例的所有字）
  const totalBits = baseWords.length * 16

  return (
    <DemoFrame
      title="因特网校验和：1's 补码加法与回卷进位"
      description="发送端把报文段按 16 位分组做 1's 补码加法，最高位进位回卷，结果取反写入校验和字段。接收端把校验和一起加回去，结果为全 1 即无错误。"
      controls={
        <>
          <ParamSelect
            label="示例数据"
            value={exampleId}
            onChange={(v) => {
              setExampleId(v)
              setFlipBit(null)
            }}
            options={[...EXAMPLES.map((e) => ({ value: e.id, label: e.label })), { value: 'custom', label: '自定义 16 位字序列' }]}
          />
          {exampleId === 'custom' && (
            <input
              value={customWords}
              onChange={(e) => setCustomWords(e.target.value)}
              placeholder="0xE666, 0xD555"
              className="px-2 py-1.5 rounded-md text-xs outline-none mono w-44"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          )}
        </>
      }
      legend={[
        { color: 'var(--brand)', label: '原始 16 位字' },
        { color: '#dc7828', label: '被翻转的比特' },
        { color: '#16a078', label: '校验和字段' },
      ]}
    >
      <div className="space-y-4">
        {/* 比特翻转注入 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="text-xs font-semibold">注入比特翻转（模拟传输中 0↔1）</div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] muted">翻转位：</span>
              {flipBit === null ? (
                <span className="text-[11px] mono">无</span>
              ) : (
                <span className="text-[11px] mono text-brand">
                  第 {Math.floor(flipBit / 16) + 1} 个字 · 第 {(flipBit % 16) + 1} 位（从左起）
                </span>
              )}
              <button
                onClick={() => setFlipBit(null)}
                disabled={flipBit === null}
                className="btn-ghost !px-2 !py-1 !text-[11px]"
              >
                撤销翻转
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {baseWords.map((w, wi) => (
              <div key={wi} className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] mono muted w-14 shrink-0">字 {wi + 1}</span>
                {Array.from({ length: 16 }, (_, b) => {
                  const idx = wi * 16 + b
                  const isFlipped = flipBit === idx
                  const bit = (w >> (15 - b)) & 1
                  return (
                    <button
                      key={b}
                      onClick={() => setFlipBit(isFlipped ? null : idx)}
                      title={`点击翻转字 ${wi + 1} 的第 ${b + 1} 位`}
                      className="w-6 h-6 rounded text-[10px] mono font-bold transition-colors"
                      style={{
                        background: isFlipped ? 'rgba(220,120,40,0.9)' : 'var(--surface)',
                        border: `1px solid ${isFlipped ? '#dc7828' : 'var(--border)'}`,
                        color: isFlipped ? '#fff' : 'var(--text)',
                      }}
                    >
                      {isFlipped ? bit ^ 1 : bit}
                    </button>
                  )
                })}
                <span className="text-[10px] mono muted ml-1">{hex(w)}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] muted mt-2">共 {totalBits} 个比特位，可逐位点击翻转。</div>
        </div>

        {/* 逐位加法 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">第 1 步：按 16 位分组做 1's 补码加法</div>
          <div className="rounded-lg p-3 mono text-[11px] overflow-x-auto" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="muted w-14 shrink-0">加数 1</span>
              {baseWords.map((w, i) => (
                <span key={`a${i}`} className="tracking-[0.2em] whitespace-pre">
                  {toBits(w)}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 min-w-max mt-1">
              <span className="muted w-14 shrink-0">加数 2</span>
              {baseWords.map((w, i) => (
                <span key={`b${i}`} className="tracking-[0.2em] whitespace-pre">
                  {toBits(w)}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 min-w-max mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="muted w-14 shrink-0">原始和</span>
              <span className="tracking-[0.2em] whitespace-pre">
                {toBits(sender.sum)}
              </span>
              <span className="muted">
                （本次共 {sender.carryCount} 次回卷进位 carryout，1's 补码加法把进位加回最低位）
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-max mt-1">
              <span className="muted w-14 shrink-0">回卷后</span>
              <span className="tracking-[0.2em] whitespace-pre font-semibold">
                {toBits(sender.sum)}
              </span>
              <span className="muted">= {hex(sender.sum)}</span>
            </div>
          </div>

          {/* 显式的两字加法展开（对应 PPT 第 19 页） */}
          {baseWords.length === 2 && (
            <div className="mt-2 rounded-lg p-3 mono text-[11px] overflow-x-auto" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="muted mb-1">两字相加展开（进位回卷）</div>
              <div className="whitespace-pre min-w-max leading-relaxed">
                {toBits(baseWords[0])}
                <br />
                {'+ ' + toBits(baseWords[1])}
                <br />
                {'=' + toBits((baseWords[0] + baseWords[1]) & 0x1ffff).padStart(17, '0')}
                <span className="muted">  ← 最高位的 1 是回卷进位</span>
                <br />
                {' ' + toBits(sender.sum).padStart(17, '0').slice(0, 16)}
                <span className="muted">+ 回卷进位 1</span>
                <br />
                {'=' + toBits(sender.sum).padStart(16, '0')}
                <span className="muted"> = {hex(sender.sum)}</span>
              </div>
            </div>
          )}
        </div>

        {/* 校验和 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">第 2 步：按位取反得到校验和，写入 UDP 校验和字段</div>
          <div className="rounded-lg p-3 mono text-[11px] overflow-x-auto" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="muted w-20 shrink-0">1's 补码和</span>
              <span className="tracking-[0.2em] whitespace-pre">{toBits(sender.sum)}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-max mt-1">
              <span className="muted w-20 shrink-0">取反</span>
              <span className="tracking-[0.2em] whitespace-pre font-semibold text-brand">{toBits(checksum)}</span>
              <span className="muted">= {hex(checksum)}</span>
            </div>
          </div>
        </div>

        {/* 接收端 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">第 3 步：接收端重算（含校验和字段）</div>
          <div className="rounded-lg p-3 mono text-[11px] overflow-x-auto" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="muted w-20 shrink-0">收到的内容</span>
              {flipped.map((w, i) => (
                <span key={`r${i}`} className="tracking-[0.2em] whitespace-pre" style={{ color: flipBit !== null && Math.floor(flipBit / 16) === i ? '#dc7828' : undefined }}>
                  {toBits(w)}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 min-w-max mt-1">
              <span className="muted w-20 shrink-0">校验和字段</span>
              <span className="tracking-[0.2em] whitespace-pre" style={{ color: '#16a078' }}>
                {toBits(checksum)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-max mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="muted w-20 shrink-0">1's 补码和</span>
              <span
                className="tracking-[0.2em] whitespace-pre font-semibold"
                style={{ color: noError ? '#16a078' : '#dc7828' }}
              >
                {toBits(recvSum.sum)}
              </span>
              <span className="muted">= {hex(recvSum.sum)}</span>
            </div>
            <div className="mt-2 font-sans text-[12px]">
              {noError ? (
                <span style={{ color: '#16a078' }}>
                  ✓ 结果为全 1（0xFFFF）：<b>未检测到错误</b>
                </span>
              ) : (
                <span style={{ color: '#dc7828' }}>
                  ✗ 结果不为 0xFFFF：<b>检测到错误</b>，该报文段被丢弃
                </span>
              )}
            </div>
          </div>
        </div>

        <ResultGrid
          items={[
            { label: '16 位字个数', value: `${baseWords.length} 个` },
            { label: '校验和', value: hex(checksum), highlight: true, hint: '发送端写入字段的值' },
            {
              label: '接收端重算和',
              value: hex(recvSum.sum),
              hint: noError ? '= 0xFFFF，无错误' : '≠ 0xFFFF，有错误',
            },
          ]}
        />

        <StepNote
          tone={bitFlipped ? (noError ? 'warn' : 'ok') : 'info'}
          text={
            bitFlipped
              ? noError
                ? `注入了比特翻转，但接收端仍算出 0xFFFF——校验和只能检测<b>大部分</b>错误，某些比特翻转组合仍可能通过（PPT 第 18 页：“YES - no error detected. But maybe errors nonetheless?”）。`
                : `比特翻转被成功检测：接收端重算和为 ${hex(recvSum.sum)} ≠ 0xFFFF，判定为出错并丢弃报文段。`
              : example.note
          }
        />
      </div>
    </DemoFrame>
  )
}
