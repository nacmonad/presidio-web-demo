# Brand Messaging

## 01 — Core Message

Presidio Web helps engineers and end users prepare confidential information for application and LLM workflows by making Presidio-style detection and redaction directly accessible in the browser.

## 02 — Value Proposition

Presidio Web brings the familiar Microsoft Presidio approach to the browser without requiring users to install Python or operate a local analysis service. The browser application makes private PII review approachable for end users, while the npm package gives engineers a practical foundation for local-first privacy workflows.

## 03 — Tagline Options

### Recommended: Presidio, right in your browser.

- **Style**: Functional and memorable
- **Rationale**: It establishes the reference category immediately and expresses the accessibility advantage without incorrectly implying that Microsoft Presidio cannot run locally.

### Sensitive data stays local.

- **Style**: Benefit-led
- **Rationale**: Clear to both engineers and regular users, with privacy as the immediate takeaway.

### Presidio. Open and use.

- **Style**: Direct and approachable
- **Rationale**: Emphasizes the removal of setup and operational friction.

### Detect locally. Build privately.

- **Style**: Rhythmic and empowering
- **Rationale**: Connects the package capability to the applications and workflows it enables.

### PII detection, kept close.

- **Style**: Calm and human
- **Rationale**: Expresses local control without sounding alarmist or infrastructure-heavy.

### Existing line: Private PII detection, entirely in your browser.

- **Style**: Functional
- **Evaluation**: Accurate and clear as a supporting description, but too long and generic to be the most distinctive tagline.

## 04 — Messaging Hierarchy

### Level 1 — Brand Headline

Presidio, right in your browser.

### Level 2 — Supporting Statement

Detect and redact sensitive information with a browser-native port of Microsoft Presidio—no Python installation or local analysis service required.

### Level 3 — Key Messages

#### Sensitive text stays on the device

Run document analysis inside the browser instead of sending source text to a separate PII service. Give teams a clearer, smaller privacy boundary for confidential workflows.

- **Proof**: Analysis runs in a dedicated browser Web Worker, and document contents are not submitted to the demo host or model provider.

#### Presidio capability, native to JavaScript

Use familiar Presidio-style detection from an npm package designed for web applications. Start with immediate pattern and checksum recognition, then add semantic detection where needed.

- **Proof**: The package provides Presidio analyzers and recognizers, with optional GLiNER inference through ONNX Runtime Web.

#### Open it and get to work

Use the browser application without installing Python, configuring Presidio, or operating a document-processing backend. Engineers can also embed the same capability through the npm package.

- **Proof**: The demo includes a PWA shell, browser-local model storage in OPFS, WebGPU-first execution, and a WASM fallback.

#### Built to be inspected

Evaluate the architecture, runtime behavior, storage, and limitations before adopting it. Privacy claims should be supported by visible technical boundaries.

- **Proof**: The npm package, demo source, documentation, worker pipeline, and implementation roadmap are public.

### Level 4 — Proof Bank

- Near one-to-one browser port of Microsoft Presidio.
- Published as the `presidio-web` npm package.
- Pattern and checksum detection runs immediately in the browser.
- Optional GLiNER semantic detection runs through ONNX Runtime Web.
- Analysis is isolated from the UI in a dedicated Web Worker.
- Model artifacts can be stored in browser OPFS.
- WebGPU-first execution with a WASM fallback.
- No document-derived analytics are required.

## 05 — Audience-Specific Messaging

### Privacy and Security Engineers

- **What they care most about**: Data boundaries, architecture, self-hosting, auditability, integration effort, and honest limitations.
- **Lead with**: Give teams Presidio-style analysis in the browser without making them install Python or operate a separate service.
- **Strongest proof**: Worker isolation, inspectable source, explicit network behavior, npm integration, local model storage, and backend diagnostics.
- **Avoid**: Unqualified security, privacy, accuracy, or compliance promises.

### Application Engineers

- **What they care most about**: JavaScript ergonomics, integration speed, runtime compatibility, performance, and predictable output.
- **Lead with**: Add PII detection and redaction to a web workflow through an npm package.
- **Strongest proof**: Presidio-style API, Web Worker architecture, deterministic result merging, WebGPU/WASM fallback, and example code.
- **Avoid**: Leading with policy language before showing the developer experience.

### Regular and Domain Users

- **What they care most about**: Whether their files are uploaded, whether the tool is understandable, and whether they can review the result before continuing.
- **Lead with**: Open the application and find sensitive information on this device before using a document elsewhere—no specialist setup required.
- **Strongest proof**: Plain-language privacy status, visible findings, local redacted output, and an offline-readiness indicator.
- **Avoid**: Acronyms, model implementation details, or implying the tool makes every downstream AI service safe.

## 06 — Messaging by Channel

| Channel | Headline approach | Tone | Length |
|---|---|---|---|
| Demo homepage | Architectural difference plus immediate outcome | Calm, direct | Short |
| GitHub README | Capability, boundary, architecture, limitations | Technical, transparent | Medium |
| npm description | Package function and browser-native distinction | Precise | Very short |
| Documentation | Integration first, then privacy model and proof | Clear, technical | Detailed |
| Release post | New capability plus concrete developer use case | Confident, factual | Short |

## 07 — Things Not to Say

- Do not claim files **never leave your computer** unless describing Presidio Web itself; downstream workflows may transmit them.
- Do not say **100% private**, **completely secure**, or **compliance-ready**.
- Do not claim exact parity with Microsoft Presidio until automated parity evidence supports it.
- Avoid fear-led language such as **your AI is leaking everything**.
- Avoid generic claims such as **enterprise-grade**, **revolutionary**, or **AI-powered privacy**.
- Do not describe downloaded model artifacts as document uploads.
- Keep **offline-capable** qualified by the requirement that application and model assets have first been cached or installed.
