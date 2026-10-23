import { lazy, Suspense } from 'react'
import { demoById } from '../../content/registry'

/**
 * 演示组件注册表 —— demoId → 组件。
 * 使用 lazy 动态导入，保证首屏只加载需要的演示。
 */
export const registry: Record<string, React.LazyExoticComponent<any>> = {
  CircuitSwitchDemo: lazy(() => import('./CircuitSwitchDemo')),
  StoreForwardDemo: lazy(() => import('./StoreForwardDemo')),
  IspTopologyDemo: lazy(() => import('./IspTopologyDemo')),
  NodalDelayDemo: lazy(() => import('./NodalDelayDemo')),
  QueueingDemo: lazy(() => import('./QueueingDemo')),
  ThroughputDemo: lazy(() => import('./ThroughputDemo')),
  EncapsulationDemo: lazy(() => import('./EncapsulationDemo')),
  HttpTimingDemo: lazy(() => import('./HttpTimingDemo')),
  CacheDemo: lazy(() => import('./CacheDemo')),
  DnsQueryDemo: lazy(() => import('./DnsQueryDemo')),
  DistributionDemo: lazy(() => import('./DistributionDemo')),
  CookieTrackingDemo: lazy(() => import('./CookieTrackingDemo')),
  UdpDemuxDemo: lazy(() => import('./UdpDemuxDemo')),
  ChecksumDemo: lazy(() => import('./ChecksumDemo')),
  Rdt2Demo: lazy(() => import('./Rdt2Demo')),
  Rdt3Demo: lazy(() => import('./Rdt3Demo')),
  GbnDemo: lazy(() => import('./GbnDemo')),
  SrDemo: lazy(() => import('./SrDemo')),
  SeqAckDemo: lazy(() => import('./SeqAckDemo')),
  RttTimeoutDemo: lazy(() => import('./RttTimeoutDemo')),
  FastRetransmitDemo: lazy(() => import('./FastRetransmitDemo')),
  FlowControlDemo: lazy(() => import('./FlowControlDemo')),
  HandshakeDemo: lazy(() => import('./HandshakeDemo')),
  TeardownDemo: lazy(() => import('./TeardownDemo')),
  CongestionDemo: lazy(() => import('./CongestionDemo')),
}

export function DemoHost({ demoId }: { demoId: string }) {
  const meta = demoById.get(demoId)
  if (!meta) {
    return (
      <div className="card p-5 text-sm muted">
        演示 <code>{demoId}</code> 尚未实现。
      </div>
    )
  }
  const Comp = registry[meta.component]
  if (!Comp) {
    return (
      <div className="card p-5 text-sm muted">
        演示组件 <code>{meta.component}</code> 尚未实现。
      </div>
    )
  }
  return (
    <Suspense
      fallback={
        <div className="card p-8 text-center text-sm muted">正在加载演示…</div>
      }
    >
      <Comp />
    </Suspense>
  )
}
