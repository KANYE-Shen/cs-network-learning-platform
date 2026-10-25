import { describe, expect, it } from 'vitest'
import * as isoKit from '../components/iso/iso-kit'
import { S, trackedKit } from '../components/figures/refresh/ch1/parts'

describe('tracked iso-kit wrapper', () => {
  it('wraps frozen module exports and keeps 3D audit metadata on rendered solids', () => {
    const frozenKit = Object.freeze({ ...isoKit }) as typeof isoKit
    const tracked = trackedKit(frozenKit)
    const projection: isoKit.Projection = { origin: [80, 60], scale: 2, azimuth: 34, elevation: 31 }
    const cylinder = tracked.cylinder(4, 5, 2, 3, 4, projection, 12)
    const slab = tracked.slabOf({ x: 2, y: 3, w: 10, d: 8, r: 1 }, 1, 2, projection, 8, 0.4)

    expect(tracked.iso([1, 2, 3], projection)).toEqual(isoKit.iso([1, 2, 3], projection))
    expect(S(cylinder)).toContain('data-shape="cylinder"')
    expect(S(cylinder)).toContain('data-x="4"')
    expect(S(slab)).toContain('data-shape="slab"')
    expect(S(slab)).toContain('data-w="10"')
  })
})
