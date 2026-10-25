# Figure audit A

Run from `work/repo`:

```powershell
node scripts/figure-audit-a/anatomy-audit.mjs
node scripts/figure-audit-a/anatomy-audit.mjs f1.2.10-media --case=twisted-sample --verbose
node scripts/figure-audit-a/anatomy-audit.mjs f1.1.4-protocol-sequence --negative-depth-test
npm run typecheck
```

The audit SSR-renders each actual component state, parses the same SVG groups' 3D metadata, records every real solid/tube, and audits actual assembly membership, support, contact, and render order. `--case=<name>` selects one matrix pose; `--verbose` prints assembly-local depth order and geometry metadata. `ANATOMY_SKILL_DIR` may point to an Anatomy install; otherwise the driver checks `%USERPROFILE%/.codex/skills/anatomy` and `$HOME/.codex/skills/anatomy`.

## Verified matrix (2026-10-24)

A full run of `node scripts/figure-audit-a/anatomy-audit.mjs` covered 52 SSR cases. All 52 had zero Anatomy findings; assembly-local depth checks also had zero findings. The separate Protocol negative test moved the actual bed group's recorder item last and detected 5 depth findings, confirming the rendered-order check is sensitive to the real SVG order. `CONNECTION_STATE_ASSERTIONS` reported 16 passed.

| Figure ID | Cases | Solids + tubes per case | Assembly items | Findings |
| --- | --- | --- | --- | --- |
| `f1.1.4-protocol-sequence` | `valid-request`, `valid-execute`, `invalid-blocked`, `invalid-permitted` | 69–70 + 0 | 5–6 | 0 |
| `f1.2.5-access-network` | DSL/HFC/wireless uplink and downlink | DSL/wireless 28; HFC 37 + 0 | 3 or 6 | 0 |
| `f1.2.10-media` | `twisted-sample`, `coax-sample`, `fiber-sample`, `radio-sample`, `radio-wave-end` | twisted 17 + 16; coax/fiber 23 + 0; radio 17 + 0 | twisted 1; coax/fiber 4; radio 2 | 0 |
| `f1.3.5-forwarding-routing` | `datagram`, `virtual` | 73 + 0 | 6 | 0 |
| `f1.3.7-isp-hierarchy` | `customer`, `peer`, `upstream` | 57 + 0 | 5 | 0 |
| `f1.4.1-throughput` | `single`, `shared`, `bottleneck` | 29 + 0 | 4 | 0 |
| `f1.4.6-loss` | stable/burst `queued` and `drain` | 21 + 0 | 3 | 0 |
| `f1.5.1-layer-service` | 8 five-layer/OSI/TCP states | 25, 27, or 31 + 0 | 2 | 0 |
| `f3.5.4-rtt-timeout` | `sample-outbound`, `sample-return`, `estimate`, `timer-ack-arrived`, `timer-timeout` | 16 + 0 | 2 | 0 |
| `f3.5.9-connection-management` | 5 two-message, 3 handshake, 4 close/TIME_WAIT states | 15 or 16 + 0 | 2 | 0 |

The zoomed twisted-pair pose was separately rerun after its visual enlargement: 17 solids, 16 individually tracked swept sections, one assembly with 22 actual members, zero geometry findings and zero local-depth findings. The audit combines those adjacent sections by conductor owner into two continuous routes, so only the two physical sample ends per conductor are treated as free. Each section remains independently recorded for geometry and depth.

## Visible behavior and browser verification

All eight A-owned figures were captured from their exact learning-page routes in default, played, dark desktop, and 390px dark states. The report at `../captures/new-figures-a-current/identity-and-state-report.json` records the page heading, figure ID/title, readout after play, endpoint audit for default and played SVGs, and mobile overflow. Results: 8/8 route identities correct, 8/8 play states changed, 0 `LINE_ENDS` findings across default and played states, 0 page errors, and 0 horizontal overflow. Contact sheets and screenshots sit beside the report. The larger blue/red twisted-pair rendering was inspected at 390px; both swept conductors and the marker moving along their axis are visible. This browser check is separate from SSR geometry auditing.

The states visible in those captures and implemented controls are:

