import { useMemo, useState } from 'react'
import { FigureCard, Scene, initialTime, prefersStillness, usePlayClock } from '../../figureKit'
import { W, H, box, port, projection, text, wire, type P } from './primitives'
type Mode = 'pop3' | 'imap'
export const auditProjection = () => projection([[-220, -84, 0], [220, 84, 100]], 42, 32)
export function draw(mode: Mode, remove: boolean, t: number, P: P) {
  const o: string[] = [], phase = Math.floor(t % 9 / 3), u = (t % 3) / 3
  // Three separate devices represent one server mailbox and two client stores.
  o.push(box(P, -210, -72, 420, 144, 0, 10, 'lo', 'mailroom-floor', { ground: true }))
  o.push(box(P, -42, -36, 84, 72, 10, 50, 'hi', 'server-mailbox', { assembly: 'mail-server' }))
  o.push(box(P, -193, -36, 68, 72, 10, 14, 'mid', 'desktop-mail-base', { assembly: 'mail-client-desktop' }))
  o.push(box(P, -186, 31, 54, 5, 24, 29, 'hi', 'desktop-mail-screen-frame', { assembly: 'mail-client-desktop' }))
  o.push(box(P, 137, -30, 34, 60, 10, 54, 'lo', 'phone-mail-device', { assembly: 'mail-client-phone' }))
  o.push(text(P, [0, -2, 67], '服务器邮箱', 9))
  o.push(text(P, [-159, 1, 56], '桌面收件箱', 7))
  o.push(text(P, [154, 1, 70], 'IMAP / POP3', 6))
  const desktopRoute: [[number, number, number], [number, number, number]] = [[-42, 36, 60], [-125, 36, 24]]
  const phoneRoute: [[number, number, number], [number, number, number]] = [[42, 36, 44], [154, 30, 40]]
  o.push(wire(P, desktopRoute[0], desktopRoute[1], 'server-to-desktop-mail-path', 'mid'))
  o.push(wire(P, phoneRoute[0], phoneRoute[1], 'server-to-phone-mail-path', 'mid'))
  o.push(port(P, desktopRoute[0], 'mail-server-desktop-port'), port(P, desktopRoute[1], 'desktop-mail-port'))
  o.push(port(P, phoneRoute[0], 'mail-server-phone-port'), port(P, phoneRoute[1], 'phone-mail-port'))
  if (!(mode === 'pop3' && remove && phase === 2)) o.push(box(P, -11, -7, 22, 14, 64, 5, 'hi', 'server-stored-message', { logical: true }))
  const copyDesktop = mode === 'pop3' ? phase >= 1 : phase >= 1
  const copyPhone = mode === 'imap' && phase >= 2
  if (copyDesktop) o.push(box(P, -174, -7, 22, 14, 55, 5, 'hi', 'desktop-local-message-copy', { logical: true }))
  if (copyPhone) o.push(box(P, 148, -7, 22, 14, 55, 5, 'hi', 'phone-local-message-copy', { logical: true }))
  // POP3: RETR, save and optional DELE, then QUIT/UPDATE. IMAP fetches each client copy in turn.
  const route = mode === 'pop3' || phase === 0 ? desktopRoute : phoneRoute
  const [x, y, z] = route[0].map((v, i) => v + (route[1][i]! - v) * u) as [number, number, number]
  if (mode === 'pop3' && phase === 0 || mode === 'imap' && phase < 2) o.push(box(P, x - 7, y - 5, 14, 10, z, 5, 'hi', 'retrieved-message-envelope', { logical: true }))
  if (mode === 'pop3' && remove && phase === 1) o.push(box(P, -28, -19, 40, 9, 73, 4, 'hi', 'dele-pending-mark', { logical: true }))
  o.push(text(P, [0, 56, 80], mode === 'pop3' ? (phase === 0 ? 'RETR 下载中' : phase === 1 ? (remove ? 'DELE 标记' : '本地保存') : (remove ? 'QUIT / UPDATE' : 'QUIT 保留')) : (phase === 0 ? 'FETCH → 桌面端' : phase === 1 ? 'FETCH → 手机端' : '两端同步可读'), 8))
  return o.join('')
}
export default function MailRetrievalFigure() {
  const [mode, setMode] = useState<Mode>('pop3')
  const [remove, setRemove] = useState(false)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const P = useMemo(() => auditProjection(), [])
  const phase = Math.floor(t % 9 / 3)
  const title = mode === 'pop3'
    ? ['RETR 下载邮件到客户端', '本地保存；可选 DELE 标记', 'QUIT 后提交或保留服务器副本'][phase]
    : ['服务器 FETCH 到桌面端', '服务器 FETCH 到手机端', '两端读取服务器邮箱状态'][phase]
  const explanation = mode === 'pop3'
    ? (remove
      ? 'RETR 下载邮件；DELE 只作删除标记，正常 QUIT 进入 UPDATE 阶段后才从服务器移除。'
      : 'RETR 下载邮件但保留服务器副本；是否删除取决于客户端策略，RETR 本身不删除。')
    : 'IMAP 邮件状态保留在服务器；每个终端读取同一邮箱中的邮件，标记等状态也由服务器同步。'

  return <FigureCard
    fig="Fig 2.4.2"
    title="邮件取信协议：服务器邮箱与多终端"
    subtitle={`${mode.toUpperCase()} · ${title}`}
    readout={<span>{mode === 'pop3'
      ? (phase === 0 ? 'RETR 正在下载' : phase === 1 ? (remove ? 'DELE 标记待 QUIT 提交' : '本地副本已保存') : (remove ? 'QUIT/UPDATE 已提交删除' : 'QUIT 后保留服务器副本'))
      : '服务器保留邮件，两端分别读取同一邮箱'}</span>}
    running={running}
    onToggle={() => setRunning(v => !v)}
    onReset={() => setT(0)}
    extra={<div className="flex gap-1">
      <button className="btn-outline" onClick={() => { setT(0); setMode('pop3') }}>POP3</button>
      <button className="btn-outline" onClick={() => { setT(0); setMode('imap') }}>IMAP</button>
      {mode === 'pop3' && <button className="btn-outline" aria-pressed={remove} onClick={() => { setT(0); setRemove(v => !v) }}>{remove ? 'RETR + DELE + QUIT' : '仅 RETR'}</button>}
    </div>}
    caption={explanation}
    legend="左：桌面客户端　·　中：服务器邮箱　·　右：手机客户端　·　虚线：邮件读取路径"
  >
    <Scene width={W} height={H} label={`邮件访问：${mode.toUpperCase()}，${title}`} svg={draw(mode, remove, t, P)} />
  </FigureCard>
}
