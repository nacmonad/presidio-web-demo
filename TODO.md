# presidio-web-demo — implementation ledger

## Product claim

A useful PII review and redaction workbench that runs locally in the browser and continues
to work after the network is disconnected. The demo consumes the published `presidio-web`
package exactly as an external application would.

## Decisions

- Separate repository/application from `presidio-web`.
- Next.js App Router, TypeScript, and a dedicated analysis Web Worker.
- The service worker owns offline delivery only; it does not own inference.
- GLiNER execution provider order: WebGPU, multithreaded WASM/SIMD, single-threaded WASM.
- Cache Storage holds the application shell and versioned static assets.
- OPFS holds GLiNER model/tokenizer artifacts; IndexedDB will hold small metadata/preferences.
- Pattern/checksum detection is immediate. GLiNER is optional, lazy, and merged later.
- No document contents, findings, corrections, or document-derived analytics leave the browser.
- Self-host model and ORT artifacts in production so COEP and offline behavior are deterministic.

## Completed foundation

- [x] Scaffold separate Next.js application.
- [x] Consume published `presidio-web@0.1.0` from npm.
- [x] Add local text/file input, findings list, redacted output, and sample document.
- [x] Run Presidio analysis in a dedicated module worker.
- [x] Add PWA manifest and service-worker application-shell caching.
- [x] Add COOP/COEP/CORP headers for cross-origin isolation and threaded WASM.
- [x] Report analysis-worker, offline-shell, and WebGPU capability in the UI.
- [x] Add first-pass OPFS model status, quota, persistence, install progress, and removal UI.
- [x] Establish a clean lint and production-build baseline before OPFS changes.

## Immediate work

### OPFS model installer

- [ ] Complete and typecheck the OPFS installer.
- [ ] Self-host model/tokenizer files instead of relying on Hugging Face at runtime.
- [ ] Add a versioned model manifest containing exact byte lengths and SHA-256 hashes.
- [ ] Verify every downloaded file before promoting temporary files.
- [ ] Implement resumable downloads using byte ranges when the host supports them.
- [ ] Avoid a second full-size in-memory copy when promoting a `.partial` model.
- [ ] Make model-set installation atomic: an interrupted install must never appear ready.
- [ ] Handle insufficient quota, eviction, network interruption, and stale model versions.
- [ ] Add explicit update-model and clear-all-local-data actions.
- [ ] Test persistence and quota behavior in Chrome, Edge, Firefox, and Safari.

### GLiNER runtime

- [ ] Construct tokenizer and ONNX session from the OPFS artifacts.
- [ ] Attempt WebGPU session creation and warm-up; fall back on actual failure, not feature detection.
- [ ] Fall back to multithreaded WASM/SIMD, then single-threaded WASM.
- [ ] Configure and self-host matching ONNX Runtime WASM binaries.
- [ ] Keep one warm session in the analysis worker and dispose it cleanly.
- [ ] Connect `Gliner`, `GlinerRecognizer`, `NlpEngine`, and Wink artifacts to `AnalyzerEngine`.
- [ ] Define and document the default zero-shot entity-label schema.
- [ ] Merge delayed ML findings deterministically with immediate pattern findings.
- [ ] Add load, compile, warm-up, inference, and backend diagnostics.
- [ ] Evaluate WebGPU graph capture only if model shapes and operator coverage permit it.

### Long-document pipeline

- [ ] Define GLiNER token/window limits from the actual tokenizer/model configuration.
- [ ] Implement overlapping windows while preserving absolute character offsets.
- [ ] Merge spans crossing or repeating across window boundaries.
- [ ] Stream partial progress/findings to the UI.
- [ ] Add cancellation and stale-request suppression.
- [ ] Measure structured-clone and tokenizer costs before adding shared buffers.

## Review experience

- [ ] Render inline highlighted spans rather than findings only in a side list.
- [ ] Select/focus a finding bidirectionally between text and inspector.
- [ ] Allow per-finding include/exclude decisions.
- [ ] Add entity filters and confidence thresholds.
- [ ] Show recognizer, validation result, context boost, and explanation details.
- [ ] Add redaction operators: mask, entity label, stable local hash, and replacement.
- [ ] Export redacted text and findings JSON.
- [ ] Add keyboard navigation, screen-reader labels, contrast checks, and responsive tabs.
- [ ] Add clinical, legal, support-ticket, and international sample documents.

## PWA and privacy proof

- [ ] Replace the hand-written service-worker strategy with a versioned, testable precache manifest.
- [ ] Ensure Next.js chunk updates cannot strand an incompatible cached shell.
- [ ] Add install prompt and installed/offline state UX.
- [ ] Add an explicit offline-readiness check covering shell, ORT, tokenizer, and model.
- [ ] Demonstrate a complete scan after network disconnection.
- [ ] Add a network/privacy diagnostics panel and document every outbound request.
- [ ] Add a local-data inventory showing Cache Storage, OPFS, and preferences separately.
- [ ] Ensure no third-party fonts, scripts, telemetry, or runtime CDNs are required.
- [ ] Decide whether to disable Next.js telemetry in repository scripts/CI.

## Browser evidence and quality gates

- [ ] Unit-test result merging, redaction, chunk offsets, installer state, and failures.
- [ ] Add Playwright tests for worker scanning and review interactions.
- [ ] Add offline Playwright coverage after first-load/model installation.
- [ ] Run package parity fixtures through a real browser worker.
- [ ] Benchmark cold start, warm start, model initialization, and documents of several sizes.
- [ ] Record WebGPU versus WASM throughput on representative hardware.
- [ ] Maintain a browser capability matrix with measured results, not assumptions.
- [ ] Add CI gates: format, lint, typecheck, test, production build, browser smoke test.

## Future document adapters

- [ ] Define a `DocumentAdapter` interface returning text plus optional source regions.
- [ ] Add structured JSON/CSV handling with key/column-aware review.
- [ ] Add PDF text-layer extraction while preserving page/source coordinates.
- [ ] Research browser OCR in a worker for image text redaction.
- [ ] Map OCR spans back to editable bounding boxes rendered with `OffscreenCanvas`.
- [ ] Investigate DICOM pixel text and metadata as separate concerns.
- [ ] Treat face, license-plate, and general visual-object redaction as a separate vision project;
      Presidio Image Redactor is primarily OCR text plus bounding boxes.

## Release criteria

The public demo is ready when a visitor can:

1. Detect useful pattern/checksum PII immediately without blocking the main thread.
2. Install GLiNER with clear size, progress, integrity, storage, and removal controls.
3. Run GLiNER through WebGPU when proven compatible and fall back safely to WASM.
4. Review findings and export a redacted result.
5. Reload offline and repeat the complete workflow.
6. Inspect the selected backend, timings, storage state, and network behavior.
7. Confirm that their document and findings were never transmitted.
