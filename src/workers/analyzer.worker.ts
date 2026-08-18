import { PreTrainedTokenizer } from "@huggingface/transformers";
import * as ort from "onnxruntime-web";
import {
  AnalyzerEngine,
  Gliner,
  IbanRecognizer,
  PatternRecognizer,
  PhoneRecognizer,
  RecognizerRegistry,
  type OnnxSession,
} from "presidio-web";

const recognizers = [
  new IbanRecognizer(),
  new PhoneRecognizer(),
  new PatternRecognizer({
    name: "CreditCardRecognizer",
    supportedEntity: "CREDIT_CARD",
    context: ["card", "credit", "payment"],
    patterns: [{ name: "card number", regex: "\\b(?:\\d[ -]*?){13,16}\\b", score: 0.3 }],
  }),
  new PatternRecognizer({
    name: "EmailRecognizerDemo",
    supportedEntity: "EMAIL_ADDRESS",
    patterns: [{ name: "email", regex: "\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b", score: 0.85 }],
  }),
];

const engine = new AnalyzerEngine({ registry: new RecognizerRegistry(recognizers) });
const MODEL_DIR = "gliner-pii-edge-v1.0";
const MODEL_VERSION = "fp32-v1";
const MODEL_FILES = ["gliner_config.json", "special_tokens_map.json", "tokenizer.json", "tokenizer_config.json", "onnx/model.onnx"] as const;
const MODEL_BASE = "https://huggingface.co/knowledgator/gliner-pii-edge-v1.0/resolve/main";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ORT_VERSION = "1.27.0";
const ORT_WASM_PATH = new URL(`${BASE_PATH}/ort/${ORT_VERSION}/`, self.location.origin).href;
const GLINER_LABELS = ["person", "organization", "location", "address", "date of birth", "medical record number", "username", "passport number", "social security number"];
const LABEL_MAP: Record<string, string> = {
  person: "PERSON", organization: "ORGANIZATION", location: "LOCATION", address: "ADDRESS",
  "date of birth": "DATE_OF_BIRTH", "medical record number": "MEDICAL_RECORD_NUMBER",
  username: "USERNAME", "passport number": "PASSPORT_NUMBER", "social security number": "US_SSN",
};

type Finding = { entityType: string; start: number; end: number; score: number; analysisExplanation?: { recognizer?: string } };
type WorkerRequest =
  | { type: "analyze"; text: string; useGliner: boolean; requestId: number }
  | { type: "model-status" }
  | { type: "install-model" }
  | { type: "remove-model" };

let gliner: Gliner | null = null;
let backend = "";
let loading: Promise<void> | null = null;

async function modelDirectory(create = false) {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(MODEL_DIR, { create });
}

async function readModelFile(path: string) {
  const segments = path.split("/");
  let directory = await modelDirectory();
  for (const segment of segments.slice(0, -1)) directory = await directory.getDirectoryHandle(segment);
  return (await directory.getFileHandle(segments.at(-1)!)).getFile();
}

async function reportModelStatus() {
  const estimate = await navigator.storage.estimate();
  let installed = false;
  let bytes = 0;
  try {
    const directory = await modelDirectory();
    const manifest = await directory.getFileHandle("manifest.json");
    const data = JSON.parse(await (await manifest.getFile()).text()) as { version: string; bytes: number };
    installed = data.version === MODEL_VERSION;
    bytes = data.bytes;
  } catch { /* Missing model is a normal first-run state. */ }
  self.postMessage({ type: "model-status", installed, bytes, usage: estimate.usage ?? 0, quota: estimate.quota ?? 0, runtimeReady: !!gliner, backend });
}

async function installModel() {
  const directory = await modelDirectory(true);
  let downloaded = 0;
  let total = 0;
  for (const path of MODEL_FILES) {
    const response = await fetch(`${MODEL_BASE}/${path}`);
    if (!response.ok || !response.body) throw new Error(`Could not download ${path}`);
    total += Number(response.headers.get("content-length") ?? 0);
    const segments = path.split("/");
    let target = directory;
    for (const segment of segments.slice(0, -1)) target = await target.getDirectoryHandle(segment, { create: true });
    const filename = segments.at(-1)!;
    const handle = await target.getFileHandle(`${filename}.partial`, { create: true });
    const writable = await handle.createWritable();
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);
      downloaded += value.byteLength;
      self.postMessage({ type: "model-progress", downloaded, total, file: path });
    }
    await writable.close();
    const completed = await target.getFileHandle(filename, { create: true });
    const completedWritable = await completed.createWritable();
    await completedWritable.write(await (await handle.getFile()).arrayBuffer());
    await completedWritable.close();
    await target.removeEntry(`${filename}.partial`);
  }
  const manifestHandle = await directory.getFileHandle("manifest.json", { create: true });
  const manifestWriter = await manifestHandle.createWritable();
  await manifestWriter.write(JSON.stringify({ version: MODEL_VERSION, bytes: downloaded, installedAt: new Date().toISOString() }));
  await manifestWriter.close();
  await reportModelStatus();
}

