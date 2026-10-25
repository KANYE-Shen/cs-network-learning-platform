# Figure audit B

Validated on 2026-10-25. The B-owned matrix contains eight diagrams and 204 rendered states. An independent shared all-10 run covered 244 states and exited successfully with zero geometry findings; see `work/audit-b-final-independent.log` for its full output.

Run the B-owned checks from the repository root:

```powershell
$env:FIGURE_AUDIT_ONLY='s2.1.1,s2.2.3,s2.4.2,s2.5.1,s2.6.1,s3.4.1,s3.5.1,s3.5.3'
node scripts/figure-audit-b/anatomy-audit.mjs
Remove-Item Env:\FIGURE_AUDIT_ONLY
node scripts/figure-audit-b/state-model-check.mjs
npm run typecheck
```

The audit driver SSR-loads each actual `draw`/`model` function and its projection. It rebuilds each rendered physical slab/cylinder from the same emitted metadata with Anatomy `A.slab` / `A.cylinder`, keeps the true SVG draw ranks, records each real assembly separately for local depth checks, then runs `settle`, `audit`, and `auditOrExit`. Logical data tokens are excluded from support/intersection checks. Dashed communication routes are SVG logical overlays, not physical tubes, so zero Anatomy tubes is expected. The negative tests deliberately move the ground last and reverse a local assembly order where a multi-solid projected overlap exists.

| Subsection | States | Rendered solids (physical / logical) | Cross/local/support findings | Local negative test |
| --- | ---: | ---: | ---: | --- |
| s2.1.1 App architecture | 16 | 424 (392 / 32) | 0 | Detected, 91 findings |
| s2.2.3 Cookie/cache | 18 | 126 (90 / 36) | 0 | N/A; no local projected-overlap relation |
| s2.4.2 Mail retrieval | 18 | 130 (90 / 40) | 0 | Detected, 1 finding |
| s2.5.1 DNS | 42 | 300 (252 / 48) | 0 | N/A; no local projected-overlap relation |
| s2.6.1 File distribution | 12 | 84 (72 / 12) | 0 | N/A; no local projected-overlap relation |
| s3.4.1 RDT evolution | 40 | 195 (160 / 35) | 0 | N/A; no local projected-overlap relation |
| s3.5.1 TCP byte sequence | 24 | 120 (96 / 24) | 0 | N/A; no local projected-overlap relation |
| s3.5.3 TCP recovery | 34 | 165 (136 / 29) | 0 | N/A; no local projected-overlap relation |

The independent shared run also included integration-owned HTTP and transport diagrams: all 10 diagrams passed 244 total states with zero findings. The run detected all 10 deliberately inverted ground ranks. For B assemblies, the App rack and Mail desktop negative local-depth fixtures were detected; the remaining six have no multi-solid projected-overlap relation to invert. Earlier local-depth findings were fixed in actual SVG assembly draw order; they are not suppressed by changing the audit metadata.

The geometry audit loads the external Anatomy skill kit. Set `ANATOMY_SKILL_DIR` to its installation directory when it is not at the Windows default `%USERPROFILE%\.codex\skills\anatomy`. Normal `npm run typecheck`, tests, and build do not require that external kit.

`state-model-check.mjs` runs pure transition assertions for RDT, TCP byte assembly, and TCP recovery, including sender ACK versus receiver-next state, retransmission sequence range, arrival timing, and draw-level packet labels/endpoints. Browser checks are separate. The final frozen-source B capture on 2026-10-25 passed all eight identity checks, reported changing state for 8/8 cards, had zero page errors, zero 390px overflow, and zero default/played LINE_ENDS findings. The report and screenshots are in `work/captures/new-figures/identity-and-state-report.json` and sibling PNG files. The browser capture checks the URL, page heading, figure id, and figure title before saving each image.
