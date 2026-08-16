import Link from "next/link";

export default function Documentation() {
  return (
    <main className="docs-page">
      <nav className="docs-nav"><Link href="/">Presidio Web</Link><Link href="/demo/">Open demo →</Link></nav>
      <header>
        <p className="eyebrow">DOCUMENTATION</p>
        <h1>Browser-native PII detection.</h1>
        <p className="lede">Use the published <code>presidio-web</code> package for local pattern and checksum detection, then optionally add GLiNER ONNX inference for semantic entities.</p>
      </header>

      <section>
        <h2>Install</h2>
        <pre><code>npm install presidio-web</code></pre>
      </section>

      <section>
        <h2>Basic analysis</h2>
        <pre><code>{`import {
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
);`}</code></pre>
      </section>

      <section>
        <h2>What the demo adds</h2>
        <ul>
          <li>A dedicated Web Worker so analysis does not block the UI thread</li>
          <li>Optional GLiNER inference with WebGPU-first and WASM fallback</li>
          <li>Browser-local model storage in OPFS</li>
          <li>Deterministic merging of Presidio and ML findings</li>
          <li>Opaque identities reused for distinct normalized values</li>
        </ul>
      </section>

      <section>
        <h2>Privacy boundary</h2>
        <p>Document text remains inside the browser. Enabling GLiNER downloads public model artifacts, but no document content is included in that request.</p>
        <p>The identity vault is an in-memory demonstration. It is not yet encrypted or persistent, and this demo alone does not establish HIPAA or GDPR compliance.</p>
      </section>

      <section>
        <h2>Source and further reading</h2>
        <p><a href="https://github.com/nacmonad/presidio-web-demo">Demo source on GitHub</a></p>
        <p><a href="https://www.npmjs.com/package/presidio-web">presidio-web on npm</a></p>
      </section>
    </main>
  );
}
