import {
  AnalyzerEngine,
  IbanRecognizer,
  PatternRecognizer,
  PhoneRecognizer,
  RecognizerRegistry,
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
const MODEL_FILES = [
  "gliner_config.json",
  "special_tokens_map.json",
  "tokenizer.json",
  "tokenizer_config.json",
  "onnx/model.onnx",
] as const;
const MODEL_BASE = "https://huggingface.co/knowledgator/gliner-pii-edge-v1.0/resolve/main";

type WorkerRequest =
  | { type: "analyze"; text: string }
  | { type: "model-status" }
  | { type: "install-model" }
  | { type: "remove-model" };

async function modelDirectory(create = false) {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(MODEL_DIR, { create });
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
  } catch {
    // Missing or incomplete model is a normal first-run state.
  }
  self.postMessage({
    type: "model-status",
    installed,
    bytes,
    usage: estimate.usage ?? 0,
    quota: estimate.quota ?? 0,
  });
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
    const handle = await target.getFileHandle(`${segments.at(-1)}.partial`, { create: true });
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

    const completed = await target.getFileHandle(segments.at(-1)!, { create: true });
    const completedWritable = await completed.createWritable();
    await completedWritable.write(await (await handle.getFile()).arrayBuffer());
    await completedWritable.close();
    await target.removeEntry(`${segments.at(-1)}.partial`);
  }

  const manifestHandle = await directory.getFileHandle("manifest.json", { create: true });
  const manifestWriter = await manifestHandle.createWritable();
  await manifestWriter.write(JSON.stringify({ version: MODEL_VERSION, bytes: downloaded, installedAt: new Date().toISOString() }));
  await manifestWriter.close();
  await reportModelStatus();
}

async function removeModel() {
  const root = await navigator.storage.getDirectory();
  try { await root.removeEntry(MODEL_DIR, { recursive: true }); } catch { /* already absent */ }
  await reportModelStatus();
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    if (event.data.type === "analyze") {
      const start = performance.now();
      const findings = engine.analyze(event.data.text, "en");
      self.postMessage({ type: "result", findings, elapsedMs: performance.now() - start });
    } else if (event.data.type === "model-status") {
      await reportModelStatus();
    } else if (event.data.type === "install-model") {
      await installModel();
    } else if (event.data.type === "remove-model") {
      await removeModel();
    }
  } catch (error) {
    self.postMessage({ type: "model-error", message: error instanceof Error ? error.message : String(error) });
  }
};

self.postMessage({ type: "ready", webGpu: "gpu" in navigator });
