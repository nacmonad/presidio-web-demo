"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Finding = {
  entityType: string;
  start: number;
  end: number;
  score: number;
  analysisExplanation?: { recognizer?: string };
};

type ModelState = {
  installed: boolean;
  bytes: number;
  usage: number;
  quota: number;
  persistent: boolean;
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(bytes > 100 * 1024 * 1024 ? 0 : 1)} MB`;
};

const SAMPLE = `Patient Sarah Connor called from +1 415-555-2671.
Her bank transfer used IBAN DE89370400440532013000.
Backup card: 4111 1111 1111 1111. Email: sarah.connor@example.com.`;

export default function Home() {
  const worker = useRef<Worker | null>(null);
  const [text, setText] = useState(SAMPLE);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [webGpu, setWebGpu] = useState(false);
  const [model, setModel] = useState<ModelState>({ installed: false, bytes: 0, usage: 0, quota: 0, persistent: false });
  const [modelProgress, setModelProgress] = useState<{ downloaded: number; total: number; file: string } | null>(null);
  const [modelError, setModelError] = useState("");

  useEffect(() => {
    const instance = new Worker(new URL("../workers/analyzer.worker.ts", import.meta.url), {
      type: "module",
    });
    instance.onmessage = (event) => {
      if (event.data.type === "ready") {
        setWorkerReady(true);
        setWebGpu(event.data.webGpu);
        instance.postMessage({ type: "model-status" });
      }
      if (event.data.type === "result") {
        setFindings(event.data.findings);
        setElapsed(event.data.elapsedMs);
        setBusy(false);
      }
      if (event.data.type === "model-status") {
        navigator.storage.persisted().then((persistent) => setModel({ ...event.data, persistent }));
        setModelProgress(null);
      }
      if (event.data.type === "model-progress") setModelProgress(event.data);
      if (event.data.type === "model-error") {
        setModelError(event.data.message);
        setModelProgress(null);
      }
    };
    worker.current = instance;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => setOfflineReady(true)).catch(() => {});
    }
    return () => instance.terminate();
  }, []);

  const analyze = () => {
    if (!worker.current || !workerReady) return;
    setBusy(true);
    worker.current.postMessage({ type: "analyze", text });
  };

  const installModel = async () => {
    setModelError("");
    await navigator.storage.persist();
    worker.current?.postMessage({ type: "install-model" });
  };

  const redacted = useMemo(() => {
    let output = text;
    for (const item of [...findings].sort((a, b) => b.start - a.start)) {
      output = `${output.slice(0, item.start)}[${item.entityType}]${output.slice(item.end)}`;
    }
    return output;
  }, [text, findings]);

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">PRESIDIO, WITHOUT THE SERVER</p>
          <h1>Find sensitive data<br />before it leaves your browser.</h1>
          <p className="lede">A browser-native, mechanically verified port of Microsoft Presidio. Your document stays on this device.</p>
        </div>
        <div className="privacy-card">
          <span className="pulse" />
          <strong>Local processing</strong>
          <p>No document text is sent to a server.</p>
        </div>
      </header>

      <section className="statusbar" aria-label="Runtime status">
        <span><i className={workerReady ? "ok" : ""} /> Analysis worker</span>
        <span><i className={offlineReady ? "ok" : ""} /> Offline shell</span>
        <span><i className={webGpu ? "ok" : "warn"} /> {webGpu ? "WebGPU available" : "WASM fallback"}</span>
        <span className="ml-status">GLiNER · {model.installed ? "stored offline" : "not installed"}</span>
      </section>

      <section className="model-card">
        <div className="model-copy">
          <p className="eyebrow">OPTIONAL ENHANCED DETECTION</p>
          <h2>GLiNER language model</h2>
          <p>The fp32 model is stored privately in this browser&apos;s OPFS. Install it once, then use it offline without uploading text.</p>
        </div>
        <div className="storage-grid">
          <div><small>MODEL</small><strong>{model.installed ? formatBytes(model.bytes) : "~180 MB"}</strong><span>{model.installed ? "Ready offline" : "Not installed"}</span></div>
          <div><small>OPFS USAGE</small><strong>{formatBytes(model.usage)}</strong><span>of {formatBytes(model.quota)} available</span></div>
          <div><small>PERSISTENCE</small><strong>{model.persistent ? "Granted" : "Best effort"}</strong><span>{model.persistent ? "Protected from routine eviction" : "Browser may evict storage"}</span></div>
        </div>
        {modelProgress && <div className="progress-wrap"><div className="progress-label"><span>Downloading {modelProgress.file}</span><span>{formatBytes(modelProgress.downloaded)}{modelProgress.total ? ` / ${formatBytes(modelProgress.total)}` : ""}</span></div><progress value={modelProgress.downloaded} max={modelProgress.total || undefined} /></div>}
        {modelError && <p className="model-error">{modelError}</p>}
        <div className="model-actions">
          {!model.installed && <button className="primary" onClick={installModel} disabled={!!modelProgress}>Install model for offline use</button>}
          {model.installed && <button onClick={() => worker.current?.postMessage({ type: "remove-model" })}>Remove downloaded model</button>}
          <span>Stored only for this origin · removable at any time</span>
        </div>
      </section>

      <section className="workspace">
        <article className="panel input-panel">
          <div className="panel-head"><div><small>01</small><h2>Source text</h2></div><span>{text.length.toLocaleString()} chars</span></div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="Text to analyze" />
          <div className="actions">
            <button className="primary" onClick={analyze} disabled={!workerReady || busy}>{busy ? "Scanning…" : "Scan locally"}</button>
            <button onClick={() => { setText(SAMPLE); setFindings([]); }}>Load sample</button>
            <label className="file-button">Open file<input type="file" accept=".txt,.md,.json,.csv,text/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { setText(await file.text()); setFindings([]); } }} /></label>
          </div>
        </article>

        <article className="panel findings-panel">
          <div className="panel-head"><div><small>02</small><h2>Findings</h2></div><span>{findings.length} detected</span></div>
          <div className="finding-list">
            {findings.length === 0 ? <p className="empty">Run a scan to inspect locally detected PII.</p> : findings.map((item, index) => (
              <div className="finding" key={`${item.start}-${item.end}-${index}`}>
                <div><strong>{item.entityType.replaceAll("_", " ")}</strong><code>{text.slice(item.start, item.end)}</code></div>
                <div className="score">{Math.round(item.score * 100)}%<small>{item.analysisExplanation?.recognizer ?? "Presidio"}</small></div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel output-panel">
          <div className="panel-head"><div><small>03</small><h2>Redacted output</h2></div>{elapsed !== null && <span>{elapsed.toFixed(1)} ms</span>}</div>
          <pre>{redacted}</pre>
          <div className="actions"><button onClick={() => navigator.clipboard.writeText(redacted)} disabled={!findings.length}>Copy redacted text</button></div>
        </article>
      </section>

      <footer><strong>presidio-web</strong><span>Pattern detection runs now. OPFS model installation is ready; GLiNER inference wiring comes next.</span></footer>
    </main>
  );
}