async function removeModel() {
  gliner = null;
  backend = "";
  const root = await navigator.storage.getDirectory();
  try { await root.removeEntry(MODEL_DIR, { recursive: true }); } catch { /* already absent */ }
  await reportModelStatus();
}

async function loadGliner() {
  if (gliner) return;
  if (loading) return loading;
  loading = (async () => {
    self.postMessage({ type: "inference-status", phase: "loading", message: "Loading tokenizer and ONNX model…" });
    const [tokenizerFile, configFile, modelFile] = await Promise.all([
      readModelFile("tokenizer.json"), readModelFile("tokenizer_config.json"), readModelFile("onnx/model.onnx"),
    ]);
    const tokenizer = new PreTrainedTokenizer(JSON.parse(await tokenizerFile.text()), JSON.parse(await configFile.text()));
    const modelBytes = new Uint8Array(await modelFile.arrayBuffer());
    // ONNX Runtime requires overrides to be absolute. Keeping the package version in the
    // public path also prevents an older service-worker-cached binary from being paired with
    // the current JavaScript bundle.
    ort.env.wasm.wasmPaths = ORT_WASM_PATH;
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1)) : 1;
    let session: ort.InferenceSession;
    try {
      session = await ort.InferenceSession.create(modelBytes, { executionProviders: ["webgpu"] });
      backend = "WebGPU";
    } catch (webGpuError) {
      self.postMessage({ type: "inference-status", phase: "loading", message: "WebGPU unavailable; compiling WASM fallback…" });
      session = await ort.InferenceSession.create(modelBytes, { executionProviders: ["wasm"] });
      backend = "WASM";
      console.info("GLiNER WebGPU fallback", webGpuError);
    }
    const encode = (value: string) => tokenizer(value, { add_special_tokens: false, return_tensor: false }).input_ids as number[];
    gliner = new Gliner(session as unknown as OnnxSession, encode, (type, data, dims) => new ort.Tensor(type, data, dims));
    self.postMessage({ type: "inference-status", phase: "ready", message: `GLiNER ready on ${backend}`, backend });
  })().finally(() => { loading = null; });
  return loading;
}

function mergeFindings(patterns: Finding[], semantic: Finding[]) {
  const deterministic = [...patterns].sort((a, b) => a.start - b.start || b.score - a.score);
  const accepted = [...deterministic];
  for (const candidate of [...semantic].sort((a, b) => b.score - a.score)) {
    const overlaps = deterministic.some((item) => candidate.start < item.end && candidate.end > item.start);
    if (!overlaps && !accepted.some((item) => candidate.start < item.end && candidate.end > item.start)) accepted.push(candidate);
  }
  return accepted.sort((a, b) => a.start - b.start || a.end - b.end);
}

async function analyze(text: string, useGliner: boolean, requestId: number) {
  const started = performance.now();
  self.postMessage({ type: "inference-status", phase: "scanning", message: useGliner ? "Running Presidio + GLiNER…" : "Running Presidio patterns…" });
  const patterns = engine.analyze(text, "en") as Finding[];
  let semantic: Finding[] = [];
  if (useGliner) {
    await loadGliner();
    const entities = await gliner!.detect(text, GLINER_LABELS, { threshold: 0.5 });
    semantic = entities.map((item) => ({ entityType: LABEL_MAP[item.label] ?? item.label.toUpperCase().replaceAll(" ", "_"), start: item.start, end: item.end, score: item.score, analysisExplanation: { recognizer: "GLiNER" } }));
  }
  self.postMessage({ type: "result", requestId, findings: mergeFindings(patterns, semantic), patternCount: patterns.length, glinerCount: semantic.length, elapsedMs: performance.now() - started, backend });
  self.postMessage({ type: "inference-status", phase: gliner ? "ready" : "idle", message: gliner ? `GLiNER ready on ${backend}` : "Pattern engine ready", backend });
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    if (event.data.type === "analyze") await analyze(event.data.text, event.data.useGliner, event.data.requestId);
    else if (event.data.type === "model-status") await reportModelStatus();
    else if (event.data.type === "install-model") await installModel();
    else if (event.data.type === "remove-model") await removeModel();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({ type: "model-error", message });
    self.postMessage({ type: "inference-status", phase: "error", message: `GLiNER failed: ${message}`, backend });
  }
};

self.postMessage({ type: "ready", webGpu: "gpu" in navigator });
