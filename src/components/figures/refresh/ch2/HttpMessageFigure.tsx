import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, initialTime, prefersStillness, usePlayClock } from '../../figureKit'
import { W, H, box, projection, text, type P } from './primitives'
type Mode = 'request' | 'response' | 'fields'
type Status = '200 OK' | '304 Not Modified' | '404 Not Found'

export const auditProjection = () => projection([[-220, -86, 0], [220, 86, 30]], 42, 31)

const stages: Record<Mode, { title: string; explain: string }> = {
  request: { title: '请求报文', explain: 'POST 请求示例按顺序呈现请求行、首部、空行与实体正文。' },
  response: { title: '响应报文', explain: '状态码位于响应状态行。304 Not Modified 响应不携带正文，客户端复用缓存实体。' },
  fields: { title: '首部字段', explain: '请求首部说明客户端的请求信息；本例展示 Accept 与 Cache-Control。' },
}

const statuses: Status[] = ['200 OK', '304 Not Modified', '404 Not Found']

function printedMark(P: P, start: k.Point3, end: k.Point3, name: string, tone: k.LineTone = 'hi') {
  // These paths represent printing on the instrument panel, not floating wires.
  return k.lineSvg(k.segment(start, end, P), { tone, free: true }).replace('<path', `<path data-part="${name}"`)
}

export function messageModel(mode: Mode, stage: number, status: Status = '200 OK') {
  const start = mode === 'response'
    ? `HTTP/1.1 ${status}`
    : mode === 'fields'
      ? 'GET /resource HTTP/1.1'
      : 'POST /resource HTTP/1.1'
  const responseBody = status.startsWith('304') ? '' : status.startsWith('404') ? 'Not Found' : 'resource data'
  const headers = mode === 'response'
    ? [
        'Date: Sat, 24 Oct 2026 12:00:00 GMT',
        'ETag: "v1"',
        'Cache-Control: max-age=60',
        ...(responseBody ? [`Content-Length: ${new TextEncoder().encode(responseBody).length}`] : []),
      ]
    : mode === 'fields'
      ? ['Accept: */*', 'Cache-Control: no-cache', 'Host: site']
      : ['Host: site', 'Content-Type: text/plain', 'Content-Length: 8']
  const body = mode === 'request'
    ? 'name=Ana'
    : mode === 'fields'
      ? ''
      : responseBody
  return { mode, stage, status, start, headers, separator: 'CRLF', body, hasBody: Boolean(body) }
}

export function draw(mode: Mode, t: number, P: P, status: Status = '200 OK') {
  const o: string[] = []
  const stage = Math.floor((t % 8) / 2)
  const model = messageModel(mode, stage, status)
  const bodyPanelLabel = stage === 2
    ? 'CRLF 空行'
    : stage === 3 && !model.hasBody
      ? mode === 'response' ? '复用缓存' : 'GET 无正文'
      : stage === 3
        ? mode === 'request' ? 'POST 正文' : '响应实体'
        : '消息体'
  const bodyPanelLabelSize = stage >= 2 ? 18 : 24
  o.push(box(P, -210, -72, 420, 144, 0, 10, 'lo', 'message-workbench', { ground: true }))
  o.push(box(P, -186, -39, 122, 78, 10, 3, 'mid', 'start-line-panel'))
  o.push(box(P, -46, -39, 122, 78, 10, 3, 'mid', 'header-panel'))
  o.push(box(P, 94, -39, 100, 78, 10, 3, 'mid', 'body-panel'))
  o.push(text(P, [-125, -15, 14], mode === 'response' ? '状态行' : '请求行', 24))
  o.push(text(P, [15, -15, 14], '首部字段', 24))
  o.push(text(P, [144, -15, 14], bodyPanelLabel, bodyPanelLabelSize))

  if (stage === 2) {
    o.push(printedMark(P, [111, 12, 14], [177, 12, 14], 'crlf-separator'))
  }

  const x = stage === 0 ? -125 : stage === 1 ? 15 : 144
  // This short moving mark is printed stage-selection ink, so both line ends are intentional.
  o.push(printedMark(P, [x, -35, 13], [x, -25, 13], 'inspection-marker'))
  return o.join('')
}
export default function HttpMessageFigure({
  auditMode,
  auditTime,
  auditStatus,
}: {
  auditMode?: Mode
  auditTime?: number
  auditStatus?: Status
} = {}) {
  const [mode, setMode] = useState<Mode>(auditMode ?? 'request')
  const [status, setStatus] = useState<Status>(auditStatus ?? '200 OK')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime ?? initialTime())
  const P = useMemo(() => auditProjection(), [])
  const state = stages[mode]
  const stage = Math.floor((t % 8) / 2)
  const model = messageModel(mode, stage, status)
  const lines = [model.start, ...model.headers, '', ...(model.hasBody ? [model.body] : [])]
  const separatorIndex = 1 + model.headers.length
  const bodyIndex = separatorIndex + 1
  const activeLine = (index: number) =>
    (stage === 0 && index === 0) ||
    (stage === 1 && index > 0 && index < separatorIndex) ||
    (stage === 2 && index === separatorIndex) ||
    (stage === 3 && index === bodyIndex)

  const readout = mode === 'response' && status.startsWith('304')
    ? '304 响应没有消息体，客户端复用缓存实体'
    : mode === 'response'
      ? '状态码在四阶段检查中保持不变'
      : mode === 'request'
        ? 'POST 正文 name=Ana 为 8 个 ASCII 字节'
        : 'GET 请求首部示例'

  return (
    <FigureCard
      fig="Fig 2.2.2"
      title="HTTP 报文检查台"
      subtitle={`${state.title} · ${['起始行', '首部', '空行', model.hasBody ? '实体正文' : '无消息体'][stage]}${mode === 'response' ? ` · ${status}` : ''}`}
      readout={<span>{readout}</span>}
      running={running}
      onToggle={() => setRunning((value) => !value)}
      onReset={() => setT(0)}
      extra={
        <div className="flex flex-wrap gap-1">
          {(['request', 'response', 'fields'] as Mode[]).map((nextMode) => (
            <button
              key={nextMode}
              className="btn-outline"
              onClick={() => { setT(0); setMode(nextMode) }}
            >
              {stages[nextMode].title}
            </button>
          ))}
          {mode === 'response' && statuses.map((code) => (
            <button
              key={code}
              className="btn-outline"
              aria-pressed={status === code}
              onClick={() => setStatus(code)}
            >
              {code.slice(0, 3)}
            </button>
          ))}
        </div>
      }
      caption={state.explain}
      legend="左：起始行　·　中：对应方向的首部　·　右：正文或空行边界"
    >
      <div className="http-message-sheet" aria-label="HTTP 报文示例">
        <pre>
          {lines.map((line, index) => (
            <span key={index} className={activeLine(index) ? 'is-current' : undefined}>
              {line || '␍␊'}{'\n'}
            </span>
          ))}
        </pre>
        {mode === 'response' && status.startsWith('304') && stage === 3 && (
          <p className="http-no-body">304 响应结束于首部；没有消息体。</p>
        )}
      </div>
      <Scene
        width={W}
        height={H}
        label={`HTTP ${state.title}${mode === 'response' ? `，${status}` : ''}`}
        svg={draw(mode, t, P, status)}
      />
    </FigureCard>
  )
}
