export type VaultFinding = {
  entityType: string;
  start: number;
  end: number;
  score: number;
  analysisExplanation?: { recognizer?: string };
  vaultId?: string;
};

export type DemoVaultEntry = {
  id: string;
  entityType: string;
  normalizedValue: string;
  originalValue: string;
  occurrences: number;
};

const compact = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ");

export function normalizeEntityValue(entityType: string, value: string) {
  const normalized = compact(value);
  if (entityType === "PHONE_NUMBER") {
    const hasPlus = normalized.startsWith("+");
    const digits = normalized.replace(/\D/g, "");
    return `${hasPlus ? "+" : ""}${digits}`;
  }
  if (entityType === "EMAIL_ADDRESS") {
    const at = normalized.lastIndexOf("@");
    return at < 0 ? normalized : `${normalized.slice(0, at)}@${normalized.slice(at + 1).toLowerCase()}`;
  }
  return normalized;
}

function prefixFor(entityType: string) {
  return entityType.split("_").map((part) => part[0]).join("").slice(0, 4).toLowerCase() || "pii";
}

export function indexFindings(
  text: string,
  findings: VaultFinding[],
  identities: Map<string, DemoVaultEntry>,
  createId: () => string = () => crypto.randomUUID(),
) {
  const occurrenceCounts = new Map<string, number>();
  const indexed = findings.map((finding) => {
    const originalValue = text.slice(finding.start, finding.end);
    const normalizedValue = normalizeEntityValue(finding.entityType, originalValue);
    const identityKey = `${finding.entityType}\u0000${normalizedValue}`;
    let entry = identities.get(identityKey);
    if (!entry) {
      entry = {
        id: `sv_${prefixFor(finding.entityType)}_${createId()}`,
        entityType: finding.entityType,
        normalizedValue,
        originalValue,
        occurrences: 0,
      };
      identities.set(identityKey, entry);
    }
    occurrenceCounts.set(entry.id, (occurrenceCounts.get(entry.id) ?? 0) + 1);
    return { ...finding, vaultId: entry.id };
  });

  const activeIds = new Set(indexed.map((finding) => finding.vaultId));
  const entries = [...identities.values()]
    .filter((entry) => activeIds.has(entry.id))
    .map((entry) => ({ ...entry, occurrences: occurrenceCounts.get(entry.id) ?? 0 }))
    .sort((a, b) => a.entityType.localeCompare(b.entityType) || a.id.localeCompare(b.id));

  return { findings: indexed, entries };
}

export function shortVaultId(id: string) {
  const [namespace, type, uuid] = id.split("_");
  return `${namespace}_${type}_${uuid?.slice(0, 8) ?? ""}`;
}
