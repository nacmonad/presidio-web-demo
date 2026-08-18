# Brand Positioning

## 01 — Category Definition

- **Stated category**: Browser-native PII detection and redaction tooling.
- **Actual category**: Privacy infrastructure used to prepare confidential information for internal applications and LLM workflows.
- **Opportunity category**: Zero-setup Presidio for the web.
- **Recommendation**: Lead with the recognizable Presidio reference, then distinguish Presidio Web through browser-native access, no Python service, offline use, and a dramatically lower operational barrier.

## 02 — Competitive Landscape

The useful landscape is defined by two axes:

- **User access**: Developer-operated service ← → Direct browser application
- **Operational complexity**: Python and infrastructure setup ← → Open and use

### Alternatives

- **Microsoft Presidio**: Local or self-hosted and highly capable, but generally requires Python, technical configuration, and application integration.
- **Cloud PII APIs**: Easy to call, but document content crosses a network and processing depends on an external service.
- **Enterprise DLP platforms**: Broad governance and policy coverage, but heavier to procure, configure, and embed into focused workflows.
- **Internal regex pipelines**: Local and controllable, but narrow, labor-intensive, and difficult to evolve into broad entity detection.
- **Presidio Web**: Browser-native and approachable, with near-parity to the Presidio model, no local Python service, and optional semantic detection.

The most ownable territory is the combination of Presidio familiarity, direct browser access, and minimal setup for both developers and end users.

## 03 — Positioning Territory

- **The Space**: Presidio made accessible in the browser.
- **The Audience Owned**: Privacy and security engineers who need to add PII detection and redaction to confidential internal or LLM workflows without creating another document-processing service.
- **The Competitive Moat**: Presidio Web is a near one-to-one browser port of an established PII framework rather than a thin collection of regular expressions. Its browser application removes Python installation and service operation for end users, while the npm package gives engineers an approachable foundation for local-first workflows.

## 04 — Positioning Statements

### Primary

For privacy and security engineers and the people they support, Presidio Web is approachable browser-native PII infrastructure that brings the Microsoft Presidio model into an offline-capable web package without requiring a local Python service.

### Strategic

Presidio Web aims to become the standard browser-native implementation of Presidio and a trusted foundation for local-first privacy workflows.

### Public-facing

Open Presidio in the browser and prepare sensitive text for AI workflows without installing or operating a Python service.

## 05 — Positioning Proof Points

1. Document analysis runs inside a dedicated browser Web Worker.
2. The core package provides Presidio-style pattern and checksum detection directly in JavaScript.
3. Optional GLiNER inference adds semantic detection through ONNX Runtime Web.
4. Model artifacts can be stored locally in browser OPFS for repeat and offline use.
5. The project is distributed as an inspectable npm package and public GitHub repository.
6. No document contents, findings, corrections, or document-derived analytics need to leave the browser.

## 06 — What This Brand Refuses to Be

- Presidio Web is not a hosted document-processing service.
- Presidio Web does not use vague compliance claims as a substitute for technical evidence.
- Presidio Web is not merely a branded regex demo.
- Presidio Web does not hide its runtime, storage, network behavior, or current limitations.
- Presidio Web does not position itself as a complete replacement for an organization's security and compliance program.

## 07 — Positioning in One Sentence

Presidio Web makes Presidio-style PII detection accessible in the browser, without Python setup, for local-first application and AI workflows.

## Positioning Guardrails

- Say **browser-local**, **self-hosted**, or **runs on your device** instead of making an absolute claim that every surrounding workflow is private.
- Say **near one-to-one browser port** rather than claiming perfect parity until parity is continuously tested and documented.
- Present offline use as a capability that depends on the required application and model assets being installed or cached.
- Never imply that using Presidio Web alone establishes HIPAA, GDPR, or other regulatory compliance.
