# presidio-web-demo

Browser demonstration for the published [`presidio-web`](https://www.npmjs.com/package/presidio-web) package.

## Architecture

- Next.js application shell and review UI
- Dedicated module worker owns the Presidio analyzer
- Service worker provides offline application caching only
- Cross-origin isolation enables threaded WASM
- GLiNER will run in the analysis worker with WebGPU-first, WASM fallback
- Large model artifacts will be versioned and verified in OPFS

No document contents are sent to the server.

## Development

```bash
pnpm dev
pnpm lint
pnpm build
```
