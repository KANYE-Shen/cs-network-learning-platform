// ============================================================
// 图解注册表：figureId → 懒加载的 SVG 等距示意图组件
// 图解 ID 与知识点 ID 对应：f{知识点后缀}-{名称}，如 f1.4.3-convoy
// ============================================================
import { lazy } from 'react'

export const figureRegistry: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'f1.4.3-convoy': lazy(() => import('./ConvoyFigure')),
  'f1.5.5-envelope': lazy(() => import('./EnvelopeFigure')),
  'f3.4.6-window': lazy(() => import('./WindowFigure')),
  'f3.5.8-rwnd': lazy(() => import('./RwndFigure')),
  'f1.1.1-nuts': lazy(() => import('./NutsFigure')),
  'f1.2.1-tiers': lazy(() => import('./EdgeCoreFigure')),
  'f1.3.1-circuits': lazy(() => import('./CircuitFigure')),
  'f1.6.2-ddos': lazy(() => import('./DdosFigure')),
  'f1.7.1-timeline': lazy(() => import('./HistoryFigure')),
  'f2.1.3-sockets': lazy(() => import('./SocketPortFigure')),
  'f2.2.4-httptime': lazy(() => import('./HttpTimeFigure')),
  'f2.3.1-ftp': lazy(() => import('./FtpFigure')),
  'f2.4.2-smtp': lazy(() => import('./SmtpFigure')),
  'f2.5.5-dnstree': lazy(() => import('./DnsTreeFigure')),
  'f2.6.2-bittorrent': lazy(() => import('./BitTorrentFigure')),
  'f2.7.2-socketapi': lazy(() => import('./SocketApiFigure')),
  'f3.1.1-transport': lazy(() => import('./TransportFigure')),
  'f3.2.3-demux': lazy(() => import('./DemuxFigure')),
  'f3.3.3-checksum': lazy(() => import('./ChecksumFigure')),
  'f3.6.1-congestion': lazy(() => import('./CongestionFigure')),
  'f3.7.2-cwnd': lazy(() => import('./CwndFigure')),
}
