import { createServer } from 'vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root=resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const server=await createServer({ root, configFile: resolve(root, 'vite.config.ts'), server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' })
try {
  const checks=[
    ['/src/components/figures/refresh/ch3-reliability/RdtEvolutionFigure.tsx', ['rdt1', 'rdt2', 'rdt21', 'rdt22', 'rdt3']],
    ['/src/components/figures/refresh/ch3-reliability/TcpReliabilityFigure.tsx', ['fast', 'timeout', 'ackloss']],
    ['/src/components/figures/refresh/ch3-reliability/TcpByteAssemblyFigure.tsx', []]
  ]
  for (const [path, modes] of checks) { const m=await server.ssrLoadModule(path); if (typeof m.assertModel!=='function') throw Error(path+' does not export assertModel'); m.assertModel(); console.log(path+': pure state transition assertions passed') }
} finally { await server.close() }
