/** Locale-independent ordering for reproducible hashes and tie breaks. */
export const compareText = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;

/** Canonical JSON for JSON-compatible values. Reject silent non-finite coercions. */
export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value).sort(([a], [b]) => compareText(a, b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  throw new Error("A kanonikus adat csak JSON-értékeket tartalmazhat.");
}

export async function digestHex(algorithm: "SHA-1" | "SHA-256", bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, new Uint8Array(bytes));
  return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, "0")).join("");
}

export const hashJson = async (value: unknown): Promise<string> =>
  `sha256:${await digestHex("SHA-256", new TextEncoder().encode(canonicalJson(value)))}`;

export async function gitBlobSha1(bytes: Uint8Array): Promise<string> {
  const header = new TextEncoder().encode(`blob ${bytes.byteLength}\0`);
  const payload = new Uint8Array(header.byteLength + bytes.byteLength);
  payload.set(header);
  payload.set(bytes, header.byteLength);
  return digestHex("SHA-1", payload);
}
