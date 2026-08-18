"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { DemoVaultEntry, indexFindings, shortVaultId } from "../../lib/demo-vault";

type Finding = {
  entityType: string;
  start: number;
  end: number;
  score: number;
  analysisExplanation?: { recognizer?: string };
  vaultId?: string;
};

type ModelState = {
  installed: boolean;
  bytes: number;
  usage: number;
  quota: number;
  persistent: boolean;
  runtimeReady: boolean;
  backend: string;
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(bytes > 100 * 1024 * 1024 ? 0 : 1)} MB`;
};
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const SAMPLE = `Patient Sarah Connor called from +1 415-555-2671.
Her bank transfer used IBAN DE89370400440532013000.
Sarah Connor confirmed the same callback number: +1 415-555-2671.
Backup card: 4111 1111 1111 1111. Email: sarah.connor@example.com.`;

export default function Home() {
  const worker = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const analyzedText = useRef(SAMPLE);
  const vaultIdentities = useRef(new Map<string, DemoVaultEntry>());
  const [text, setText] = useState(SAMPLE);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [webGpu, setWebGpu] = useState(false);
  const [model, setModel] = useState<ModelState>({ installed: false, bytes: 0, usage: 0, quota: 0, persistent: false, runtimeReady: false, backend: "" });
  const [useGliner, setUseGliner] = useState(false);
  const [inference, setInference] = useState({ phase: "idle", message: "Pattern engine ready", backend: "" });
  const [counts, setCounts] = useState({ patterns: 0, gliner: 0 });
  const [vaultEntries, setVaultEntries] = useState<DemoVaultEntry[]>([]);
  const [modelProgress, setModelProgress] = useState<{ downloaded: number; total: number; file: string } | null>(null);
  const [modelError, setModelError] = useState("");

  useEffect(() => {
    const instance = new Worker(new URL("../../workers/analyzer.worker.ts", import.meta.url), {
      type: "module",
    });
    instance.onmessage = (event) => {
      if (event.data.type === "ready") {
        setWorkerReady(true);
        setWebGpu(event.data.webGpu);
        instance.postMessage({ type: "model-status" });
      }
      if (event.data.type === "result") {
        if (event.data.requestId !== requestId.current) return;
        const indexed = indexFindings(analyzedText.current, event.data.findings, vaultIdentities.current);
        setFindings(indexed.findings);
        setVaultEntries(indexed.entries);
        setElapsed(event.data.elapsedMs);
        setCounts({ patterns: event.data.patternCount, gliner: event.data.glinerCount });
        setBusy(false);
      }
      if (event.data.type === "model-status") {
        navigator.storage.persisted().then((persistent) => setModel({ ...event.data, persistent }));
        setModelProgress(null);
      }
      if (event.data.type === "model-progress") setModelProgress(event.data);
      if (event.data.type === "inference-status") setInference(event.data);
      if (event.data.type === "model-error") {
        setModelError(event.data.message);
        setModelProgress(null);
        setBusy(false);
      }
    };
    worker.current = instance;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).then(() => setOfflineReady(true)).catch(() => {});
    }
    return () => instance.terminate();
  }, []);

  useEffect(() => {
    if (inference.phase !== "complete") return;
    const timeout = window.setTimeout(() => {
      setInference({
        phase: model.runtimeReady ? "ready" : "idle",
        message: model.runtimeReady ? `GLiNER ready on ${model.backend || inference.backend}` : "Pattern engine ready",
        backend: model.backend || inference.backend,
      });
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [inference.phase, inference.backend, model.runtimeReady, model.backend]);

  const analyze = () => {
    if (!worker.current || !workerReady) return;
    setBusy(true);
    const nextRequest = ++requestId.current;
    analyzedText.current = text;
    worker.current.postMessage({ type: "analyze", text, useGliner, requestId: nextRequest });
  };

  const scanLabel = !busy
    ? "Scan locally"
    : inference.phase === "loading"
      ? "Preparing GLiNER…"
      : inference.phase === "finalizing"
        ? "Finalizing findings…"
        : "Running local detection…";

  const installModel = async () => {
    setModelError("");
    await navigator.storage.persist();
    worker.current?.postMessage({ type: "install-model" });
  };

  const redacted = useMemo(() => {
    let output = text;
    for (const item of [...findings].sort((a, b) => b.start - a.start)) {
      const token = item.vaultId ? `{{${item.vaultId}}}` : `[${item.entityType}]`;
      output = `${output.slice(0, item.start)}${token}${output.slice(item.end)}`;
    }
    return output;
  }, [text, findings]);

  return (
    <main>
      <header className="hero">
        <div>
          <div className="demo-brand"><BrandMark size={34} /><span>Presidio Web</span></div>
          <p className="eyebrow">PRESIDIO, RIGHT IN YOUR BROWSER</p>
          <h1>Find sensitive data<br />before it leaves your browser.</h1>
          <p className="lede">A browser-native, mechanically verified port of Microsoft Presidio. Your document stays on this device.</p>
        </div>
        <div className="privacy-card">
          <span className="pulse" />
          <strong>Local processing</strong>
          <p>No document text is sent to a server.</p>
        </div>
      </header>

      <section className="statusbar" aria-label="Runtime status" aria-live="polite">
        <span><i className={workerReady ? "ok" : ""} /> Analysis worker</span>
        <span><i className={offlineReady ? "ok" : ""} /> Offline shell</span>
        <span><i className={webGpu ? "ok" : "warn"} /> {webGpu ? "WebGPU available" : "WASM fallback"}</span>
        <span className={`ml-status ${busy || inference.phase === "loading" ? "active" : ""}`}><i className={inference.phase === "error" ? "error" : model.runtimeReady ? "ok" : model.installed ? "warn" : ""} /> GLiNER · {busy && useGliner ? "working" : model.runtimeReady ? `ready · ${model.backend || inference.backend}` : model.installed ? "stored offline" : "not installed"}</span>
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
        <label className={`model-toggle ${!model.installed ? "disabled" : ""}`}>
          <span><strong>Use GLiNER enhanced detection</strong><small>{model.installed ? inference.message : "Install the model to enable semantic detection"}</small></span>
          <input type="checkbox" checked={useGliner} disabled={!model.installed || busy} onChange={(event) => setUseGliner(event.target.checked)} />
          <i aria-hidden="true" />
        </label>
      </section>

      <section className="workspace">
        <article className="panel input-panel">
          <div className="panel-head"><div><small>01</small><h2>Source text</h2></div><span>{text.length.toLocaleString()} chars</span></div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="Text to analyze" />
          <div className="actions">
            <button className={`primary scan-button ${busy ? "busy" : ""}`} onClick={analyze} disabled={!workerReady || busy} aria-busy={busy}>
              {busy && <span className="spinner" aria-hidden="true" />}{scanLabel}
            </button>
            <button onClick={() => { setText(SAMPLE); setFindings([]); setVaultEntries([]); }}>Load sample</button>
            <label className="file-button">Open file<input type="file" accept=".txt,.md,.json,.csv,text/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { setText(await file.text()); setFindings([]); setVaultEntries([]); } }} /></label>
          </div>
        </article>

        <article className="panel findings-panel" aria-busy={busy}>
          <div className="panel-head"><div><small>02</small><h2>Findings</h2></div><span>{findings.length} detected{findings.length > 0 && ` · ${counts.patterns} rules + ${counts.gliner} ML`}</span></div>
          {busy && <div className="inference-progress" aria-hidden="true"><span /></div>}
          <div className={`finding-list ${busy && findings.length ? "updating" : ""}`}>
            {busy && findings.length > 0 && <div className="updating-label"><span className="spinner" aria-hidden="true" />Updating locally…</div>}
            {findings.length === 0 ? <p className="empty" role="status" aria-live="polite">{busy ? (useGliner ? "GLiNER is analyzing this text locally…" : "Analyzing this text locally…") : "Run a scan to inspect locally detected PII."}</p> : findings.map((item, index) => (
              <div className="finding" key={`${item.start}-${item.end}-${index}`}>
                <div><strong>{item.entityType.replaceAll("_", " ")}</strong><code>{text.slice(item.start, item.end)}</code>{item.vaultId && <span className="vault-ref">{shortVaultId(item.vaultId)}</span>}</div>
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

        <article className="panel vault-panel">
          <div className="panel-head"><div><small>04</small><h2>Local identity vault</h2></div><span>{vaultEntries.length} distinct values</span></div>
          <div className="vault-list">
            {vaultEntries.length === 0 ? <p className="empty">Run a scan to assign stable, reusable demo identities.</p> : vaultEntries.map((entry) => (
              <div className="vault-entry" key={entry.id}>
                <div><strong>{entry.entityType.replaceAll("_", " ")}</strong><code>{entry.originalValue}</code></div>
                <div><span>{shortVaultId(entry.id)}</span><small>{entry.occurrences} occurrence{entry.occurrences === 1 ? "" : "s"}</small></div>
              </div>
            ))}
          </div>
          <p className="vault-note">Demo-only in-memory index. IDs are random and reused for exact normalized values during this browser session.</p>
        </article>
      </section>

      <footer><strong>presidio-web</strong><span>Hybrid Presidio + GLiNER analysis runs entirely inside a dedicated browser worker.</span></footer>
    </main>
  );
}