| Figure | Modes and observed behavior |
| --- | --- |
| Protocol sequence | Valid request, reply, and execution; invalid mode sends the reply too early, blocks it at the interlock, then accepts request and correctly ordered reply. Message direction and phase readout agree. |
| Access network | DSL copper pair, shared HFC coax after the optical node, and wireless terminal-to-access-point link; each cycles request, uplink, access-node receipt, and downlink along the selected path. |
| Throughput | Demand-limited single flow, shared-link competition, and a changed bottleneck. Readout uses Mb/s for rates and Mbit for accumulated output; the shared-traffic deduction is labeled as an example assumption. |
| Packet loss | Stable 1-arrival/1-service and burst 3-arrival/1-service cases with five queue places. Counts are for the modeled time slot; rejected arrivals divert to the tail-drop illustration. |
| Media | Twisted pair, coax, fiber, and radio. Twisted pair's marker follows its enlarged conductor axis at z=27; coax/fiber are non-scale disassembled samples; radio wavefronts move from the sending antenna to the receiver. |
| Layer service | Teaching five-layer, OSI seven-layer, and TCP/IP four-layer stacks. Processing descends from application; displayed headers accumulate at transport, network, and link/interface layers and remain through physical conversion to bits. Peer lines are explicitly logical. |
| RTT/RTO | RTT sample, smoothed estimates, and timer cases with returning or lost ACK. Elapsed time, sample, and RTO share millisecond units; retransmission occurs only if the ACK is absent when the RTO threshold is reached. Probe paths are logical. |
| Connection management | Two-message stale-SYN failure, three-way establishment, and four-message close. Sequence/ACK values, packet direction, arrival-driven endpoint states, half-close, and active closer TIME_WAIT follow the selected step. Direction lanes are logical. |

Protocol's two detached decorative strokes were removed after browser endpoint inspection. The competing-flow branch, tail-drop route, service-egress indication, layer peer links, RTT paths, and TCP direction lanes are signal/logic overlays, not physical hardware; their free ends are declared explicitly in the SVG metadata. Current browser `LINE_ENDS` is zero for every default and played capture.

## Playback cost and pause behavior (2026-10-25)

The implementation does **not** yet cache static SVG geometry or transform only a moving part. `MediaFigure`'s memoized scene depends on `progress`; each tick rebuilds its SVG string, including the swept twisted-pair sections. `ConnectionManagementFigure` also depends on per-tick `progress`/`flight` and rebuilds its full SVG string. `Scene` replaces the SVG markup when that string changes. `usePlayClock` schedules state updates at a maximum 30 Hz; this is a scheduling ceiling, not a measured playback frame rate.

A local headless Chrome sample at 1440×1000 measured SVG DOM commits over roughly 2 seconds:

| Figure | Commits | Mean / median interval | Estimated commit rate | Maximum interval |
| --- | ---: | ---: | ---: | ---: |
| Media, twisted pair | 28 / 2.005 s | 71.45 / 69.8 ms | 14.0 Hz | 82.5 ms |
| Connection management | 29 / 2.014 s | 69.47 / 69.4 ms | 14.4 Hz | 71.2 ms |

These are local headless-browser samples under the current machine load, not a device-independent benchmark or a guarantee of user-visible FPS. They show the current full-scene approach commits substantially below the 30 Hz clock ceiling in this environment; no static-cache performance claim is made. Pausing the control produced zero SVG commits during the following 400 ms for both figures.

For both figures, a short-viewport scroll moved the `FigureHost` outside its 120 px observer margin: `data-in-view=false`, card `data-playing=false`, no SVG commits during the following 400 ms, and a stable readout. The `visibilitychange` handler was separately exercised by setting a synthetic hidden `document.visibilityState` and dispatching the event; both figures stopped with zero commits and stable readouts. This confirms the event path, but is not evidence from an actual background-tab switch in headless Chrome. Source path: `FigureHost`'s `IntersectionObserver` context and `figureKit.tsx`'s `usePageVisible`/`usePlayClock` effects.

The recorder preserves the real SVG group start order when settling geometry. Assembly members are still individually recorded; assembly wrappers only define actual physical equipment units and are locally depth-checked. The former hand-written `access-network.audit.mjs` was a substitute scene and is not verification evidence.
