# Presidio Web Demo

A browser-native demonstration of [`presidio-web`](https://www.npmjs.com/package/presidio-web): detect, review, tokenize, and redact personally identifiable information without sending document text to an application server.

**Live demo:** https://nacmonad.github.io/presidio-web-demo/

## What it demonstrates

- Immediate pattern and checksum detection using the published `presidio-web` npm package
- Optional GLiNER semantic PII detection through ONNX Runtime Web
- All analysis running in a dedicated Web Worker, separate from the UI thread
- WebGPU-first ONNX execution with a WASM fallback
- Browser-local model installation in the Origin Private File System (OPFS)
- Deterministic merging that favors validated Presidio findings over overlapping ML spans
- A local identity-vault prototype that assigns one opaque ID to each distinct normalized value
- Reversible token output such as `{{sv_pn_<uuid>}}`
- A PWA shell for repeat/offline use after the required assets have been cached

The included sample repeats a person and telephone number so ID reuse is visible in the **Local identity vault** panel.

## Privacy and security boundary

Document text is processed locally in the browser worker. It is not submitted to this application, GitHub Pages, Hugging Face, or an analytics service.

Enabling GLiNER downloads public model artifacts from [Knowledgator's `gliner-pii-edge-v1.0`](https://huggingface.co/knowledgator/gliner-pii-edge-v1.0) and stores them in the browser's OPFS. That request downloads only model files; document content is not included.

The identity vault is currently a **demo-only, in-memory index**:

- IDs are random and remain stable for matching normalized values during the current page session.
- Original values are shown locally to make identity reuse inspectable.
- It does not yet encrypt, persist, export, or recover vault records.
- It must not be treated as a production secrets vault.

This project can be a building block in privacy-oriented workflows, but deploying it does **not by itself establish HIPAA or GDPR compliance**. Compliance depends on the complete system, policies, contracts, access controls, retention rules, security review, and organizational practices.

## Analysis flow

```text
source text
    │
    ▼
dedicated Web Worker
    ├── Presidio patterns/checksums
    └── optional GLiNER ONNX inference
              │
              ▼
      deterministic overlap merge
              │
              ▼
   local distinct-value identity index
      ├── findings + occurrence counts
      └── reversible opaque tokens
```

Pattern detection is available immediately. GLiNER is opt-in because its fp32 model is large and requires a one-time browser download and compilation step.

## Using `presidio-web`

Install the package:

```bash
npm install presidio-web
```

Minimal pattern-recognition example:

```ts
import {
  AnalyzerEngine,
  IbanRecognizer,
  PhoneRecognizer,
  RecognizerRegistry,
} from "presidio-web";

const registry = new RecognizerRegistry([
  new IbanRecognizer(),
  new PhoneRecognizer(),
]);

const analyzer = new AnalyzerEngine({ registry });
const findings = analyzer.analyze(
  "Call +1 415-555-2671 or use IBAN DE89370400440532013000",
  "en",
);
```

The demo source shows the fuller browser integration, including a module worker, injected tokenizer and ONNX session, OPFS model storage, backend fallback, and result merging.

## Development

Requirements:

- Node.js 22+
- pnpm 10+
- A modern Chromium, Firefox, or Safari browser; WebGPU availability varies

```bash
pnpm install
pnpm dev
```

Quality gates:

```bash
pnpm lint
pnpm build
```

Test the same static export used by GitHub Pages:

```bash
STATIC_EXPORT=true \
NEXT_PUBLIC_BASE_PATH=/presidio-web-demo \
pnpm build

npx serve out
```

For a root-domain static deployment, leave `NEXT_PUBLIC_BASE_PATH` empty.

## GitHub Pages deployment

`.github/workflows/deploy-pages.yml` runs lint, builds a static Next.js export, uploads `out/`, and deploys it with the official GitHub Pages action whenever `main` changes.

Repository setup, once:

1. Open **Settings → Pages** in the GitHub repository.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` or run the workflow manually from the Actions tab.

GitHub Pages cannot provide custom COOP/COEP response headers. Consequently, the Pages build uses single-threaded WASM when WebGPU is unavailable. Hosts that can set the headers from `next.config.ts` can use multithreaded WASM.

## Project structure

- `src/workers/analyzer.worker.ts` — Presidio, GLiNER, model installation, ONNX execution, and merge pipeline
- `src/lib/demo-vault.ts` — distinct-value normalization and opaque demo identity assignment
- `src/app/page.tsx` — minimal project landing page
- `src/app/docs/page.tsx` — package and architecture documentation
- `src/app/demo/page.tsx` — review, model controls, status UI, redacted output, and vault inspector
- `public/ort/` — self-hosted ONNX Runtime Web WASM binaries
- `public/sw.js` — application-shell caching

## Roadmap

See [`TODO.md`](./TODO.md) for the implementation ledger. Near-term work includes integrity-checked model installation, long-document windowing, cancellation, richer review controls, tests, and a versioned encrypted vault-envelope export.

## Related projects

- [`presidio-web`](https://www.npmjs.com/package/presidio-web)
- [Microsoft Presidio](https://github.com/microsoft/presidio)
- [GLiNER](https://github.com/urchade/GLiNER)
- [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)

`presidio-web` is an independent browser port inspired by Microsoft Presidio. Review the package repository and license before production use.
